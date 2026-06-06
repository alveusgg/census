# SSE scalability load report

## Summary

The updated SSE listener implementation was load tested with production-built API containers and raw tRPC SSE clients.

The main result is that SSE scale is memory-bound at idle and CPU-spiky during fan-out. A `512m` container handled 1000 idle `users.live.recentAchievements` subscriptions, but failed during a 1500-connection ramp from Node/V8 heap exhaustion. The same image with a `2g` memory limit handled 3000 idle subscriptions and a 3000-subscriber update burst.

Recommended starting point:

- For `512m` API containers, stay below 1000 concurrent SSE clients per process unless longer soak testing proves more headroom.
- For `2g` API containers, 3000 concurrent SSE clients per process looked viable in short local tests, but update bursts can briefly saturate one CPU.
- If more than 1000 subscribers can share one listener key, raise or disable the local fan-out emitter's max-listener warning threshold intentionally.

## What Was Tested

Endpoint:

```txt
users.live.recentAchievements
```

Implementation path under test:

- Postgres logical replication notification enters `census/api/src/db/listen.ts`.
- Keyed in-process listeners wake only interested subscribers.
- `defineListener` coalesces snapshot reads and fans one snapshot out to local SSE subscribers.
- tRPC SSE streams deliver the results to clients.

Load generator:

```txt
scripts/sse-load.mjs
```

The script opens raw HTTP SSE streams with Node `fetch`, tracks data/ping/error frames, and optionally samples the API container with `docker stats`.

## Environment

API image:

```sh
docker build --file census/api/Dockerfile --tag census-api-sse-test .
```

Runtime:

```txt
Docker via OrbStack
```

Stats source:

```sh
docker stats --no-stream --format '{{json .}}' census-api-sse-test
```

Local dependencies:

```sh
docker compose --file local/core-services.yml up -d
```

Container runtime notes:

- Tests used the production API image path.
- The container was run with `NODE_ENV=production`.
- Local S3 was disabled and dummy Mux credentials were supplied so the production container could boot for SSE-only tests without exercising those integrations.
- The API container exposed `35523` internally and `35524` on the host.

## Commands

Example idle run:

```sh
node scripts/sse-load.mjs \
  --url http://127.0.0.1:35524 \
  --connections 3000 \
  --duration 20 \
  --ramp 60 \
  --container census-api-sse-test \
  --stats-interval 2
```

Example update-burst run:

```sh
node scripts/sse-load.mjs \
  --url http://127.0.0.1:35524 \
  --connections 3000 \
  --duration 20 \
  --ramp 60 \
  --trigger-after 5 \
  --trigger-command "docker exec cc-db psql -U myuser -d db02 -tAc \"update achievements set revoked = revoked where id = (select id from achievements where redeemed = true and revoked = false order by created_at desc limit 1) returning id;\"" \
  --container census-api-sse-test \
  --stats-interval 2
```

The trigger statement is intentionally a no-op update:

```sql
update achievements
set revoked = revoked
where id = (
  select id
  from achievements
  where redeemed = true and revoked = false
  order by created_at desc
  limit 1
)
returning id;
```

It fires logical replication and the API's `achievements` listener without changing persisted achievement data.

## Source Data

### 512 MiB Idle Ladder

Container limit:

```txt
--cpus=1 --memory=512m
```

| Target connections | Connected | Client errors | Max memory | Avg CPU | Max CPU | Outcome |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 100 | 100 | 0 | 268.3 MiB | 3.43% | 33.37% | Pass |
| 500 | 500 | 0 | 374.1 MiB | 3.11% | 10.46% | Pass |
| 1000 | 1000 | 0 | 442.0 MiB | 8.08% | 74.84% | Pass |
| 1500 | 1239 | 1500 | 471.7 MiB before exit | 12.00% while alive | 96.79% | Failed during ramp |

The 1500-connection run exited during ramp. Docker reported `OOMKilled:false` and `ExitCode:134`. The process failed inside V8:

