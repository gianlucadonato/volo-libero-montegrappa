/*
  Warnings:

  - The primary key for the `xc_enrollments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `xc_enrollments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "xc_enrollments_edition_id_idx";

-- DropIndex
DROP INDEX "xc_enrollments_user_id_edition_id_key";

-- AlterTable
ALTER TABLE "xc_enrollments" DROP CONSTRAINT "xc_enrollments_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "xc_enrollments_pkey" PRIMARY KEY ("user_id", "edition_id");
