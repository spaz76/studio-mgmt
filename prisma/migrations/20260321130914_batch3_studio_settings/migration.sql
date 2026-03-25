-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "fontFamily" TEXT,
ADD COLUMN     "fontSize" TEXT DEFAULT 'medium',
ADD COLUMN     "hasOwnWebsite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "reviewsUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;
