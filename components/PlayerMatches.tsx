'use client';

import { useEffect, useState, useRef } from 'react';

function timeAgo(dt: string | null) {
  if (!dt) return 'never';
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

type ApiResp = {
  playerName: string;
  shard: string;
  limit: number;
  stale: boolean;
  lastFetchedAt: string | null;
  matches: any[]; // raw PUBG match JSON we cached
};

function fmt(dt?: string) {
  if (!dt) return '';
  return new Date(dt).toLocaleString("en-GB", {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getMyStats(match: any, playerName: string) {
  const included = match?.included ?? [];
  const me = included.find(
    (x: any) =>
      x.type === 'participant' &&
      x?.attributes?.stats?.name?.toLowerCase() === playerName.toLowerCase()
  );
  const s = me?.attributes?.stats;
  return {
    kills: s?.kills ?? 0,
    damage: s?.damageDealt ?? 0,
    time: s?.timeSurvived ? Math.round(s.timeSurvived / 60) + 'm' : '-',
    distance:
      s?.rideDistance != null && s?.walkDistance != null
        ? ((s.rideDistance + s.walkDistance) / 1000).toFixed(1) + 'km'
        : '-',
  };
}

export default function PlayerMatches({
  playerName,
  limit = 20,
}: {
  playerName: string;
  limit?: number;
}) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triedAuto = useRef(false);

  const load = async (refresh = false) => {
    try {
      setError(null);
      if (refresh) setRefreshing(true);
      setLoading(!data); // only show big loader on first load

      const url = `/api/player-matches/${encodeURIComponent(
        playerName
      )}?limit=${limit}${refresh ? '&refresh=1' : ''}`;

      const res = await fetch(url);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `API ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`
        );
      }

      // guard against empty/non-JSON bodies
      let json: ApiResp | null = null;
      try {
        json = (await res.json()) as ApiResp;
      } catch {
        json = {
          playerName,
          shard: 'steam',
          limit,
          stale: true,
          lastFetchedAt: null,
          matches: [],
        };
      }

      setData(json);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load matches');
      setData({
        playerName,
        shard: 'steam',
        limit,
        stale: true,
        lastFetchedAt: null,
        matches: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // first load from cache
  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName, limit]);

  // auto refresh ONCE if stale
  useEffect(() => {
    if (data?.stale && !triedAuto.current) {
      triedAuto.current = true;
      load(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.stale]);

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-neutral-800 p-6">
        <div className="h-6 w-40 bg-neutral-800 animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-neutral-900/60 rounded animate-pulse" />
          <div className="h-20 bg-neutral-900/60 rounded animate-pulse" />
          <div className="h-20 bg-neutral-900/60 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const matches = data?.matches ?? [];

  return (
    <div className="rounded-xl border border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          Recent Matches (up to {limit})
        </h2>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          {data?.lastFetchedAt && (
            <span>Updated: {timeAgo(data.lastFetchedAt)}</span>
          )}
          <button
            onClick={() => load(true)}
            className="px-3 py-1.5 rounded bg-yellow-500 text-black hover:bg-yellow-600 disabled:opacity-60"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 p-3 text-sm">
          {error}
          <button
            onClick={() => load(true)}
            className="ml-3 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/50 hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {!matches.length && (
        <p className="text-neutral-400">
          No cached matches yet for this player on {data?.shard}. Try “Refresh
          now”.
        </p>
      )}

      <div className="space-y-3">
        {matches.map((m: any, idx: number) => {
          const a = m?.data?.attributes;
          const stats = getMyStats(m, data!.playerName);
          return (
            <div
              key={m?.data?.id ?? idx}
              className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-4"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold text-white">
                  {a?.mapName ?? 'Unknown'} — {a?.gameMode ?? '-'}
                </div>
                <div className="text-xs text-neutral-400">#{idx + 1}</div>
              </div>
              <div className="text-xs text-neutral-500 mb-2">
                {fmt(a?.createdAt)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-neutral-400">Kills:</span>{' '}
                  <span className="text-white">{stats.kills}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Damage:</span>{' '}
                  <span className="text-white">
                    {Math.round(stats.damage)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">Survival:</span>{' '}
                  <span className="text-white">{stats.time}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Distance:</span>{' '}
                  <span className="text-white">{stats.distance}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
