# ElMeteo forecast scraper

Collects the hourly take-off forecasts published on elmeteo.it and stores them
in the `elmeteo_forecasts` table, so the club site can serve them without
sending pilots to an external login.

## What it collects

Six take-offs x three days (today, tomorrow, the day after) = 18 tables per run.

| Slug | Take-off | Page | Login |
| --- | --- | --- | --- |
| `tappeti` | Tappeti | `tappeti.php` | yes |
| `campeggia` | Campeggia | `campeggia.php` | yes |
| `panettone` | Panettone | `panettone.php` | no |
| `vedetta` | Vedetta | `vedetta.php` | yes |
| `tomba` | Monte Tomba | `tomba.php` | yes |
| `borso` | Landing Garden Relais | `borso.php` | no |

Verified against the live site: the four marked `yes` answer `302` to
`/non-hai-fatto-login/` when unauthenticated.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `ELMETEO_USERNAME` | for the 4 private sites | elmeteo.it account |
| `ELMETEO_PASSWORD` | for the 4 private sites | elmeteo.it password |
| `ELMETEO_SCRAPE_TOKEN` | yes | bearer token the trigger endpoint authenticates with |

Without credentials the run still collects the two public take-offs and reports
the rest as failures, so a password change degrades the feature instead of
breaking the job.

Generate the token with `openssl rand -hex 32`. It is deliberately separate from
`ELMETEO_API_TOKEN`, which gates the uploader endpoint and its S3 retention
cleanup: a token that only kicks off a scrape has no business triggering
deletions. Without it the endpoint answers `503` and nothing collects the
forecasts at all — it is the only way in.

## Running it

```bash
# Locally, against the live site: report only, no writes
pnpm tsx scripts/scrapeElmeteoForecasts.ts

# Same, and persist what it collects
pnpm tsx scripts/scrapeElmeteoForecasts.ts --save

# In production, the same path the scheduler uses
curl -X POST https://<app>/api/elmeteo/forecasts/refresh \
  -H "Authorization: Bearer $ELMETEO_SCRAPE_TOKEN"
```

The endpoint answers `202 Accepted` straight away and does the work in
`after()`: a run takes roughly 40 seconds, which is long enough for a proxy to
time out and retry, doubling the load on the source. A second run starting while
one is in flight logs `already running, skipped` and returns without fetching.

## What starts a run

**A Dokploy schedule**, twice a day. The source recomputes its take-off tables
on a fixed timetable and stamps each publish on the page itself; every row we
store carries that stamp as `sourceUpdatedAt`, and across all six sites it reads
08:15 UTC — **10:15 Europe/Rome** — with the evening publish twelve hours later
at 22:15 Rome. Two runs a day is the whole of it; a third would re-fetch
unchanged pages.

The schedule pings the trigger endpoint 15 minutes after each publish. The
margin is for the source's own edge cache, which holds a page for an hour: a
request that arrives in the same minute as the publish can still be served the
previous version.

| | Rome | UTC (summer) | UTC (winter) |
| --- | --- | --- | --- |
| Source publishes | 10:15 / 22:15 | 08:15 / 20:15 | 09:15 / 21:15 |
| Schedule fires | 10:30 / 22:30 | 08:30 / 20:30 | 09:30 / 21:30 |

### Configuring the schedule

In Dokploy, **the app → Schedules → Create**:

| Field | Value |
| --- | --- |
| Name | `ElMeteo forecast scrape` |
| Type | Application |
| Cron | `30 10,22 * * *` |
| Timezone | `Europe/Rome` |
| Shell | `bash` |

Command:

```bash
node -e 'fetch("http://localhost:3000/api/elmeteo/forecasts/refresh?trigger=schedule",{method:"POST",headers:{authorization:`Bearer ${process.env.ELMETEO_SCRAPE_TOKEN}`}}).then(async(r)=>{console.log(r.status,await r.text());process.exit(r.ok?0:1)}).catch((e)=>{console.error(e.message);process.exit(1)})'
```

Three details that are easy to get wrong:

- **Set the timezone field.** Dokploy defaults a schedule to UTC when it is
  left empty, and the runtime image sets no `TZ` either, so the container clock
  is UTC as well. Naming `Europe/Rome` is what keeps the run 15 minutes after
  the publish through the DST changeover instead of drifting an hour twice a
  year.
