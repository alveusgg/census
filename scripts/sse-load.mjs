#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const parseArgs = () => {
  const options = {
    url: 'http://127.0.0.1:35523',
    path: 'users.live.recentAchievements',
    connections: 100,
    duration: 60,
    ramp: 10,
    statsInterval: 5,
    triggerAfter: undefined,
    triggerCommand: undefined,
    input: undefined,
    container: undefined,
    output: undefined
  };

  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    const next = process.argv[i + 1];

    if (arg === '--url') options.url = next;
    else if (arg === '--path') options.path = next;
    else if (arg === '--connections') options.connections = Number(next);
    else if (arg === '--duration') options.duration = Number(next);
    else if (arg === '--ramp') options.ramp = Number(next);
    else if (arg === '--stats-interval') options.statsInterval = Number(next);
    else if (arg === '--trigger-after') options.triggerAfter = Number(next);
    else if (arg === '--trigger-command') options.triggerCommand = next;
    else if (arg === '--input') options.input = JSON.parse(next);
    else if (arg === '--container') options.container = next;
    else if (arg === '--output') options.output = next;
    else if (arg === '--help') {
      console.log(`Usage: node scripts/sse-load.mjs [options]

Options:
  --url <url>                  tRPC base URL (default: http://127.0.0.1:35523)
  --path <path>                Subscription path (default: users.live.recentAchievements)
  --input <json>               Procedure input. Encoded as SuperJSON input.
  --connections <n>            Number of concurrent SSE connections (default: 100)
  --duration <seconds>         Time to hold connections after ramp (default: 60)
  --ramp <seconds>             Ramp-up time for opening connections (default: 10)
  --container <name-or-id>     Optional Docker container to sample with docker stats
  --stats-interval <seconds>   Docker stats sample interval (default: 5)
  --trigger-after <seconds>    Run trigger command this many seconds after ramp completes
  --trigger-command <command>  Shell command to run during the hold phase
  --output <path>              Optional JSON output file
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }

    i += 1;
  }

  return options;
};

const createSubscriptionUrl = ({ url, path, input }) => {
  const base = url.replace(/\/$/, '');
  const subscription = new URL(`${base}/${path}`);

  if (input !== undefined) {
    subscription.searchParams.set('input', JSON.stringify({ json: input }));
  }

  return subscription.toString();
};

const parsePercent = value => Number(value.replace('%', ''));

const parseMemoryMiB = value => {
  const [used] = value.split('/').map(part => part.trim());
  const match = used.match(/^([0-9.]+)([KMGT]?i?)B$/i);
  if (!match) return undefined;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('k')) return amount / 1024;
  if (unit.startsWith('g')) return amount * 1024;
  if (unit.startsWith('t')) return amount * 1024 * 1024;
  return amount;
};

const sampleDockerStats = container => {
  const result = spawnSync('docker', ['stats', '--no-stream', '--format', '{{json .}}', container], {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    return { error: result.stderr.trim() || result.stdout.trim() || `docker stats exited ${result.status}` };
  }

  const raw = JSON.parse(result.stdout.trim());
  return {
    raw,
    cpuPercent: parsePercent(raw.CPUPerc),
    memoryMiB: parseMemoryMiB(raw.MemUsage),
    pids: Number(raw.PIDs)
  };
};

const runTrigger = command => {
  const startedAt = new Date();
  const result = spawnSync(command, {
    encoding: 'utf8',
    shell: true
  });
  const finishedAt = new Date();

  return {
    command,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    elapsedMs: finishedAt.getTime() - startedAt.getTime(),
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
};

const readSse = async ({ id, url, signal, counters, triggered }) => {
  counters.started += 1;

  try {
    const response = await fetch(url, {
      headers: { accept: 'text/event-stream' },
      signal
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    counters.connected += 1;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (frame.includes('data:')) {
          counters.events += 1;

          if (triggered.at) {
            counters.eventsAfterTrigger += 1;
            if (!counters.firstEventAfterTriggerAt) {
              counters.firstEventAfterTriggerAt = new Date().toISOString();
            }
          }
        }
        if (frame.includes(': ping') || frame.includes('event: ping')) counters.pings += 1;

        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    if (!signal.aborted) {
      counters.errors += 1;
      counters.errorSamples.push({ id, message: error.message });
      counters.errorSamples = counters.errorSamples.slice(0, 10);
    }
  } finally {
    counters.closed += 1;
  }
};

const summarizeStats = samples => {
  const good = samples.filter(sample => !sample.error);
  const max = selector => (good.length ? Math.max(...good.map(selector).filter(Number.isFinite)) : undefined);
  const avg = selector => {
    const values = good.map(selector).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
  };

  return {
    samples: samples.length,
    statsErrors: samples.filter(sample => sample.error).length,
    avgCpuPercent: avg(sample => sample.cpuPercent),
    maxCpuPercent: max(sample => sample.cpuPercent),
    avgMemoryMiB: avg(sample => sample.memoryMiB),
    maxMemoryMiB: max(sample => sample.memoryMiB),
    maxPids: max(sample => sample.pids)
  };
};

const main = async () => {
  const options = parseArgs();
  const subscriptionUrl = createSubscriptionUrl(options);
  const startedAt = new Date();
  const controller = new AbortController();
  const counters = {
    started: 0,
    connected: 0,
    closed: 0,
    events: 0,
    eventsAfterTrigger: 0,
    pings: 0,
    errors: 0,
    firstEventAfterTriggerAt: undefined,
    errorSamples: []
  };
  const samples = [];
  const triggered = { at: undefined, result: undefined };

  console.log(
    JSON.stringify({
      event: 'start',
      startedAt: startedAt.toISOString(),
      ...options,
      subscriptionUrl
    })
  );

  const statsLoop = options.container
    ? (async () => {
        while (!controller.signal.aborted) {
          const sample = { at: new Date().toISOString(), ...sampleDockerStats(options.container) };
          samples.push(sample);
          console.log(JSON.stringify({ event: 'stats', ...sample }));
          await sleep(options.statsInterval * 1000, undefined, { signal: controller.signal }).catch(() => {});
        }
      })()
    : undefined;

  const tasks = [];
  const rampDelay = options.connections > 0 ? (options.ramp * 1000) / options.connections : 0;
  for (let id = 0; id < options.connections; id += 1) {
    tasks.push(readSse({ id, url: subscriptionUrl, signal: controller.signal, counters, triggered }));
    if (rampDelay > 0) await sleep(rampDelay);
  }

  console.log(JSON.stringify({ event: 'ramped', at: new Date().toISOString(), counters }));

  if (options.triggerCommand) {
    if (options.triggerAfter && options.triggerAfter > 0) {
      await sleep(options.triggerAfter * 1000);
    }

    triggered.at = new Date().toISOString();
    triggered.result = runTrigger(options.triggerCommand);
    console.log(JSON.stringify({ event: 'trigger', at: triggered.at, result: triggered.result }));

    const remaining = Math.max(0, options.duration - (options.triggerAfter ?? 0));
    await sleep(remaining * 1000);
  } else {
    await sleep(options.duration * 1000);
  }
  controller.abort();
  await Promise.allSettled(tasks);
  await statsLoop?.catch(() => {});

  const finishedAt = new Date();
  const report = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    elapsedSeconds: (finishedAt.getTime() - startedAt.getTime()) / 1000,
    options,
    subscriptionUrl,
    counters,
    trigger: triggered,
    dockerStats: summarizeStats(samples),
    samples
  };

  console.log(JSON.stringify({ event: 'summary', ...report }, null, 2));

  if (options.output) {
    await import('node:fs/promises').then(fs => fs.writeFile(options.output, JSON.stringify(report, null, 2)));
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
