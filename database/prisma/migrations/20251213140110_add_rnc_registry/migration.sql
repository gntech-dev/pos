-- CreateTable
CREATE TABLE "RNCRegistry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rnc" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT,
    "province" TEXT,
    "municipality" TEXT,
    "sector" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "lastSyncDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RNCRegistry_rnc_key" ON "RNCRegistry"("rnc");
