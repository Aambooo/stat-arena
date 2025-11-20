"use client";

import type { Banner } from "@prisma/client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const VALID_STATUSES = ["all", "active", "upcoming", "expired"] as const;
type StatusFilter = (typeof VALID_STATUSES)[number];

const PAGE_SIZE = 10;

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// NEW: friendly schedule description
function describeSchedule(startDate: Date | string, endDate: Date | string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const dayMs = 1000 * 60 * 60 * 24;

  if (now < start) {
    const diffDays = Math.round((start.getTime() - now.getTime()) / dayMs);
    const label =
      diffDays <= 0
        ? "Starts later today"
        : diffDays === 1
        ? "Starts in 1 day"
        : `Starts in ${diffDays} days`;
    return { label, tone: "upcoming" as const };
  }

  if (now > end) {
    const diffDays = Math.round((now.getTime() - end.getTime()) / dayMs);
    const label =
      diffDays <= 0
        ? "Ended earlier today"
        : diffDays === 1
        ? "Ended 1 day ago"
        : `Ended ${diffDays} days ago`;
    return { label, tone: "expired" as const };
  }

  // active
  const diffDays = Math.round((end.getTime() - now.getTime()) / dayMs);
  const label =
    diffDays <= 0
      ? "Ends later today"
      : diffDays === 1
      ? "Ends in 1 day"
      : `Ends in ${diffDays} days`;

  return { label, tone: "active" as const };
}

function getBannerStatus(banner: Banner) {
  const now = new Date();

  if (now < banner.startDate) {
    return {
      label: "upcoming",
      className: "bg-blue-500/10 text-blue-300 border-blue-500/40",
    };
  }

  if (now > banner.endDate) {
    return {
      label: "expired",
      className: "bg-red-500/10 text-red-300 border-red-500/40",
    };
  }

  return {
    label: "active",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  };
}

type BannersTableProps = {
  allBanners: Banner[];
};

