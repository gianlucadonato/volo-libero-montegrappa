-- CreateTable
CREATE TABLE "elmeteo_forecasts" (
    "id" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "cloudsHigh" INTEGER,
    "cloudsMedium" INTEGER,
    "cloudsLow" INTEGER,
    "risk" TEXT,
    "temperatureC" DOUBLE PRECISION,
    "precipitationMm" DOUBLE PRECISION,
    "maxFlightAltitude" TEXT,
    "cloudBaseMinM" INTEGER,
    "cloudBaseMaxM" INTEGER,
    "thermalUpdraftsM" INTEGER[],
    "stableLayerM" INTEGER,
    "winds" JSONB NOT NULL,
    "altitudeM" INTEGER,
    "maxDailyCloudBaseM" INTEGER,
    "sourceUpdatedAt" TIMESTAMP(3),
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elmeteo_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "elmeteo_forecasts_site_day_idx" ON "elmeteo_forecasts"("site", "day");

-- CreateIndex
CREATE UNIQUE INDEX "elmeteo_forecasts_site_day_hour_key" ON "elmeteo_forecasts"("site", "day", "hour");
