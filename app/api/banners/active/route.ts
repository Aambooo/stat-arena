// app/api/banners/active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const BANNERS_CACHE_TTL_MS = 60_000; // 1 minute

// Simple in-memory cache (per server instance)
let bannersCache:
  | {
      data: any[];
      expiresAt: number;
    }
  | null = null;

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();

    // 1) Serve from in-memory cache if still fresh
    if (bannersCache && bannersCache.expiresAt > now) {
      const headers = new Headers();
      headers.set("X-Cache", "HIT");
      headers.set("Cache-Control", "public, max-age=30");

      return NextResponse.json(bannersCache.data, {
        status: 200,
        headers,
      });
    }

    // 2) Otherwise, hit the database
    const nowDate = new Date();

    const activeBanners = await db.banner.findMany({
      where: {
        startDate: { lte: nowDate },
        endDate: { gte: nowDate },
        // if you have other filters like isActive: true, keep them here
      },
      orderBy: {
        startDate: "asc",
      },
    });

    // 3) Save to in-memory cache
    bannersCache = {
      data: activeBanners,
      expiresAt: now + BANNERS_CACHE_TTL_MS,
    };

    const headers = new Headers();
    headers.set("X-Cache", "MISS");
    headers.set("Cache-Control", "public, max-age=30");

    return NextResponse.json(activeBanners, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("/api/banners/active ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load active banners" },
      { status: 500 }
    );
  }
}
