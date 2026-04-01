-- CreateEnum
CREATE TYPE "XcCategoryLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "XcEnrollmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "XcTrackFileType" AS ENUM ('GPX', 'IGC');

-- CreateEnum
CREATE TYPE "XcSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "xc_editions" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "basic_min_points" INTEGER NOT NULL DEFAULT 10,
    "inter_min_points" INTEGER NOT NULL DEFAULT 15,
    "adv_min_points" INTEGER NOT NULL DEFAULT 20,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_categories" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "level" "XcCategoryLevel" NOT NULL,
    "min_points" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_tasks" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL,
    "distance_km" DOUBLE PRECISION,
    "task_file_url" TEXT,
    "image_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_task_waypoints" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius_meters" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_task_waypoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "status" "XcEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_track_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "file_type" "XcTrackFileType" NOT NULL,
    "status" "XcSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 's3',
    "storage_bucket" TEXT,
    "storage_object_key" TEXT NOT NULL,
    "checksum" TEXT,
    "notes" TEXT,
    "points_awarded" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_track_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "achieved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "xc_editions_year_key" ON "xc_editions"("year");

-- CreateIndex
CREATE INDEX "xc_editions_is_active_idx" ON "xc_editions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "xc_categories_edition_id_level_key" ON "xc_categories"("edition_id", "level");

-- CreateIndex
CREATE INDEX "xc_tasks_category_id_idx" ON "xc_tasks"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "xc_tasks_category_id_slug_key" ON "xc_tasks"("category_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "xc_task_waypoints_task_id_order_index_key" ON "xc_task_waypoints"("task_id", "order_index");

-- CreateIndex
CREATE INDEX "xc_enrollments_edition_id_idx" ON "xc_enrollments"("edition_id");

-- CreateIndex
CREATE UNIQUE INDEX "xc_enrollments_user_id_edition_id_key" ON "xc_enrollments"("user_id", "edition_id");

-- CreateIndex
CREATE INDEX "xc_track_submissions_user_id_edition_id_idx" ON "xc_track_submissions"("user_id", "edition_id");

-- CreateIndex
CREATE INDEX "xc_track_submissions_task_id_status_idx" ON "xc_track_submissions"("task_id", "status");

-- CreateIndex
CREATE INDEX "xc_track_submissions_status_idx" ON "xc_track_submissions"("status");

-- CreateIndex
CREATE INDEX "xc_achievements_user_id_edition_id_idx" ON "xc_achievements"("user_id", "edition_id");

-- CreateIndex
CREATE UNIQUE INDEX "xc_achievements_user_id_edition_id_category_id_key" ON "xc_achievements"("user_id", "edition_id", "category_id");

-- AddForeignKey
ALTER TABLE "xc_categories" ADD CONSTRAINT "xc_categories_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "xc_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_tasks" ADD CONSTRAINT "xc_tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "xc_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_task_waypoints" ADD CONSTRAINT "xc_task_waypoints_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "xc_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_enrollments" ADD CONSTRAINT "xc_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_enrollments" ADD CONSTRAINT "xc_enrollments_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "xc_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_track_submissions" ADD CONSTRAINT "xc_track_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_track_submissions" ADD CONSTRAINT "xc_track_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_track_submissions" ADD CONSTRAINT "xc_track_submissions_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "xc_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_track_submissions" ADD CONSTRAINT "xc_track_submissions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "xc_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_track_submissions" ADD CONSTRAINT "xc_track_submissions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "xc_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_achievements" ADD CONSTRAINT "xc_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_achievements" ADD CONSTRAINT "xc_achievements_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "xc_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_achievements" ADD CONSTRAINT "xc_achievements_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "xc_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
