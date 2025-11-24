'use client';

import { useEffect, useState } from 'react';

type ModeKey = 'solo' | 'duo' | 'squad';
type ModeStats = {
  roundsPlayed: number;
  wins: number;
  winRate: number; // %
  kills: number;
  kd: number;
  adr: number; // avg damage / round
  top10s: number;
  assists: number;
  damageDealt: number;
};

type ApiResp = {
  playerId: string;
  shard: string;
  seasonId: string;
  updatedAt: string;
  modes: Record<ModeKey, ModeStats>;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export default function SeasonStats({ playerId, shard = 'steam' }: { playerId: string; shard?: string }) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/season-stats/${encodeURIComponent(playerId)}?shard=${shard}`
        );
        const json = (await res.json()) as ApiResp;
        setData(json);
      } catch (e) {
        console.error('season stats failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playerId, shard]);

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 p-6">
        <div className="h-6 w-40 bg-neutral-800 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-neutral-900/60 rounded animate-pulse" />
          <div className="h-28 bg-neutral-900/60 rounded animate-pulse" />
          <div className="h-28 bg-neutral-900/60 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const order: ModeKey[] = ['solo', 'duo', 'squad'];

  return (
    <div className="rounded-xl border border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Season Stats</h2>
        <div className="text-sm text-neutral-400">
          Updated {timeAgo(data.updatedAt)} • Season: <span className="font-mono">{data.seasonId}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {order.map((k) => {
          const s = data.modes[k];
          if (!s || s.roundsPlayed === 0) {
            // hide empty modes
            return (
              <div key={k} className="rounded-lg bg-neutral-900/40 border border-neutral-800 p-4 opacity-60">
                <div className="text-neutral-400 font-semibold capitalize">{k}</div>
                <div className="text-neutral-500 text-sm mt-2">No games this season</div>
              </div>
            );
          }
          return (
            <div key={k} className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-4">
              <div className="text-white font-semibold capitalize mb-2">{k}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-neutral-400">Rounds</div><div className="text-white">{s.roundsPlayed}</div>
                <div className="text-neutral-400">Wins</div><div className="text-white">{s.wins} ({s.winRate}%)</div>
                <div className="text-neutral-400">Kills</div><div className="text-white">{s.kills}</div>
                <div className="text-neutral-400">K/D</div><div className="text-white">{s.kd}</div>
                <div className="text-neutral-400">ADR</div><div className="text-white">{s.adr}</div>
                <div className="text-neutral-400">Top 10s</div><div className="text-white">{s.top10s}</div>
                <div className="text-neutral-400">Assists</div><div className="text-white">{s.assists}</div>
                <div className="text-neutral-400">Damage</div><div className="text-white">{Math.round(s.damageDealt)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