- **`node -e`, not `curl`.** The runtime image is `node:24-slim`, which ships
  neither `curl` nor `wget`. Node's global `fetch` is always there.
- **`?trigger=schedule`** only labels the log line. Leaving it off still runs
  the scrape, it just records it as `manual`.

The token is read from the app's own environment, so it is never written into
the schedule.

### Verifying it and watching the publish time

Every run logs `sourceUpdatedAt`, the timestamp the source prints on its own
pages — which is the number that says whether the schedule is landing in the
right place:

```sql
select site, day, max("sourceUpdatedAt") as published, max("scrapedAt") as scraped
from elmeteo_forecasts group by site, day order by site, day;
```

`published` should advance by one publish between consecutive runs. If it
repeats — the same value two runs running — the scrape is arriving before the
source republishes, or is being served a cached page; widen the margin by
pushing the cron later rather than by adding a second run.

There is also the manual trigger, for a backfill or for checking a deploy
without waiting for the next slot:

```bash
curl -X POST https://<app>/api/elmeteo/forecasts/refresh \
  -H "Authorization: Bearer $ELMETEO_SCRAPE_TOKEN"
```

Scheduled and manual runs share one in-process lock, so a manual run during a
scheduled one does not double the load on the source; the second logs `already
running, skipped` and returns.

## Deploying

1. Set `ELMETEO_USERNAME`, `ELMETEO_PASSWORD` and `ELMETEO_SCRAPE_TOKEN` in the
   Dokploy environment for the app.
2. `pnpm db:deploy` to apply `20260917103239_add_elmeteo_forecasts`. The
   migration only creates a table and two indexes, so it is safe to run against
   a live database.
3. Create the schedule described above.
4. Trigger a run by hand and check the `ElMeteo forecast scrape completed` log
   line: `tables` should be 18 and `failures` 0.
5. After the next slot, check the same line appears with `trigger: "schedule"`.

## Design notes

**Never follow links out of the fetched HTML.** elmeteo.it runs "Blackhole for
Bad Bots": `robots.txt` disallows `/*blackhole` and every page carries a hidden
`?blackhole=<hash>` link that no human can click. Requesting it bans the server's
IP permanently, which would take down the whole forecast feature. Only URLs built
by `buildForecastUrl` are ever requested — do not add a crawler here.

**No browser is needed.** The pages are server-rendered PHP and the day tabs are
plain `?day=YYYY-MM-DD` links, so `fetch` + `cheerio` is enough. This is why the
job runs in-process rather than in a Playwright container.

**One login per run.** The WordPress session cookie is obtained once and reused
for all 12 authenticated fetches, so a run costs one login rather than a dozen.

**Columns are resolved by header name, not position.** Sites publish different
column sets (Panettone 12, Borso 14 — it adds Wind 500m and Wind 1000m), so a
hardcoded index reads the wrong column on some of them. Because every value is a
plausible altitude or wind speed, that failure would be silent.

**`<br>` and `<p>` are line separators.** Cheerio's `.text()` joins them with
nothing in between, welding "MIN same altitude or lower" to "MAX 1700m" and
hiding the boundary from the parsers. All extraction goes through the `text()`
helper in `lib/elmeteo-forecast.ts`.

**Partial failure is normal.** Each (site, day) is fetched, parsed and saved
independently: one flaky page costs one table, not the run. Failures are counted
and logged with their reason.

## Files

| Path | Role |
| --- | --- |
| `lib/elmeteo-sites.ts` | site catalogue, URL building, forecast days |
| `lib/elmeteo-forecast.ts` | pure HTML -> forecast parser (unit-tested) |
| `lib/elmeteo-scraper.ts` | login, cookie reuse, fetch loop |
| `store/elmeteo-forecasts.ts` | upserts, reads, retention |
| `lib/elmeteo-forecast-refresh.ts` | scrape + save + prune, and the run lock |
| `app/api/elmeteo/forecasts/refresh/route.ts` | token-gated trigger; the only way in |
| `scripts/scrapeElmeteoForecasts.ts` | manual run |
| `tests/lib/elmeteo-forecast.test.ts` | parser tests against saved fixtures |
| `tests/fixtures/elmeteo/*.html` | real pages, saved verbatim |

When the source changes its markup the parser tests are what will tell you.
Re-save the fixture from the live page and run `pnpm test`.