```txt
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

### 512 MiB Update Bursts

Container limit:

```txt
--cpus=1 --memory=512m
```

| Connections | Connected | Client errors | Post-trigger data frames | Trigger command time | First post-trigger data | Max memory | Avg CPU | Max CPU | Outcome |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 500 | 500 | 0 | 500 | 131 ms | 448 ms after command finished | 433.7 MiB | 3.91% | 10.14% | Pass |
| 1000 | 1000 | 0 | 1010 | 110 ms | immediately after command finished | 460.0 MiB | 9.68% | 78.70% | Pass |

The `Post-trigger data frames` value is from a raw SSE frame counter, not a typed tRPC application-message counter. It is good enough to prove delivery, but it can slightly over-count application messages. The 1000-client burst over-counted by 10 frames.

### 2 GiB Idle Ladder

Container limit:

```txt
--cpus=1 --memory=2g
```

These runs were done sequentially in one API container, so later rows include normal V8 heap growth and GC behavior from earlier rows rather than a fresh-process baseline.

| Target connections | Connected | Client errors | Max memory | Avg CPU | Max CPU | Outcome |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1500 | 1500 | 0 | 665.8 MiB | 4.98% | 13.53% | Pass |
| 2000 | 2000 | 0 | 726.5 MiB | 6.71% | 25.41% | Pass |
| 3000 | 3000 | 0 | 971.0 MiB | 9.72% | 39.54% | Pass |

The 3000-connection idle run had no client errors and the API container remained healthy. During ramp the script briefly logged `connected:2989`, but all 3000 connections completed before the final summary.

### 2 GiB Update Burst

Container limit:

```txt
--cpus=1 --memory=2g
```

| Connections | Connected | Client errors | Post-trigger data frames | Trigger command time | First post-trigger data | Max memory | Avg CPU | Max CPU | Outcome |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 3000 | 3000 | 0 | 3027 | 149 ms | 1 ms after command finished | 1019.0 MiB | 16.71% | 98.84% | Pass |

The 3000-subscriber update burst briefly saturated the single CPU while fanning out to every open response. It still completed without client errors, container OOM, or process failure.

## Conclusions

### Idle Scaling

Idle SSE subscriptions are primarily memory-bound. The 512 MiB container was stable at 1000 subscriptions but failed before 1500 completed. The 2 GiB container reached 3000 subscriptions with roughly 1 GiB peak memory in the short run.

The rough local-test memory shape was:

```txt
512 MiB container: 1000 connections -> ~442 MiB peak
2 GiB container: 3000 connections -> ~971 MiB peak
```

This is not a perfect per-connection linear model because V8 heap growth and GC behavior vary between runs, but it is enough to show that larger containers materially improve SSE headroom.

### Update Burst Scaling

The update-burst tests show the expected fan-out behavior: a single DB update can be delivered to hundreds or thousands of subscribers without N duplicate endpoint loops. CPU cost still exists because the process must write to every open HTTP response.

At 3000 subscribers on one CPU, fan-out caused a near-100% CPU sample. That means CPU can become the limiter during frequent bursts even when memory is sufficient.

### Query Coalescing

These tests verify client delivery and container resource behavior. They do not prove the exact SQL query count. The implementation should coalesce a burst to one snapshot load per listener key per API process, but proving that requires query instrumentation around `getRecentRedeemedAchievements` or database-side query stats.

### Listener Warning Threshold

Runs above 1000 subscribers produced expected warnings:

```txt
MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 1001 value listeners added
MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 1001 error listeners added
```

The warning comes from the listener fan-out emitter threshold, not from a test failure. If more than 1000 subscribers per listener key is expected, set that fan-out emitter threshold higher or to `0` intentionally.

### Node Heap Behavior

The 512 MiB failure was a Node/V8 heap limit failure, not Docker killing the container:

```txt
Docker OOMKilled:false
ExitCode:134
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

Node's V8 old-space heap limit can be controlled with `NODE_OPTIONS`:

```sh
NODE_OPTIONS=--max-old-space-size=384
```

Increasing this can move the failure point, but it does not create memory. The process also needs non-heap memory for sockets, buffers, native allocations, code space, stacks, OpenSSL, libuv, and dependencies. In a small container, setting the heap limit too close to the container limit can turn a clean V8 OOM into a container OOM kill or heavy GC thrash.

In a 2 GiB container, Node can grow substantially more before hitting a heap limit or container limit. It will not automatically fill the whole 2 GiB, but under enough active connections it can expand toward its V8 limit. Explicit heap sizing is useful if predictable failure behavior matters.

## Operational Guidance

For a first production posture:

- Prefer `2g` API containers if thousands of concurrent SSE clients per process are expected.
- Keep one-CPU containers in mind: memory may handle 3000 idle clients, but update fan-out can briefly saturate CPU.
- Treat 512 MiB containers as suitable for hundreds of SSE clients, not thousands.
- Use process-level connection metrics and container memory/CPU alerts around SSE rollout.
- Run a longer soak test before choosing final production concurrency limits.

Suggested next tests:

- 30-60 minute soak at 1000, 2000, and 3000 connections in a 2 GiB container.
- Update-burst loop, not a single update, to measure repeated fan-out CPU cost.
- Query instrumentation around `getRecentRedeemedAchievements` to confirm one snapshot query per listener key per process.
- A multi-replica test to validate per-process behavior under load balancer distribution.
