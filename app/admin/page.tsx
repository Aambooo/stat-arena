// app/admin/page.tsx
import { db } from "@/lib/db";
import AdminDashboardClient from "../../components/admin/AdminDashboardClient";
import type { Banner, ContactRequest } from "@prisma/client";
export const revalidate = 30; // seconds

export default async function AdminDashboardPage() {
  const now = new Date();

  const [
    contactCount,
    activeBannerCount,
    scheduledBannerCount,
    expiredBannerCount,
    clicksAgg,
    bannerRows,
    recentContacts,
  ] = await Promise.all([
    // total contact requests
    db.contactRequest.count(),

    // banners that are currently active
    db.banner.count({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),

    // scheduled: startDate > now
    db.banner.count({
      where: {
        startDate: { gt: now },
      },
    }),

    // expired: endDate < now
    db.banner.count({
      where: {
        endDate: { lt: now },
      },
    }),

    // sum of clicks over all banners
    db.banner.aggregate({
      _sum: { clicks: true },
    }),

    // banners for chart & tables (last 8 by start date)
    db.banner.findMany({
      orderBy: { startDate: "desc" },
      take: 8,
    }),

    // latest 6 contact requests
    db.contactRequest.findMany({
      orderBy: { requestDate: "desc" },
      take: 6,
    }),
  ]);

  const totalClicks = clicksAgg._sum.clicks ?? 0;

  const bannerSummaries = bannerRows.map((b: Banner) => {
    const status =
      b.startDate <= now && b.endDate >= now
        ? ("Active" as const)
        : b.startDate > now
        ? ("Scheduled" as const)
        : ("Expired" as const);

    return {
      id: b.id,
      title: b.title,
      clicks: b.clicks ?? 0,
      status,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
    };
  });

  const contactSummaries = recentContacts.map((c: ContactRequest) => ({
    id: c.id,
    name: c.clientName,  
    email: c.clientEmail,
    requestDate: c.requestDate.toISOString(),
    createdAt: c.updatedAt.toISOString(),
  }));

  return (
    <AdminDashboardClient
      totals={{
        contactCount,
        activeBannerCount,
        scheduledBannerCount,
        expiredBannerCount,
        totalClicks,
      }}
      banners={bannerSummaries}
      contacts={contactSummaries}
    />
  );
}
