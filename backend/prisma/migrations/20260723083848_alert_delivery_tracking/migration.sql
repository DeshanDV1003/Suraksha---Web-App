-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "broadcastRadiusKm" DOUBLE PRECISION,
ADD COLUMN     "notifiedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "alertId" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE SET NULL ON UPDATE CASCADE;