export default function BannersTable({ allBanners }: BannersTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- read filters from URL ---
  const rawStatus = (searchParams.get("status") ?? "all").toLowerCase();
  const urlSearchQuery = searchParams.get("q") ?? "";
  const pageParam = searchParams.get("page") ?? "1";

  const pageFromUrl = parseInt(pageParam, 10);
  const initialPage =
    Number.isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl;

  const statusFilter: StatusFilter = VALID_STATUSES.includes(
    rawStatus as StatusFilter
  )
    ? (rawStatus as StatusFilter)
    : "all";

  const [searchTerm, setSearchTerm] = React.useState(urlSearchQuery);

  // keep input in sync with URL
  React.useEffect(() => {
    setSearchTerm(urlSearchQuery);
  }, [urlSearchQuery]);

  // --- apply status filter ---
  const statusFiltered =
    statusFilter === "all"
      ? allBanners
      : allBanners.filter((banner) => {
          const status = getBannerStatus(banner).label;
          return status === statusFilter;
        });

  // --- apply search filter ---
  const normalizedQuery = searchTerm.trim().toLowerCase();

  const filtered =
    normalizedQuery === ""
      ? statusFiltered
      : statusFiltered.filter((banner) => {
          const fields = [banner.title, banner.redirectUrl, banner.imageUrl];
          return fields.some((f) => f.toLowerCase().includes(normalizedQuery));
        });

  // --- pagination ---
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(initialPage, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // --- helpers to update URL ---
  function updateUrl(updater: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    const query = params.toString();
    router.push(`/admin/banners${query ? `?${query}` : ""}`);
  }

  function handleStatusClick(status: StatusFilter) {
    updateUrl((params) => {
      if (status === "all") {
        params.delete("status");
      } else {
        params.set("status", status);
      }
      params.delete("page"); // reset page
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateUrl((params) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) {
        params.delete("q");
      } else {
        params.set("q", trimmed);
      }
      params.delete("page"); // reset page
    });
  }

  function handleClearSearch() {
    setSearchTerm("");
    updateUrl((params) => {
      params.delete("q");
      params.delete("page");
    });
  }

  function goToPage(page: number) {
    const clamped = Math.max(1, Math.min(page, totalPages));
    updateUrl((params) => {
      if (clamped === 1) {
        params.delete("page");
      } else {
        params.set("page", String(clamped));
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Status pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {VALID_STATUSES.map((s) => {
            const isActive = statusFilter === s;
            const label =
              s === "all" ? "All" : s[0].toUpperCase() + s.slice(1);

            return (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusClick(s)}
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 transition-colors",
                  isActive
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-200"
                    : "border-neutral-700 bg-neutral-900/70 text-gray-300 hover:border-yellow-500/70 hover:text-yellow-200",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search box */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 text-xs"
        >
          <input
            type="text"
            placeholder="Search by title, URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-56 rounded-md border border-neutral-700 bg-neutral-950/70 px-3 py-1 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <button
            type="submit"
            className="rounded-md border border-yellow-500/60 bg-yellow-500/10 px-3 py-1 font-medium text-yellow-200 hover:bg-yellow-500/20"
          >
            Search
          </button>
          {urlSearchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-[11px] text-gray-400 hover:text-yellow-300"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* debug line – you can remove later */}
      <p className="text-[11px] text-gray-500">
        Status: <span className="font-mono">{statusFilter}</span> | Page:{" "}
        <span className="font-mono">
          {currentPage}/{totalPages}
        </span>
        {urlSearchQuery && (
          <>
            {" "}
            | query: <span className="font-mono">{urlSearchQuery}</span>
          </>
        )}
      </p>

      {paginated.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 text-center text-sm text-gray-400">
          {statusFilter === "all" && !urlSearchQuery ? (
            <>No banners found.</>
          ) : (
            <>No results for current filters.</>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950/60">
          <table className="min-w-full divide-y divide-neutral-800 text-sm">
            <thead className="bg-neutral-950/80 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Redirect URL</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Start</th>
                <th className="px-4 py-3 text-left">End</th>
                <th className="px-4 py-3 text-left">Clicks</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {paginated.map((banner, index) => {
                const rowNumber = startIndex + index + 1;
                const status = getBannerStatus(banner);
                const schedule = describeSchedule(
                  banner.startDate,
                  banner.endDate
                );

                const scheduleClass =
                  schedule.tone === "active"
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                    : schedule.tone === "upcoming"
                    ? "bg-sky-500/10 text-sky-300 border-sky-500/40"
                    : "bg-red-500/10 text-red-300 border-red-500/40";

                return (
                  <tr key={banner.id} className="hover:bg-neutral-900/60">
                    <td className="px-4 py-3 align-top text-gray-400 text-xs">
                      {rowNumber}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-100">
                      <div className="font-medium">{banner.title}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-300">
                      <a
                        href={banner.redirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all underline decoration-dotted hover:text-yellow-300"
                      >
                        {banner.redirectUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                          status.className,
                        ].join(" ")}
                      >
                        {status.label}
                      </span>
                    </td>
                    {/* Start column: date + schedule pill */}
                    <td className="px-4 py-3 align-top text-gray-400 text-xs">
                      <div>{formatDate(banner.startDate)}</div>
                      <div
                        className={[
                          "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium border",
                          scheduleClass,
                        ].join(" ")}
                      >
                        {schedule.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-400 text-xs">
                      {formatDate(banner.endDate)}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-200 text-xs">
                      {banner.clicks}
                    </td>
                    <td className="px-4 py-3 align-top text-right text-xs">
                      <Link
                        href={`/admin/banners/${banner.id}`}
                        className="rounded-md border border-neutral-700 bg-neutral-900/80 px-3 py-1 font-medium text-gray-100 hover:border-yellow-500 hover:text-yellow-200"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div className="flex flex-col gap-2 border-t border-neutral-800 px-4 py-3 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
            <div>
              Showing{" "}
              <span className="font-mono">
                {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, totalItems)}
              </span>{" "}
              of <span className="font-mono">{totalItems}</span> banners
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={[
                  "rounded-md border px-2 py-1",
                  currentPage === 1
                    ? "cursor-not-allowed border-neutral-800 text-neutral-600"
                    : "border-neutral-700 bg-neutral-900/80 hover:border-yellow-500 hover:text-yellow-200",
                ].join(" ")}
              >
                Prev
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={[
                    "rounded-md border px-2 py-1 font-mono text-[11px]",
                    p === currentPage
                      ? "border-yellow-500 bg-yellow-500/20 text-yellow-100"
                      : "border-neutral-700 bg-neutral-900/80 text-gray-300 hover:border-yellow-500 hover:text-yellow-200",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={[
                  "rounded-md border px-2 py-1",
                  currentPage === totalPages
                    ? "cursor-not-allowed border-neutral-800 text-neutral-600"
                    : "border-neutral-700 bg-neutral-900/80 hover:border-yellow-500 hover:text-yellow-200",
                ].join(" ")}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// we need React imported since we used React.useState/useEffect
import React from "react";
