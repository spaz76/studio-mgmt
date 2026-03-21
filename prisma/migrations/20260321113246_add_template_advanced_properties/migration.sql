-- CreateEnum
CREATE TYPE "WorkshopType" AS ENUM ('REGULAR', 'RECURRING', 'SEASONAL', 'EVENT', 'PARENT_CHILD');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "WorkshopTemplate" ADD COLUMN     "ageRangeMax" INTEGER,
ADD COLUMN     "ageRangeMin" INTEGER,
ADD COLUMN     "eventContactName" TEXT,
ADD COLUMN     "eventContactPhone" TEXT,
ADD COLUMN     "eventSpecialRequests" TEXT,
ADD COLUMN     "recurrenceDayOfWeek" INTEGER,
ADD COLUMN     "recurrenceFrequency" "RecurrenceFrequency",
ADD COLUMN     "requiresAdultSupervision" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "seasonCloseRegistrationDays" INTEGER,
ADD COLUMN     "seasonEndMonth" INTEGER,
ADD COLUMN     "seasonOpenRegistrationDays" INTEGER,
ADD COLUMN     "seasonPrepLeadDays" INTEGER,
ADD COLUMN     "seasonPublishLeadDays" INTEGER,
ADD COLUMN     "seasonReminderDays" INTEGER[],
ADD COLUMN     "seasonStartMonth" INTEGER,
ADD COLUMN     "workshopType" "WorkshopType" NOT NULL DEFAULT 'REGULAR';
