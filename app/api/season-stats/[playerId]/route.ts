// app/api/season-stats/[playerId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOrRefreshSeasonStats } from "@/lib/cache/refreshSeasonStats";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const shard = url.searchParams.get("shard") ?? "steam";
    const forceRefresh = url.searchParams.get("refresh") === "1";

    // Extract [playerId] from the path: /api/season-stats/<playerId>
    const segments = req.nextUrl.pathname.split("/");
    const playerIdSlug = segments[segments.length - 1] || "";
    const playerId = decodeURIComponent(playerIdSlug);

    // 1) Use our cache helper instead of calling PUBG directly
    const { data: raw, fromCache } = await getOrRefreshSeasonStats({
      playerId,
      platform: shard,
      forceRefresh,
    });

    // 2) shape per-mode stats (same logic as before)
    const s = raw?.data?.attributes?.gameModeStats ?? {};
    const modes = ["solo", "duo", "squad"] as const;

    const shaped = Object.fromEntries(
      modes.map((m) => {
        const g = s[m] ?? {};
        const rounds = Number(g.roundsPlayed ?? 0);
        const wins = Number(g.wins ?? 0);
        const kills = Number(g.kills ?? 0);
        const damage = Number(g.damageDealt ?? 0);
        const top10s = Number(g.top10s ?? 0);
        const assists = Number(g.assists ?? 0);

        const deaths = Math.max(0, rounds - wins); // approximation
        const kd =
          deaths > 0 ? +(kills / deaths).toFixed(2) : kills > 0 ? kills : 0;
        const adr = rounds > 0 ? +(damage / rounds).toFixed(1) : 0;
        const winRate =
          rounds > 0 ? +((wins / rounds) * 100).toFixed(1) : 0;

        return [
          m,
          {
            roundsPlayed: rounds,
            wins,
            winRate, // %
            kills,
            kd, // approx K/D
            adr, // avg damage / round
            top10s,
            assists,
            damageDealt: damage,
          },
        ];
      })
    );

    // Try to recover seasonId from the API response
    const seasonId =
      raw?.data?.relationships?.season?.data?.id ?? "current";

    const headers = new Headers();
    headers.set("X-Cache", fromCache ? "HIT" : "MISS");
    headers.set(
      "Cache-Control",
      "public, max-age=30, stale-while-revalidate=60"
    );

    return NextResponse.json(
      {
        playerId,
        shard,
        seasonId,
        updatedAt: new Date().toISOString(),
        modes: shaped,
      },
      { status: 200, headers }
    );
  } catch (err: any) {
    console.error("season-stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch season stats",details: String(err?.message ?? err), },
      { status: 500 }
    );
  }
}
