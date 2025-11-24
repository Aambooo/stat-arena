import { getClanInfo } from '@/lib/pubg-api';
import { notFound } from 'next/navigation';

interface TeamPageProps {
  params: Promise<{
    teamId: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}


export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { teamId } = await params;

  // ✅ Next 15: searchParams is also a Promise
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  // This reads ?from=... if present (for “Back to player” behavior)
  const fromParam =
    typeof resolvedSearchParams?.from === "string"
      ? resolvedSearchParams.from
      : undefined;

  const backHref = fromParam || "/";
  const backLabel = fromParam ? "Back to player" : "Back to Home";

  try {
    // Fetch clan information
    const result = await getClanInfo(teamId, 'steam');
    
    // Check if clan was found
    if (!result.data) {
      notFound();
    }
    
    const clan = result.data;
    const clanData = clan.attributes;

    return (
      <div className="relative min-h-screen bg-neutral-950 overflow-hidden">
        {/* Navbar */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-neutral-900/60 backdrop-blur-md border-b border-neutral-800">
          <div className="w-full px-6 py-4 flex justify-between items-center">
            <a href="/" className="text-2xl font-bold text-yellow-500 font-['Oswald'] tracking-wider">
              STAT ARENA
            </a>
          </div>
        </header>

        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20 z-0">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(115, 115, 115) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content wrapper */}
        <div className="relative z-10 max-w-7xl mx-auto pt-24 px-8 pb-20">
          {/* Back Button */}
          <a
            href={backHref}
            className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 transition-colors mb-6"
          >
            <span>←</span>
            <span className="ml-1">{backLabel}</span>
          </a>

          {/* Team Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">
              {clanData.clanName}
            </h1>
            <p className="text-gray-400">Clan ID: {clan.id}</p>
          </div>
          
          {/* Team Info Card */}
          <div className="bg-neutral-900/50 backdrop-blur-md rounded-xl p-6 border border-neutral-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Team Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Tag</p>
                <p className="text-white text-xl font-semibold">{clanData.clanTag || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400">Members</p>
                <p className="text-white text-xl font-semibold">{clanData.clanMemberCount || 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Level</p>
                <p className="text-white text-xl font-semibold">{clanData.clanLevel || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="bg-neutral-900/50 backdrop-blur-md rounded-xl p-6 border border-neutral-700">
            <h2 className="text-2xl font-bold text-white mb-4">👥 Team Members</h2>
            
            {/* Members list will be added here */}
            <p className="text-gray-400">
              Member list coming soon. Clan data structure varies - need to check API response format.
            </p>
          </div>
        </div>
      </div>
    );
    
  } catch (error: any) {
    return (
      <div className="relative min-h-screen bg-neutral-950 flex items-center justify-center p-8 overflow-hidden">
        {/* Animated background pattern for error page */}
        <div className="absolute inset-0 opacity-20 z-0">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(115, 115, 115) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 bg-red-500/10 backdrop-blur-xl rounded-xl p-8 border border-red-500/20 max-w-md">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-white mb-2">Failed to fetch clan data.</p>
          <p className="text-gray-400 text-sm">{error.message}</p>
          <a
            href={backHref}
            className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 transition-colors mb-6"
          >
            <span>←</span>
            <span className="ml-1">{backLabel}</span>
          </a>
        </div>
      </div>
    );
  }
}