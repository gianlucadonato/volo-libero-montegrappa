-- Adds the columns the hourly table was throwing away, and replaces the
-- stable-layer scalar with the range list the source actually publishes.
--
-- `stableLayerM` is dropped rather than migrated: it held the first number of
-- a cell reading "*BETWEEN 1548m AND 1795m, *BETWEEN 2049m AND 2312m," — the
-- lower bound of the first of up to two bands — so neither the upper bound nor
-- the second band can be recovered from it. Nothing is lost by dropping it:
-- this table is a three-day scrape cache of elmeteo.it, and the next refresh
-- rewrites every row from the source with the bands parsed in full.
ALTER TABLE "elmeteo_forecasts" DROP COLUMN "stableLayerM",
ADD COLUMN     "cloudBaseBelowTakeOff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxFlightMaxM" INTEGER,
ADD COLUMN     "maxFlightMinM" INTEGER,
ADD COLUMN     "reachableUpdraftsM" INTEGER[],
ADD COLUMN     "riskLevel" TEXT,
ADD COLUMN     "stableLayers" JSONB NOT NULL DEFAULT '[]';
