-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "note" TEXT;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
