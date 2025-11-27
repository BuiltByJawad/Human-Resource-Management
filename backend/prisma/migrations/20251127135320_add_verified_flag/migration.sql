-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserInvite" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "UserInvite_userId_idx" ON "UserInvite"("userId");

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
