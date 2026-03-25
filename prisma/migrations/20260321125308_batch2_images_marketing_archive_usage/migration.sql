-- AlterTable
ALTER TABLE "WorkshopTemplate" ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingText" TEXT,
ADD COLUMN     "registrationUrl" TEXT,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TemplateImage" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TemplateImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateImage_templateId_idx" ON "TemplateImage"("templateId");

-- CreateIndex
CREATE INDEX "WorkshopTemplate_studioId_isArchived_idx" ON "WorkshopTemplate"("studioId", "isArchived");

-- AddForeignKey
ALTER TABLE "TemplateImage" ADD CONSTRAINT "TemplateImage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkshopTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
