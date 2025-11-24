import { searchPlayer } from '@/lib/pubg-api';
import { notFound } from 'next/navigation';
import PlayerMatches from '@/components/PlayerMatches';
import SeasonStats from '@/components/SeasonStats';
import MatchTrends from '@/components/MatchTrends';

// In Next.js 15, params is a *Promise*.
type PlayerPageParams = Promise<{ playerName: string }>;

export default async function PlayerPage({
  params,
}: {
  params: PlayerPageParams;
}) {
  // Await the params to get the actual value
  const { playerName } = await params;

  try {
    // Search for the player
    const result = await searchPlayer(playerName, 'steam');

    // Check if player was found
    if (!result.data || result.data.length === 0) {
      notFound();
    }

    const player = result.data[0];
    const playerData = player.attributes;
    const playerId = player.id;

    return (
      <div className="relative min-h-screen bg-neutral-950 p-8 overflow-hidden">
        {/* Navbar */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-neutral-900/60 backdrop-blur-md border-b border-neutral-800">
          <div className="w-full px-6 py-4 flex justify-between items-center">
            <a
              href="/"
              className="text-2xl font-bold text-yellow-500 font-['Oswald'] tracking-wider"
            >
              STAT ARENA
            </a>
          </div>
        </header>

        {/* Animated background pattern - same as homepage */}
        <div className="absolute inset-0 opacity-20 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgb(115, 115, 115) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Content wrapper */}
        <div className="relative z-10 max-w-7xl mx-auto pt-24">
          {/* Back Button */}
          <a
            href="/"
            className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 transition-colors mb-6"
          >
            <span>←</span>
            <span className="ml-1">Back to Home</span>
          </a>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">
              {playerData.name}
            </h1>
            <p className="text-gray-400">Player ID: {playerId}</p>
          </div>

          {/* Basic Info Card */}
          <div className="bg-neutral-900/50 backdrop-blur-md rounded-xl p-6 border border-neutral-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Player Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Platform</p>
                <p className="text-white text-xl font-semibold">
                  {playerData.shardId}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <p className="text-white text-xl font-semibold">
                  {playerData.banType}
                </p>
              </div>
              {playerData.clanId && (
                <div>
                  <p className="text-gray-400">Clan ID</p>
                  <a
                    href={`/team/${playerData.clanId}?from=${encodeURIComponent(
                      `/player/${playerData.name}`
                    )}`}
                    className="text-yellow-500 hover:text-yellow-400 text-xl font-semibold underline transition-colors"
                  >
                    View Team →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Season Stats (live) */}
          <div className="bg-neutral-900/50 backdrop-blur-md rounded-xl p-6 border border-neutral-700 mb-8">
            <SeasonStats playerId={playerId} shard="steam" />
          </div>

          {/* Match Trends (chart) */}
          <div className="bg-neutral-900/50 backdrop-blur-md rounded-xl p-6 border border-neutral-700 mb-8">
            <MatchTrends playerName={playerData.name} limit={20} />
          </div>

          {/* Match History Section (cached, up to 20) */}
          <div className="bg-neutral-900/50 backdrop-blur-md rounded-xl p-6 border border-neutral-700">
            <PlayerMatches playerName={playerData.name} limit={20} />
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="relative min-h-screen bg-neutral-950 flex items-center justify-center p-8 overflow-hidden">
        {/* Animated background pattern for error page too */}
        <div className="absolute inset-0 opacity-20 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgb(115, 115, 115) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 bg-red-500/10 backdrop-blur-xl rounded-xl p-8 border border-red-500/20 max-w-md">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-white mb-2">Failed to fetch player data.</p>
          <p className="text-gray-400 text-sm">{error.message}</p>
          <a
            href="/"
            className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 transition-colors mb-6"
          >
            <span>←</span>
            <span className="ml-1">Back to Home</span>
          </a>
        </div>
      </div>
    );
  }
}
