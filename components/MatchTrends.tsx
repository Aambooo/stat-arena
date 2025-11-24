'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as LineTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// NEW imports for Radar (pentagon) chart
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip as RadarTooltip,
} from 'recharts';

type ApiResp = {
  playerName: string;
  shard: string;
  limit: number;
  stale: boolean;
  lastFetchedAt: string | null;
  matches: any[];
};

function getMyStats(match: any, playerName: string) {
  const me = (match?.included ?? []).find(
    (x: any) =>
      x.type === 'participant' &&
      x?.attributes?.stats?.name?.toLowerCase() === playerName.toLowerCase()
  );
  const s = me?.attributes?.stats;
  const a = match?.data?.attributes;

  const ride = Number(s?.rideDistance ?? 0); // meters
  const walk = Number(s?.walkDistance ?? 0); // meters
  const timeSurvived = Number(s?.timeSurvived ?? 0); // seconds
  const damage = Number(s?.damageDealt ?? 0);

  return {
    kills: Number(s?.kills ?? 0),
    damage,
    timeSurvived, // sec
    distanceKm: (ride + walk) / 1000, // km
    createdAt: a?.createdAt ?? null,
    mapName: a?.mapName ?? '-',
    gameMode: a?.gameMode ?? '-',
  };
}

export default function MatchTrends({
  playerName,
  limit = 20,
}: {
  playerName: string;
  limit?: number;
}) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'kills' | 'damage' | 'adr'>('kills');
  const [warming, setWarming] = useState(false); // polling banner
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----- helpers -----
  const fetchCached = async () => {
    const res = await fetch(
      `/api/player-matches/${encodeURIComponent(playerName)}?limit=${limit}`
    );
    return (await res.json()) as ApiResp;
  };

  const fetchWithRefresh = async () => {
    const res = await fetch(
      `/api/player-matches/${encodeURIComponent(playerName)}?limit=${limit}&refresh=1`
    );
    return (await res.json()) as ApiResp;
  };

  const startPollingUntilReady = () => {
    let tries = 0;
    setWarming(true);
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      tries += 1;
      try {
        const json = await fetchCached();
        if ((json.matches?.length ?? 0) > 0 && !json.stale) {
          setData(json);
          setWarming(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (tries >= 6) {
          setData(json);
          setWarming(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        if (tries >= 6 && pollRef.current) {
          clearInterval(pollRef.current);
          setWarming(false);
        }
      }
    }, 30_000);
  };

  // ----- initial load -----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const json = await fetchCached();
        setData(json);

        const noMatches = !json.matches || json.matches.length === 0;
        if (noMatches || json.stale) {
          await fetchWithRefresh();
          startPollingUntilReady();
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName, limit]);

  // ----- skeleton -----
  if (loading && !data) {
    return (
      <div className="rounded-xl border border-neutral-800 p-6">
        <div className="h-6 w-48 bg-neutral-800 animate-pulse mb-4" />
        <div className="h-40 bg-neutral-900/60 rounded animate-pulse" />
      </div>
    );
  }

  // ----- rows from cached matches -----
  const rows =
    (data?.matches ?? [])
      .slice()
      .reverse()
      .map((m: any, idx: number) => {
        const s = getMyStats(m, data!.playerName);
        const adr =
          s.timeSurvived > 0 ? +(s.damage / (s.timeSurvived / 60)).toFixed(1) : 0; // dmg/min
        const label = s.createdAt
          ? new Date(s.createdAt).toLocaleString("en-GB", { timeZone: 'Asia/Kathmandu' })
          : `#${idx + 1}`;
        return {
          idx: idx + 1,
          kills: s.kills,
          damage: Math.round(s.damage),
          adr,
          survivalMin: Math.round(s.timeSurvived / 60),
          distanceKm: +s.distanceKm.toFixed(1),
          label,
          mapName: s.mapName,
          gameMode: s.gameMode,
          createdAt: s.createdAt,
        };
      });

  const colorMap = {
    kills: '#fbbf24', // yellow
    damage: '#60a5fa', // blue
    adr: '#34d399',    // green
  };

  const metricLabel = {
    kills: 'Kills',
    damage: 'Damage',
    adr: 'ADR (Damage per Min)',
  };

  // ---- summary numbers for the current metric ----
  const values = rows.map((r) => r[metric] as number);
  const avg = values.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
  const best = values.length ? Math.max(...values) : 0;
  const last = values.length ? values[values.length - 1] : 0;

  // ---- CSV download ----
  const downloadCSV = () => {
    const headers = [
      'Index',
      'DateTime_NPT',
      'Map',
      'Mode',
      'Kills',
      'Damage',
      'ADR',
      'Survival_Min',
      'Distance_Km',
    ];

    const lines = rows.map((r) => [
      r.idx,
      r.label,
      r.mapName,
      r.gameMode,
      r.kills,
      r.damage,
      r.adr,
      r.survivalMin,
      r.distanceKm,
    ]);

    const toCsv = (val: unknown) => {
      const s = String(val ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [headers, ...lines].map((row) => row.map(toCsv).join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data?.playerName ?? 'player'}_last_${limit}_matches.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ====== RADAR (PENTAGON) DATA ======
  // We normalize each metric to 0–100 so the pentagon shape is meaningful.
  // Caps are sensible PUBG values for "good game" ceilings.
  const cap = {
    kills: 12,         // per match
    damage: 1000,      // per match
    adr: 600,          // dmg/min
    survivalMin: 30,   // minutes
    distanceKm: 10,    // km travelled
  };
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  const avgKills       = rows.length ? +(rows.reduce((s, r) => s + r.kills, 0) / rows.length).toFixed(1) : 0;
  const avgDamage      = rows.length ? +(rows.reduce((s, r) => s + r.damage, 0) / rows.length).toFixed(0) : 0;
  const avgADR         = rows.length ? +(rows.reduce((s, r) => s + r.adr, 0) / rows.length).toFixed(1) : 0;
  const avgSurvivalMin = rows.length ? +(rows.reduce((s, r) => s + r.survivalMin, 0) / rows.length).toFixed(1) : 0;
  const avgDistanceKm  = rows.length ? +(rows.reduce((s, r) => s + r.distanceKm, 0) / rows.length).toFixed(1) : 0;

  const radarData = [
    { label: 'Kills',        score: Math.round(clamp01(avgKills / cap.kills) * 100),       raw: avgKills,       unit: '' },
    { label: 'Damage',       score: Math.round(clamp01(avgDamage / cap.damage) * 100),     raw: avgDamage,      unit: '' },
    { label: 'ADR',          score: Math.round(clamp01(avgADR / cap.adr) * 100),           raw: avgADR,         unit: '' },
    { label: 'Survival (m)', score: Math.round(clamp01(avgSurvivalMin / cap.survivalMin) * 100), raw: avgSurvivalMin, unit: 'm' },
    { label: 'Distance (km)',score: Math.round(clamp01(avgDistanceKm / cap.distanceKm) * 100),   raw: avgDistanceKm,  unit: 'km' },
  ];

  return (
    <div className="rounded-xl border border-neutral-800 p-6">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold text-white">Match Trends (last {limit})</h2>

        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={downloadCSV}
            className="px-3 py-1.5 rounded text-sm font-semibold bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700"
            title="Download CSV of the last matches (from cache)"
          >
            Download CSV
          </button>

          {/* Toggle buttons */}
          {(['kills', 'damage', 'adr'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors duration-200 ${
                metric === m
                  ? 'bg-yellow-500 text-black'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {metricLabel[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Warming banner */}
      {warming && (
        <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 p-3 text-sm">
          Fetching fresh match data… this can take ~20–60 seconds on a new player. The charts will update automatically.
        </div>
      )}

      {/* Summary chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-3">
          <div className="text-neutral-400 text-xs">Average</div>
          <div className="text-white text-lg font-bold">{avg}</div>
        </div>
        <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-3">
          <div className="text-neutral-400 text-xs">Best</div>
          <div className="text-white text-lg font-bold">{best}</div>
        </div>
        <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-3">
          <div className="text-neutral-400 text-xs">Last Match</div>
          <div className="text-white text-lg font-bold">{last}</div>
        </div>
      </div>

      <div className="text-sm text-neutral-400 mb-4">
        {data?.lastFetchedAt
          ? `Updated ${new Date(data.lastFetchedAt).toLocaleString(undefined, {
              timeZone: 'Asia/Kathmandu',
            })}`
          : ''}
      </div>

      {/* === CHARTS LAYOUT === */}
      {!rows.length ? (
        <p className="text-neutral-400">No matches to chart yet.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          {/* Line chart (takes 2/3 width on xl) */}
          <div className="xl:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="idx"
                  tick={{ fill: '#aaa' }}
                  label={{
                    value: 'Match (old → new)',
                    position: 'insideBottom',
                    offset: -2,
                    fill: '#aaa',
                  }}
                />
                <YAxis tick={{ fill: '#aaa' }} />
                <LineTooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                  labelFormatter={((label: unknown) => {
                    const i = Math.max(0, Number(label) - 1);
                    return rows[i]?.label ?? `Match ${label as string}`;
                  }) as unknown as any}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={metric}
                  name={{ kills: 'Kills', damage: 'Damage', adr: 'ADR (Damage per Min)' }[metric]}
                  stroke={{ kills: '#fbbf24', damage: '#60a5fa', adr: '#34d399' }[metric]}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Radar (pentagon) chart (1/3 width on xl) */}
          <div className="xl:col-span-1">
            <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-4 h-80">
              <div className="text-neutral-300 text-sm mb-2 font-semibold">Performance Snapshot</div>
              <ResponsiveContainer width="100%" height="80%">
                <RadarChart data={radarData} outerRadius="80%">
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="label" tick={{ fill: '#aaa', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#666', fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#fbbf24"
                    fill="#fbbf24"
                    fillOpacity={0.25}
                  />
                  <RadarTooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', color: '#ddd' }}
                    formatter={((value: any, _name: any, props: any) => {
                      // show the real average value with unit
                      const raw = props?.payload?.raw;
                      const unit = props?.payload?.unit ?? '';
                      return [`${value} / 100`, `Avg: ${raw}${unit}`];
                    }) as any}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* mini legend with raw averages */}
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0 text-[11px] leading-tight text-neutral-400">
                <div className="whitespace-nowrap">
                  Kills: <span className="text-neutral-100">{avgKills}</span>
                </div>
                <div className="whitespace-nowrap">
                  Damage: <span className="text-neutral-100">{avgDamage}</span>
                </div>
                <div className="whitespace-nowrap">
                  ADR: <span className="text-neutral-100">{avgADR}</span>
                </div>
                <div className="whitespace-nowrap">
                  Surv: <span className="text-neutral-100">{avgSurvivalMin}m</span>
                </div>
                <div className="whitespace-nowrap">
                  Dist: <span className="text-neutral-100">{avgDistanceKm}km</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
