import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  // Next.js 15: params is now a Promise
  const { id } = await props.params;

  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    // if id is not a number, just send user to home
    return NextResponse.redirect(new URL("/", req.url));
  }

  const banner = await db.banner.findUnique({
    where: { id: numericId },
  });

  if (!banner?.redirectUrl) {
    // if no redirect URL for some reason, send to home
    return NextResponse.redirect(new URL("/", req.url));
  }

  // increment clicks
  await db.banner.update({
    where: { id: numericId },
    data: { clicks: { increment: 1 } },
  });

  // finally redirect to sponsor site
  return NextResponse.redirect(banner.redirectUrl);
}
