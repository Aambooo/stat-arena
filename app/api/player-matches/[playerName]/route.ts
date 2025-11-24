import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshPlayerMatches } from '@/lib/cache/refreshPlayerMatches';

const STALE_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(
  req: NextRequest,
  context: { params: { playerName: string } } | any
) {
  const url = new URL(req.url);
  const shard = url.searchParams.get('shard') ?? 'steam';
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const force = url.searchParams.get('refresh') === '1';

  const playerName = decodeURIComponent(context.params?.playerName ?? '');
  const db = prisma as any;

  try {
    // Read freshness info
    let meta = await db.playerCacheMeta.findUnique({
      where: { playerName_shard: { playerName, shard } },
    });

    const isStale =
      !meta || Date.now() - new Date(meta.lastFetchedAt).getTime() > STALE_MS;

    // --- FORCE REFRESH (user clicked "Refresh now") ---
    if (force) {
      try {
        await refreshPlayerMatches(playerName, { shard, limit });
      } catch (err: any) {
        // 🔥 If PUBG returned 429, fallback to cached data
        if (String(err?.message || '').includes('429')) {
          console.warn(`PUBG API rate limit hit (429) for ${playerName}`);

          const cached = await db.playerMatchCache.findMany({
            where: { playerName, shard },
            orderBy: { createdAt: 'desc' },
            take: limit,
          });

          if (cached.length > 0) {
            return NextResponse.json(
              {
                playerName,
                shard,
                limit,
                stale: true,
                rateLimited: true,
                matches: cached.map((row: any) => row.data),
              },
              { status: 200 }
            );
          }

          // no cached matches → user must wait
          return NextResponse.json(
            {
              error: 'rate_limited',
              details:
                'PUBG API returned 429 (Too Many Requests). Try again in a few minutes.',
            },
            { status: 429 }
          );
        }

        throw err; // real error
      }

      meta = await db.playerCacheMeta.findUnique({
        where: { playerName_shard: { playerName, shard } },
      });
    }

    // --- BACKGROUND REFRESH (stale only) ---
    if (isStale && !force) {
      refreshPlayerMatches(playerName, { shard, limit }).catch((e) =>
        console.error('Background refresh failed:', e)
      );
    }

    // --- ALWAYS RETURN CACHED MATCHES ---
    const cached = await db.playerMatchCache.findMany({
      where: { playerName, shard },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(
      {
        playerName,
        shard,
        limit,
        stale: force ? false : isStale,
        lastFetchedAt: meta?.lastFetchedAt ?? null,
        matches: cached.map((row: any) => row.data),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (err: any) {
    console.error('player-matches GET error:', err);

    return NextResponse.json(
      {
        error: 'Failed to fetch cached matches',
        details: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
