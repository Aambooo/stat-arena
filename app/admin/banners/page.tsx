// app/admin/banners/page.tsx
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import type { Banner } from "@prisma/client";
import BannersTable from "./BannersTable";
import BannerToast from "./BannerToast";

export const revalidate = 30;

type BannersPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminBannersPage({ searchParams }: BannersPageProps) {
  // 🚀 FIX — searchParams is a Promise in Next.js 15
  const resolved = searchParams ? await searchParams : undefined;

  const rawToast = resolved?.toast;
  const toastParam = Array.isArray(rawToast) ? rawToast[0] : rawToast;

  const toastType =
    toastParam === "created"
      ? "created"
      : toastParam === "updated"
      ? "updated"
      : undefined;

  const allBanners: Banner[] = await db.banner.findMany({
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* 👇 Toast lives here, above content */}
      <BannerToast type={toastType} />

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-yellow-400">Banners</h1>
        <p className="text-sm text-gray-400">
          Manage banner ads that appear on the site. You can filter by status,
          search and review their links, schedule and performance.
        </p>

        <div className="pt-2">
          <a
            href="/admin/banners/new"
            className="inline-flex items-center rounded-md border border-yellow-500/70 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-200 hover:bg-yellow-500/20"
          >
            + Add new banner
          </a>
        </div>
      </header>

      <BannersTable allBanners={allBanners} />
    </div>
  );
}
