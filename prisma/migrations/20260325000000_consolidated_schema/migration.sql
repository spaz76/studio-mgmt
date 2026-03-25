-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'OPERATOR', 'VIEWER');
-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('createWorkshop', 'editWorkshop', 'deleteWorkshop', 'manageBookings', 'createProduct', 'editProduct', 'updateProductStock', 'createMaterial', 'consumeMaterial', 'updatePaymentStatus', 'viewReports', 'exportReports', 'manageUsers', 'changePlan', 'editStudioSettings');
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
-- CreateEnum
CREATE TYPE "WorkshopStatus" AS ENUM ('draft', 'open', 'pending_minimum', 'confirmed', 'full', 'cancelled', 'postponed', 'completed');
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'waitlist');
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'partial', 'refunded', 'cancelled');
-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('open', 'in_progress', 'done');
-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('workshop', 'seasonal', 'material', 'manual');
-- CreateEnum
CREATE TYPE "StockLogAction" AS ENUM ('ordered', 'purchase', 'consumption', 'adjustment', 'loss');
-- CreateEnum
CREATE TYPE "WorkshopType" AS ENUM ('REGULAR', 'RECURRING', 'CLASS', 'SEASONAL', 'EVENT', 'PARENT_CHILD');
-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');
-- CreateEnum
CREATE TYPE "EventPricingModel" AS ENUM ('FLAT', 'PER_PARTICIPANT', 'PACKAGE');
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE');
-- CreateEnum
CREATE TYPE "TaskUrgency" AS ENUM ('HIGH', 'NORMAL', 'LOW');
-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('manual', 'event', 'product', 'material', 'payment');
-- CreateTable
CREATE TABLE "Studio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "planType" "PlanType" NOT NULL DEFAULT 'FREE',
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxWorkshopsPerMonth" INTEGER NOT NULL DEFAULT 20,
    "maxProducts" INTEGER NOT NULL DEFAULT 100,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 18.0,
    "pricesIncludeVat" BOOLEAN NOT NULL DEFAULT true,
    "fontFamily" TEXT,
    "fontSize" TEXT DEFAULT 'medium',
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "reviewsUrl" TEXT,
    "phoneNumber" TEXT,
    "whatsappNumber" TEXT,
    "hasOwnWebsite" BOOLEAN NOT NULL DEFAULT false,
    "paymentUrl" TEXT,
    "inviteChannel" TEXT DEFAULT 'both',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Studio_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "StudioMember" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "extraPermissions" "Permission"[],
    "revokedPermissions" "Permission"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    CONSTRAINT "StudioMember_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);
