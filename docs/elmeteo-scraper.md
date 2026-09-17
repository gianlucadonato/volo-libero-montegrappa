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
| `ELMETEO_SCRAPE_TOKEN` | for manual runs | bearer token the manual trigger authenticates with |

Without credentials the run still collects the two public take-offs and reports
the rest as failures, so a password change degrades the feature instead of
breaking the job.

Generate the token with `openssl rand -hex 32`. It is deliberately separate from
`ELMETEO_API_TOKEN`, which gates the uploader endpoint and its S3 retention
cleanup: a token that only kicks off a scrape has no business triggering
deletions. Without it the manual trigger answers `503` and the report-driven
runs carry on regardless.

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
time out and retry, doubling the load on the source. A second trigger while a
run is in flight gets `409`.

## What starts a run

**The uploader's report.** elmeteo.it pushes its map frames to S3 and then pings
`POST /api/elmeteo` with a report of the upload. That ping is the source saying
it has finished publishing a run, which is also when the take-off tables have
been recomputed — so the scrape hangs off it (`app/api/elmeteo/route.ts`) and
nothing has to guess at the timing. In practice that is four runs a day, around
04:36, 07:36, 16:37 and 19:36 UTC.

Both triggers share one in-process lock, so a manual run during an upload does
not double the load on the source; the second one logs `already running,
skipped` and returns.

There is also a manual trigger for backfills and for checking a deploy without
waiting for the next upload:

```bash
curl -X POST https://<app>/api/elmeteo/forecasts/refresh \
  -H "Authorization: Bearer $ELMETEO_SCRAPE_TOKEN"
```

It answers `202 Accepted` straight away and does the work in `after()`: a run
takes roughly 40 seconds, which is long enough for a proxy to time the request
out and retry, doubling the load on the source.

### Watch the publish time, not the clock

Every run logs `sourceUpdatedAt`, the timestamp the source prints on its own
pages. The pages are cached for an hour at the edge, and the tables are not
necessarily recomputed in the same breath as the map upload, so it is worth
confirming that the ping really does arrive after the tables refresh:

```sql
select site, day, max("sourceUpdatedAt") as published, max("scrapedAt") as scraped
from elmeteo_forecasts group by site, day order by site, day;
```

If `sourceUpdatedAt` repeatedly lags a run — the same value two runs running —
the scrape is landing before the source republishes. The fix is a short delay
before `refreshForecasts("report")`, not a return to a fixed schedule: the ping
is still the best signal available, it just needs a margin.

## Deploying

1. Set `ELMETEO_USERNAME`, `ELMETEO_PASSWORD` and `ELMETEO_SCRAPE_TOKEN` in the
   Dokploy environment for the app.
2. `pnpm db:deploy` to apply `20260917103239_add_elmeteo_forecasts`. The
   migration only creates a table and two indexes, so it is safe to run against
   a live database.
3. Trigger a run by hand and check the `ElMeteo forecast scrape completed` log
   line: `tables` should be 18 and `failures` 0.
4. After the next upload, check the same line appears with `trigger: "report"`.

No cron job to configure: the uploader's ping is the schedule.

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
| `app/api/elmeteo/route.ts` | uploader report; starts a run |
| `app/api/elmeteo/forecasts/refresh/route.ts` | token-gated manual trigger |
| `scripts/scrapeElmeteoForecasts.ts` | manual run |
| `tests/lib/elmeteo-forecast.test.ts` | parser tests against saved fixtures |
| `tests/fixtures/elmeteo/*.html` | real pages, saved verbatim |

When the source changes its markup the parser tests are what will tell you.
Re-save the fixture from the live page and run `pnpm test`.
