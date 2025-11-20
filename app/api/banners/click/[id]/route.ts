// app/api/banners/click/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: RouteParams) {
  const id = Number(params.id);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
  }

  // Find banner first
  const banner = await db.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    return NextResponse.json({ error: "Banner not found" }, { status: 404 });
  }

  // Increment clicks (we don't really care about the result here)
  await db.banner.update({
    where: { id },
    data: {
      clicks: {
        increment: 1,
      },
    },
  });

  // Redirect user to the sponsor site
  return NextResponse.redirect(banner.redirectUrl, {
    status: 302,
  });
}
