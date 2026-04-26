-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EntryPoint" AS ENUM ('DIRECT', 'VAULT');

-- CreateTable
CREATE TABLE "User" (
    "address" TEXT NOT NULL,
    "totalPointsRaw" TEXT NOT NULL DEFAULT '0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Shard" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "entrypoint" "EntryPoint" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceAsset" TEXT NOT NULL,
    "sourceQuantityRaw" TEXT NOT NULL,
    "sourceDecimals" INTEGER NOT NULL,
    "principalUsdRaw" TEXT NOT NULL,
    "accruedPointsRaw" TEXT NOT NULL DEFAULT '0',
    "lockedRateRaw" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "lastAccrualTime" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "vaultMultRaw" TEXT NOT NULL,
    "mMaxRaw" TEXT NOT NULL,
    "tCapSeconds" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shard_userAddress_entrypoint_sourceAsset_active_startTime_c_idx" ON "Shard"("userAddress", "entrypoint", "sourceAsset", "active", "startTime", "createdAt");

-- CreateIndex
CREATE INDEX "Shard_active_idx" ON "Shard"("active");

-- AddForeignKey
ALTER TABLE "Shard" ADD CONSTRAINT "Shard_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
