// lib/cache/refreshPlayerMatches.ts
import { db } from '@/lib/db';
import {
  searchPlayer,
  getPlayerMatches,
  getMatchDetails,
  // add:
  searchPlayerRaw,
} from '@/lib/pubg-api';

type RefreshOptions = { shard?: string; limit?: number };

export async function refreshPlayerMatches(
  playerName: string,
  opts: RefreshOptions = {}
) {
  const shard = opts.shard ?? 'steam';
  const limit = opts.limit ?? 20;

  // 1) try raw to get relationships.matches
  const raw = await searchPlayerRaw(playerName, shard);
  const first = raw?.data?.[0];
  let matchIds: string[] =
    first?.relationships?.matches?.data?.map((m: any) => m.id) ?? [];

  // optional fallback via your existing helper if raw list is empty
  if (!matchIds.length) {
    const player = await searchPlayer(playerName, shard);
    if (!player) return { ok: false, reason: 'PLAYER_NOT_FOUND' as const };
    const viaHelper = await getPlayerMatches(player.id, shard);
    matchIds = viaHelper ?? [];
  }

  // take newest N (API usually gives newest first)
  const recent = matchIds.slice(0, limit);

  // 2) fetch each match and upsert
  let cachedCount = 0;
  for (const matchId of recent) {
    try {
      const data = await getMatchDetails(matchId, shard);
      await db.playerMatchCache.upsert({
        where: {
          playerName_shard_matchId: { playerName, shard, matchId },
        },
        create: { playerName, shard, matchId, data },
        update: { data },
      });
      cachedCount += 1;

      // tiny delay to be gentle on PUBG API
      await new Promise((r) => setTimeout(r, 120));
    } catch (err) {
      console.error(`cache fail ${matchId}:`, err);
    }
  }

  // 3) update freshness
  await db.playerCacheMeta.upsert({
    where: { playerName_shard: { playerName, shard } },
    create: { playerName, shard, lastFetchedAt: new Date() },
    update: { lastFetchedAt: new Date() },
  });

  return { ok: true, playerName, shard, requested: limit, cached: cachedCount };
}
