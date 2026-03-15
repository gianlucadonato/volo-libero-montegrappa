/*
  Warnings:

  - You are about to drop the column `validFrom` on the `user_membership` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `user_membership` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_membership" DROP COLUMN "validFrom",
DROP COLUMN "validUntil",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "valid_from" TIMESTAMP(3),
ADD COLUMN     "valid_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email_verified" TIMESTAMP(3);
