-- CreateEnum
CREATE TYPE "XcCategoryLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

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
CREATE TABLE "xc_tasks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL,
    "category" "XcCategoryLevel" NOT NULL,
    "distance_km" DOUBLE PRECISION,
    "task_file_url" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_edition_tasks" (
    "edition_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_edition_tasks_pkey" PRIMARY KEY ("task_id","edition_id")
);

-- CreateTable
CREATE TABLE "xc_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
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
    "status" "XcSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "file_name" TEXT NOT NULL,
    "checksum" TEXT,
    "notes" TEXT,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_track_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xc_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "category" "XcCategoryLevel" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "min_points" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "xc_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "xc_editions_year_key" ON "xc_editions"("year");

-- CreateIndex
CREATE INDEX "xc_editions_is_active_idx" ON "xc_editions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "xc_tasks_category_slug_key" ON "xc_tasks"("category", "slug");

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
CREATE INDEX "xc_progress_user_id_edition_id_category_idx" ON "xc_progress"("user_id", "edition_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "xc_progress_user_id_edition_id_category_key" ON "xc_progress"("user_id", "edition_id", "category");

-- AddForeignKey
ALTER TABLE "xc_edition_tasks" ADD CONSTRAINT "xc_edition_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "xc_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_edition_tasks" ADD CONSTRAINT "xc_edition_tasks_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "xc_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "xc_progress" ADD CONSTRAINT "xc_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xc_progress" ADD CONSTRAINT "xc_progress_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "xc_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
