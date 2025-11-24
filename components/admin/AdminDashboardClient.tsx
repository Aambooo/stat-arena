"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Totals = {
  contactCount: number;
  activeBannerCount: number;
  scheduledBannerCount: number;
  expiredBannerCount: number;
  totalClicks: number;
};

type BannerSummary = {
  id: number;
  title: string;
  clicks: number;
  status: "Active" | "Scheduled" | "Expired" | string;
  startDate: string;
  endDate: string;
};

type ContactSummary = {
  id: number;
  name: string;
  email: string;
  requestDate: string;
  createdAt: string;
};

function formatDate(dt: string) {
  try {
    return new Date(dt).toLocaleString("en-GB", {
      timeZone: "Asia/Kathmandu",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // 24-hour format
    });
  } catch {
    return dt;
  }
}

export default function AdminDashboardClient({
  totals,
  banners,
  contacts,
}: {
  totals: Totals;
  banners: BannerSummary[];
  contacts: ContactSummary[];
}) {
  // ---- data for bar chart (clicks per banner) ----
  const bannerChartData = React.useMemo(() => {
    const base = (banners ?? []).map((b) => ({
      id: b.id,
      name: b.title.length > 12 ? b.title.slice(0, 12) + "…" : b.title,
      fullTitle: b.title,
      clicks: b.clicks,
      status: b.status,
    }));

    if (base.length <= 3) return base;

    // sort by clicks desc
    const sorted = [...base].sort((a, b) => b.clicks - a.clicks);

    // threshold = clicks of the 3rd place
    const threshold = sorted[2].clicks;

    // include anyone who has clicks >= 3rd place (this handles ties)
    return sorted.filter((item) => item.clicks >= threshold);
  }, [banners]);


  // ---- data for donut chart (banner status distribution) ----
  const donutData = [
    { name: "Active", value: totals.activeBannerCount },
    { name: "Scheduled", value: totals.scheduledBannerCount },
    { name: "Expired", value: totals.expiredBannerCount },
  ].filter((d) => d.value > 0);

  const donutColors = ["#22c55e", "#38bdf8", "#6b7280"]; // green, blue, gray

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-yellow-400">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-400 max-w-2xl">
          Internal panel to review sponsor inquiries, manage banner ads, and
          monitor key stats for STAT ARENA.
        </p>
      </header>

      {/* Top stat cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Requests */}
        <Link
          href="/admin/contacts"
          className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 hover:border-yellow-500/60 transition-colors"
        >
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">
            Contact requests
          </div>
          <div className="text-3xl font-semibold text-white">
            {totals.contactCount}
          </div>
          <p className="mt-2 text-sm text-neutral-400">
            Total sponsor / contact inquiries received so far.
          </p>
          <p className="mt-3 text-xs text-yellow-400 underline">
            View all contact requests &rarr;
          </p>
        </Link>

        {/* Active banners */}
        <Link
          href="/admin/banners"
          className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 hover:border-yellow-500/60 transition-colors"
        >
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">
            Active banners
          </div>
          <div className="text-3xl font-semibold text-white">
            {totals.activeBannerCount}
          </div>
          <p className="mt-2 text-sm text-neutral-400">
            Number of sponsor banners currently running on the site.
          </p>
          <p className="mt-3 text-xs text-yellow-400 underline">
            Manage banners &rarr;
          </p>
        </Link>

        {/* Total clicks */}
        <Link
          href="/admin/banners"
          className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 hover:border-yellow-500/60 transition-colors"
        >
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">
            Total banner clicks
          </div>
          <div className="text-3xl font-semibold text-white">
            {totals.totalClicks}
          </div>
          <p className="mt-2 text-sm text-neutral-400">
            Cumulative click count across all banners.
          </p>
          <p className="mt-3 text-xs text-yellow-400 underline">
            See banner performance &rarr;
          </p>
        </Link>
      </div>

      {/* Middle row: bar chart + donut chart */}
      <section className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* Bar chart: clicks per banner */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">
              Banner performance (clicks per banner)
            </h2>
            <span className="text-xs text-neutral-400">
              Top {bannerChartData.length} banners by clicks
            </span>
          </div>
          {bannerChartData.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No banners created yet. Create one from the{" "}
              <span className="text-yellow-400">Banners</span> section.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bannerChartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#a3a3a3", fontSize: 12 }}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #3f3f46",
                      color: "#e5e5e5",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#e5e5e5" }}
                    itemStyle={{ color: "#e5e5e5" }}
                  />
                  <Legend />
                  <Bar dataKey="clicks" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Donut chart: banner status distribution */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5">
          <h2 className="text-lg font-semibold text-white mb-1">
            Banner status overview
          </h2>
          <p className="text-xs text-neutral-400 mb-3">
            Distribution of active, scheduled and expired campaigns.
          </p>

          {donutData.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No banners to show yet.
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {donutData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "Active"
                            ? "#22c55e"     // green
                            : entry.name === "Scheduled"
                            ? "#38bdf8"     // blue
                            : "#6b7280"     // gray (expired)     
                                                    
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #3f3f46",
                      color: "#e5e5e5",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#e5e5e5" }}
                    itemStyle={{ color: "#e5e5e5" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-3 text-xs text-neutral-400 space-y-1">
            <div>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2" />
              Active:{" "}
              <span className="text-neutral-100">
                {totals.activeBannerCount}
              </span>
            </div>
            <div>
              <span className="inline-block w-2 h-2 rounded-full bg-sky-400 mr-2" />
              Scheduled:{" "}
              <span className="text-neutral-100">
                {totals.scheduledBannerCount}
              </span>
            </div>
            <div>
              <span className="inline-block w-2 h-2 rounded-full bg-neutral-500 mr-2" />
              Expired:{" "}
              <span className="text-neutral-100">
                {totals.expiredBannerCount}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom row: recent contacts + recent banners */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Recent contacts */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">
              Recent contact requests
            </h2>
            <Link
              href="/admin/contacts"
              className="text-xs text-yellow-400 hover:underline"
            >
              View all
            </Link>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No contact requests received yet.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
                >
                  <div>
                    <div className="text-sm text-white">{c.name}</div>
                    <div className="text-xs text-neutral-400">{c.email}</div>
                  </div>
                  <div className="text-xs text-neutral-400 text-right">
                    {formatDate(c.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent banners list */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Recent banners</h2>
            <Link
              href="/admin/banners"
              className="text-xs text-yellow-400 hover:underline"
            >
              Manage banners
            </Link>
          </div>
          {banners.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No sponsor banners created yet.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
                >
                  <div className="flex-1">
                    <div className="text-sm text-white truncate">
                      {b.title}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {formatDate(b.startDate)} → {formatDate(b.endDate)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-neutral-300">
                    <div>{b.clicks} clicks</div>
                    <div
                      className={
                        b.status === "Active"
                          ? "text-emerald-400"
                          : b.status === "Scheduled"
                          ? "text-sky-400"
                          : "text-neutral-500"
                      }
                    >
                      {b.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
