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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Kiln_studioId_idx" ON "Kiln"("studioId");

-- CreateIndex
CREATE INDEX "Firing_kilnId_idx" ON "Firing"("kilnId");

-- CreateIndex
CREATE INDEX "Firing_studioId_idx" ON "Firing"("studioId");

-- AddForeignKey
ALTER TABLE "Kiln" ADD CONSTRAINT "Kiln_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Firing" ADD CONSTRAINT "Firing_kilnId_fkey" FOREIGN KEY ("kilnId") REFERENCES "Kiln"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Firing" ADD CONSTRAINT "Firing_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
