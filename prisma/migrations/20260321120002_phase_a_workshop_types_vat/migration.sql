-- CreateEnum
CREATE TYPE "EventPricingModel" AS ENUM ('FLAT', 'PER_PARTICIPANT', 'PACKAGE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('ATTENDED', 'ABSENT', 'MADE_UP');

-- AlterEnum
ALTER TYPE "WorkshopType" ADD VALUE 'CLASS';

-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "pricesIncludeVat" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 18.0;

-- AlterTable
ALTER TABLE "WorkshopTemplate" ADD COLUMN     "eventPricingModel" "EventPricingModel",
ADD COLUMN     "totalSessions" INTEGER;

-- CreateTable
CREATE TABLE "PackageLineItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "workshopEventId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "workshopEventId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "madeUpEventId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackageLineItem_templateId_idx" ON "PackageLineItem"("templateId");

-- CreateIndex
CREATE INDEX "PackageLineItem_workshopEventId_idx" ON "PackageLineItem"("workshopEventId");

-- CreateIndex
CREATE INDEX "Attendance_workshopEventId_idx" ON "Attendance"("workshopEventId");

-- CreateIndex
CREATE INDEX "Attendance_customerId_idx" ON "Attendance"("customerId");

-- AddForeignKey
ALTER TABLE "PackageLineItem" ADD CONSTRAINT "PackageLineItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkshopTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageLineItem" ADD CONSTRAINT "PackageLineItem_workshopEventId_fkey" FOREIGN KEY ("workshopEventId") REFERENCES "WorkshopEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_workshopEventId_fkey" FOREIGN KEY ("workshopEventId") REFERENCES "WorkshopEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_madeUpEventId_fkey" FOREIGN KEY ("madeUpEventId") REFERENCES "WorkshopEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
