import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshPlayerMatches } from '@/lib/cache/refreshPlayerMatches';

const STALE_MS = 6 * 60 * 60 * 1000; // 6h

// Note: use NextRequest + a very loose type for context so Vercel's type check is happy
export async function GET(
  req: NextRequest,
  context: { params: { playerName: string } } | any
) {
  try {
    const url = new URL(req.url);
    const shard = url.searchParams.get('shard') ?? 'steam';
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const force = url.searchParams.get('refresh') === '1';

    const playerName = decodeURIComponent(
      context.params?.playerName ?? ''
    );

    // treat prisma as any to avoid Vercel TS typing issues
    const db = prisma as any;

    // read freshness meta
    let meta = await db.playerCacheMeta.findUnique({
      where: { playerName_shard: { playerName, shard } },
    });

    const isStale =
      !meta || Date.now() - new Date(meta.lastFetchedAt).getTime() > STALE_MS;

    if (force) {
      await refreshPlayerMatches(playerName, { shard, limit });
      meta = await db.playerCacheMeta.findUnique({
        where: { playerName_shard: { playerName, shard } },
      });
    } else if (isStale) {
      // fire-and-forget background refresh
      refreshPlayerMatches(playerName, { shard, limit }).catch((e) =>
        console.error('refreshPlayerMatches failed:', e)
      );
    }

    const cached = await db.playerMatchCache.findMany({
      where: { playerName, shard },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      playerName,
      shard,
      limit,
      stale: force ? false : isStale,
      lastFetchedAt: meta?.lastFetchedAt ?? null,
      matches: cached.map((row: any) => row.data),
    });
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
