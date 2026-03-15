/*
  Warnings:

  - You are about to drop the `order` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[memberId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_membershipId_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_userId_fkey";

-- DropTable
DROP TABLE "order";

-- CreateIndex
CREATE UNIQUE INDEX "users_memberId_key" ON "users"("memberId");
