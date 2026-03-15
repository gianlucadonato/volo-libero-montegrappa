-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "s3startTime" TIMESTAMP(3),
    "s3endTime" TIMESTAMP(3),
    "s3duration" TEXT,
    "s3error" TEXT,
    "ftpStartTime" TIMESTAMP(3),
    "ftpEndTime" TIMESTAMP(3),
    "ftpDuration" TEXT,
    "ftpError" TEXT,
    "totalFiles" INTEGER NOT NULL,
    "totalUploadedFiles" INTEGER NOT NULL,
    "totalBytes" INTEGER NOT NULL,
    "totalMegaBytes" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" TEXT,
    "error" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_folder_key" ON "reports"("folder");
