-- CreateTable
CREATE TABLE "season_stats_cache" (
    "id" SERIAL NOT NULL,
    "playerId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_stats_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "season_stats_cache_playerId_platform_seasonId_key" ON "season_stats_cache"("playerId", "platform", "seasonId");