-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "preferredContactMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "WorkshopTemplate" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 120,
    "minParticipants" INTEGER NOT NULL DEFAULT 1,
    "maxParticipants" INTEGER NOT NULL DEFAULT 12,
    "defaultPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workshopType" "WorkshopType" NOT NULL DEFAULT 'REGULAR',
    "recurrenceFrequency" "RecurrenceFrequency",
    "recurrenceDayOfWeek" INTEGER,
    "recurrenceStartTime" TEXT,
    "recurrenceEndTime" TEXT,
    "seasonStartMonth" INTEGER,
    "seasonEndMonth" INTEGER,
    "seasonReminderDays" INTEGER[],
    "seasonPublishLeadDays" INTEGER,
    "seasonPrepLeadDays" INTEGER,
    "seasonOpenRegistrationDays" INTEGER,
    "seasonCloseRegistrationDays" INTEGER,
    "totalSessions" INTEGER,
    "eventContactName" TEXT,
    "eventContactPhone" TEXT,
    "eventSpecialRequests" TEXT,
    "eventPricingModel" "EventPricingModel",
    "ageRangeMin" INTEGER,
    "ageRangeMax" INTEGER,
    "requiresAdultSupervision" BOOLEAN NOT NULL DEFAULT true,
    "marketingText" TEXT,
    "internalNotes" TEXT,
    "registrationUrl" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkshopTemplate_pkey" PRIMARY KEY ("id")
);
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
-- CreateTable
CREATE TABLE "WorkshopEvent" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "WorkshopStatus" NOT NULL DEFAULT 'draft',
    "minParticipants" INTEGER NOT NULL DEFAULT 1,
    "maxParticipants" INTEGER NOT NULL DEFAULT 12,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "location" TEXT,
    "googleCalendarEventId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkshopEvent_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "workshopEventId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 1,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "publicToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "skuBase" TEXT NOT NULL,
    "category" TEXT,
    "categoryId" TEXT,
    "imageUrl" TEXT,
    "purchaseUrl" TEXT,
    "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
    "seasonStart" INTEGER,
    "seasonEnd" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "barcode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "SupplierContact" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "extension" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierContact_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'יחידה',
    "stockQuantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "lowStockThreshold" DECIMAL(10,3) NOT NULL DEFAULT 5,
    "orangeThreshold" DECIMAL(10,3) NOT NULL DEFAULT 10,
    "redThreshold" DECIMAL(10,3) NOT NULL DEFAULT 3,
    "barcode" TEXT,
    "notes" TEXT,
    "categoryId" TEXT,
    "purchaseUrl" TEXT,
    "pricePerUnit" DECIMAL(10,2),
    "pricePerPackage" DECIMAL(10,2),
    "packageSize" TEXT,
    "width" TEXT,
    "height" TEXT,
    "minTemp" INTEGER,
    "maxTemp" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "MaterialSupplier" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(10,2),
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaterialSupplier_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "MaterialStockLog" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "action" "StockLogAction" NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "notes" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialStockLog_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" "ReminderStatus" NOT NULL DEFAULT 'open',
    "type" "ReminderType" NOT NULL DEFAULT 'manual',
    "dueAt" TIMESTAMP(3),
    "createdById" TEXT,
    "assignedToId" TEXT,
    "relatedWorkshopEventId" TEXT,
    "relatedMaterialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);
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
    "studioId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "markedAt" TIMESTAMP(3),
    "punchCardId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "PunchCard" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "templateId" TEXT,
    "totalSessions" INTEGER NOT NULL,
    "usedSessions" INTEGER NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PunchCard_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'studio',
    "templateId" TEXT,
    "eventId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "reminderDate" TIMESTAMP(3),
    "category" "TaskCategory" NOT NULL DEFAULT 'manual',
    "status" "TaskStatus" NOT NULL DEFAULT 'NEW',
    "urgency" "TaskUrgency" NOT NULL DEFAULT 'NORMAL',
    "relatedId" TEXT,
    "relatedCustomerId" TEXT,
    "relatedSupplierId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Kiln" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "maxTemp" INTEGER,
    "capacity" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Kiln_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Firing" (
    "id" TEXT NOT NULL,
    "kilnId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "firingType" TEXT NOT NULL,
    "targetTemp" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "firingTypeId" TEXT,
    "loadLevel" TEXT,
    "estimatedEndAt" TIMESTAMP(3),
    "cooledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Firing_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "FiringType" (
    "id" TEXT NOT NULL,
    "kilnId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FiringType_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "FiringStage" (
    "id" TEXT NOT NULL,
    "firingTypeId" TEXT NOT NULL,
    "targetTemp" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "FiringStage_pkey" PRIMARY KEY ("id")
);
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
CREATE UNIQUE INDEX "Studio_slug_key" ON "Studio"("slug");
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- CreateIndex
CREATE INDEX "StudioMember_studioId_idx" ON "StudioMember"("studioId");
-- CreateIndex
CREATE UNIQUE INDEX "StudioMember_studioId_userId_key" ON "StudioMember"("studioId", "userId");
-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
-- CreateIndex
CREATE INDEX "Customer_studioId_idx" ON "Customer"("studioId");
-- CreateIndex
CREATE INDEX "Customer_studioId_email_idx" ON "Customer"("studioId", "email");
-- CreateIndex
CREATE INDEX "WorkshopTemplate_studioId_idx" ON "WorkshopTemplate"("studioId");
-- CreateIndex
CREATE INDEX "WorkshopTemplate_studioId_isArchived_idx" ON "WorkshopTemplate"("studioId", "isArchived");
-- CreateIndex
CREATE INDEX "TemplateImage_templateId_idx" ON "TemplateImage"("templateId");
-- CreateIndex
CREATE INDEX "WorkshopEvent_studioId_idx" ON "WorkshopEvent"("studioId");
-- CreateIndex
CREATE INDEX "WorkshopEvent_studioId_status_idx" ON "WorkshopEvent"("studioId", "status");
-- CreateIndex
CREATE INDEX "WorkshopEvent_studioId_startsAt_idx" ON "WorkshopEvent"("studioId", "startsAt");
-- CreateIndex
CREATE UNIQUE INDEX "Booking_publicToken_key" ON "Booking"("publicToken");
-- CreateIndex
CREATE INDEX "Booking_studioId_idx" ON "Booking"("studioId");
-- CreateIndex
CREATE INDEX "Booking_workshopEventId_idx" ON "Booking"("workshopEventId");
-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");
-- CreateIndex
CREATE INDEX "Payment_studioId_idx" ON "Payment"("studioId");
-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");
-- CreateIndex
CREATE INDEX "Payment_studioId_status_idx" ON "Payment"("studioId", "status");
-- CreateIndex
CREATE INDEX "Product_studioId_idx" ON "Product"("studioId");
-- CreateIndex
CREATE INDEX "Product_studioId_category_idx" ON "Product"("studioId", "category");
-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
-- CreateIndex
CREATE UNIQUE INDEX "Product_studioId_skuBase_key" ON "Product"("studioId", "skuBase");
-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
-- CreateIndex
CREATE INDEX "ProductVariant_studioId_idx" ON "ProductVariant"("studioId");
-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
-- CreateIndex
CREATE INDEX "Supplier_studioId_idx" ON "Supplier"("studioId");
-- CreateIndex
CREATE INDEX "SupplierContact_supplierId_idx" ON "SupplierContact"("supplierId");
-- CreateIndex
CREATE INDEX "Material_studioId_idx" ON "Material"("studioId");
-- CreateIndex
CREATE INDEX "Material_categoryId_idx" ON "Material"("categoryId");
-- CreateIndex
CREATE INDEX "MaterialSupplier_materialId_idx" ON "MaterialSupplier"("materialId");
-- CreateIndex
CREATE INDEX "MaterialSupplier_supplierId_idx" ON "MaterialSupplier"("supplierId");
-- CreateIndex
CREATE UNIQUE INDEX "MaterialSupplier_materialId_supplierId_key" ON "MaterialSupplier"("materialId", "supplierId");
-- CreateIndex
CREATE INDEX "MaterialStockLog_studioId_idx" ON "MaterialStockLog"("studioId");
-- CreateIndex
CREATE INDEX "MaterialStockLog_materialId_idx" ON "MaterialStockLog"("materialId");
-- CreateIndex
CREATE INDEX "Reminder_studioId_idx" ON "Reminder"("studioId");
-- CreateIndex
CREATE INDEX "Reminder_studioId_status_idx" ON "Reminder"("studioId", "status");
-- CreateIndex
CREATE INDEX "Reminder_studioId_dueAt_idx" ON "Reminder"("studioId", "dueAt");
-- CreateIndex
CREATE INDEX "PackageLineItem_templateId_idx" ON "PackageLineItem"("templateId");
-- CreateIndex
CREATE INDEX "PackageLineItem_workshopEventId_idx" ON "PackageLineItem"("workshopEventId");
-- CreateIndex
CREATE INDEX "Attendance_studioId_idx" ON "Attendance"("studioId");
-- CreateIndex
CREATE INDEX "Attendance_bookingId_idx" ON "Attendance"("bookingId");
-- CreateIndex
CREATE UNIQUE INDEX "Attendance_bookingId_key" ON "Attendance"("bookingId");
-- CreateIndex
CREATE INDEX "PunchCard_studioId_idx" ON "PunchCard"("studioId");
-- CreateIndex
CREATE INDEX "PunchCard_customerId_idx" ON "PunchCard"("customerId");
-- CreateIndex
CREATE INDEX "MessageTemplate_studioId_idx" ON "MessageTemplate"("studioId");
-- CreateIndex
CREATE INDEX "MessageTemplate_studioId_type_channel_idx" ON "MessageTemplate"("studioId", "type", "channel");
-- CreateIndex
CREATE INDEX "Task_studioId_idx" ON "Task"("studioId");
-- CreateIndex
CREATE INDEX "Task_studioId_completed_idx" ON "Task"("studioId", "completed");
-- CreateIndex
CREATE INDEX "Category_studioId_idx" ON "Category"("studioId");
-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
-- CreateIndex
CREATE INDEX "Kiln_studioId_idx" ON "Kiln"("studioId");
-- CreateIndex
CREATE INDEX "Firing_kilnId_idx" ON "Firing"("kilnId");
-- CreateIndex
CREATE INDEX "Firing_studioId_idx" ON "Firing"("studioId");
-- CreateIndex
CREATE INDEX "Firing_firingTypeId_idx" ON "Firing"("firingTypeId");
-- CreateIndex
CREATE INDEX "FiringType_kilnId_idx" ON "FiringType"("kilnId");
-- CreateIndex
CREATE INDEX "FiringType_studioId_idx" ON "FiringType"("studioId");
-- CreateIndex
CREATE INDEX "FiringStage_firingTypeId_idx" ON "FiringStage"("firingTypeId");
-- CreateIndex
CREATE INDEX "StudioIntegration_studioId_idx" ON "StudioIntegration"("studioId");
-- CreateIndex
CREATE UNIQUE INDEX "StudioIntegration_studioId_provider_key" ON "StudioIntegration"("studioId", "provider");
-- AddForeignKey
ALTER TABLE "StudioMember" ADD CONSTRAINT "StudioMember_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "StudioMember" ADD CONSTRAINT "StudioMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkshopTemplate" ADD CONSTRAINT "WorkshopTemplate_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "TemplateImage" ADD CONSTRAINT "TemplateImage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkshopTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkshopEvent" ADD CONSTRAINT "WorkshopEvent_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkshopEvent" ADD CONSTRAINT "WorkshopEvent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkshopTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "WorkshopEvent" ADD CONSTRAINT "WorkshopEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_workshopEventId_fkey" FOREIGN KEY ("workshopEventId") REFERENCES "WorkshopEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MaterialSupplier" ADD CONSTRAINT "MaterialSupplier_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MaterialSupplier" ADD CONSTRAINT "MaterialSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MaterialStockLog" ADD CONSTRAINT "MaterialStockLog_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MaterialStockLog" ADD CONSTRAINT "MaterialStockLog_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MaterialStockLog" ADD CONSTRAINT "MaterialStockLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_relatedWorkshopEventId_fkey" FOREIGN KEY ("relatedWorkshopEventId") REFERENCES "WorkshopEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_relatedMaterialId_fkey" FOREIGN KEY ("relatedMaterialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PackageLineItem" ADD CONSTRAINT "PackageLineItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkshopTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PackageLineItem" ADD CONSTRAINT "PackageLineItem_workshopEventId_fkey" FOREIGN KEY ("workshopEventId") REFERENCES "WorkshopEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_punchCardId_fkey" FOREIGN KEY ("punchCardId") REFERENCES "PunchCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PunchCard" ADD CONSTRAINT "PunchCard_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PunchCard" ADD CONSTRAINT "PunchCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PunchCard" ADD CONSTRAINT "PunchCard_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkshopTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Kiln" ADD CONSTRAINT "Kiln_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Firing" ADD CONSTRAINT "Firing_kilnId_fkey" FOREIGN KEY ("kilnId") REFERENCES "Kiln"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Firing" ADD CONSTRAINT "Firing_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Firing" ADD CONSTRAINT "Firing_firingTypeId_fkey" FOREIGN KEY ("firingTypeId") REFERENCES "FiringType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "FiringType" ADD CONSTRAINT "FiringType_kilnId_fkey" FOREIGN KEY ("kilnId") REFERENCES "Kiln"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "FiringType" ADD CONSTRAINT "FiringType_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "FiringStage" ADD CONSTRAINT "FiringStage_firingTypeId_fkey" FOREIGN KEY ("firingTypeId") REFERENCES "FiringType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "StudioIntegration" ADD CONSTRAINT "StudioIntegration_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
