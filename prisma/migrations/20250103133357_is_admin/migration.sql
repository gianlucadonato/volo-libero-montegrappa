-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'M',
ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false;
