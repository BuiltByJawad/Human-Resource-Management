/*
  Warnings:

  - You are about to drop the column `isRead` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Notification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "loginAccentColor" TEXT DEFAULT '#2563eb',
ADD COLUMN     "loginBackgroundImage" TEXT,
ADD COLUMN     "loginHeroSubtitle" TEXT DEFAULT 'A modern HR workspace your teams will love',
ADD COLUMN     "loginHeroTitle" TEXT DEFAULT 'Empower your people',
ADD COLUMN     "loginHighlights" JSONB;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "isRead",
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "message" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "type" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
