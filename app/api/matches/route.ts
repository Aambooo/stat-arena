import { NextResponse } from 'next/server';
import { getMatchDetails } from '@/lib/pubg-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const shard = searchParams.get('shard') || 'steam';

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'Match ID is required' },
        { status: 400 }
      );
    }

    const matchData = await getMatchDetails(matchId, shard);

    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    headers.set("X-Cache-Control", "enabled");

    return NextResponse.json(
      {
        success: true,
        data: matchData
      },
      { status: 200, headers }
    );

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}