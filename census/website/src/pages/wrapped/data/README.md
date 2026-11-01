# Season wrapped data

Static exports behind the season-in-review presentation (`../SeasonWrapped.tsx`).

| File | Produced by |
| --- | --- |
| `stats.json` | `stats.sql`: the season's headline counts and the top three on the leaderboard. |
| `wrapped.json` | `wrapped.sql`: the curated selections (captures, comments, suggestions, most spotted species, shinies), with `captures` then replaced by `rank_captures.py`. |
| `onboarding.json` | How first-timers and bug-skill levels break down. Aggregated from the free-text onboarding answers, judged with an LLM; the pipeline that produced it lived in the retired `census/video` project, so treat this file as fixed. |

Regenerate with a read-only analytics connection (the "Census Prod copy" connection in TablePlus):

```sh
cd census/website/src/pages/wrapped/data
DB="host=… dbname=census-prod-db user=analytics sslmode=require"
psql "$DB" -X -At -f stats.sql   > stats.json
psql "$DB" -X -At -f wrapped.sql > wrapped.json

# Then pick the captures from the sighting ranking export. With census/api/.env sourced the
# script reads image sizes from the local database first; otherwise it fetches JPEG headers.
python3 rank_captures.py ~/Downloads/capture-rankings.csv
```

`wrapped.sql` only considers primary identifications; accessory identifications (the plant a critter was
sitting on, and so on) still count towards the totals in `stats.sql` but never appear in the selections.
