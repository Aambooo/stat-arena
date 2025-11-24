// lib/cache/refreshSeasonStats.ts
import { db } from "@/lib/db";
import { getCurrentSeasonId, getPlayerSeasonStats } from "@/lib/pubg-api";

const SEASON_STATS_TTL_MINUTES = 30; // cache lifetime

type Args = {
  playerId: string;
  platform: string; // shard, e.g. "steam"
  forceRefresh?: boolean;
};

export async function getOrRefreshSeasonStats({
  playerId,
  platform,
  forceRefresh = false,
}: Args) {
  const now = new Date();

  // 1) Get current season id (if this fails, we can't continue)
  const seasonId = await getCurrentSeasonId(platform);
  if (!seasonId) {
    throw new Error(`No current season found for shard: ${platform}`);
  }

  // ------ READ FROM CACHE (BEST-EFFORT) ------
  if (!forceRefresh) {
    try {
      const cached = await db.seasonStatsCache.findFirst({
        where: {
          playerId,
          platform,
          seasonId,
          expiresAt: { gt: now },
        },
      });

      if (cached) {
        return {
          data: cached.data,
          fromCache: true,
        };
      }
    } catch (err) {
      console.error("SeasonStatsCache read error (ignoring and falling back):", err);
      // continue to fetch fresh data
    }
  }

  // ------ FETCH FRESH FROM PUBG API ------
  const freshData = await getPlayerSeasonStats(playerId, platform, seasonId);

  const expiresAt = new Date(
    now.getTime() + SEASON_STATS_TTL_MINUTES * 60 * 1000
  );

  // ------ WRITE TO CACHE (BEST-EFFORT) ------
  try {
    await db.seasonStatsCache.upsert({
      // NOTE: if this 'where' is misconfigured, it will just log and continue
      where: {
        season_stats_cache_key: {
          playerId,
          platform,
          seasonId,
        },
      },
      create: {
        playerId,
        platform,
        seasonId,
        data: freshData,
        fetchedAt: now,
        expiresAt,
      },
      update: {
        data: freshData,
        fetchedAt: now,
        expiresAt,
      },
    });
  } catch (err) {
    console.error("SeasonStatsCache write error (ignoring):", err);
    // ignoring cache write errors keeps the API working
  }

  return {
    data: freshData,
    fromCache: false,
  };
}
