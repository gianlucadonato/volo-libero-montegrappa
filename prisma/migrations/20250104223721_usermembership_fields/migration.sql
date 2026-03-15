-- AlterTable
ALTER TABLE "membership" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "user_membership" ALTER COLUMN "validFrom" DROP NOT NULL,
ALTER COLUMN "validUntil" DROP NOT NULL,
ADD CONSTRAINT "user_membership_pkey" PRIMARY KEY ("id");
