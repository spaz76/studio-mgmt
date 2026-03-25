-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "preferredContactMethod" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "paymentUrl" TEXT;

-- CreateTable
CREATE TABLE "StudioIntegration" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "calendarId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioIntegration_studioId_idx" ON "StudioIntegration"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioIntegration_studioId_provider_key" ON "StudioIntegration"("studioId", "provider");

-- AddForeignKey
ALTER TABLE "StudioIntegration" ADD CONSTRAINT "StudioIntegration_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
