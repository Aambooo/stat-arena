// app/api/banners/active/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    // Only banners where: startDate <= now <= endDate
    const activeBanners = await db.banner.findMany({
      where: {
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json(activeBanners);
  } catch (error) {
    console.error("[GET /api/banners/active] error:", error);
    return NextResponse.json(
      { error: "Failed to load active banners" },
      { status: 500 }
    );
  }
}
