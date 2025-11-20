"use client";

import type { ContactRequest } from "@prisma/client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";

const VALID_STATUSES = ["all", "pending", "contacted", "rejected"] as const;
type StatusFilter = (typeof VALID_STATUSES)[number];

const PAGE_SIZE = 10;

function getStatusClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/40";
    case "contacted":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";
    case "rejected":
      return "bg-red-500/10 text-red-300 border-red-500/40";
    default:
      return "bg-gray-500/10 text-gray-300 border-gray-500/40";
  }
}

type ContactsTableProps = {
  allRequests: ContactRequest[];
};

export default function ContactsTable({ allRequests }: ContactsTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ---- read filters from URL ----
  const rawStatus = (searchParams.get("status") ?? "all").toLowerCase();
  const urlSearchQuery = searchParams.get("q") ?? "";
  const pageParam = searchParams.get("page") ?? "1";
  const pageFromUrl = parseInt(pageParam, 10);
  const initialPage = Number.isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl;

  const statusFilter: StatusFilter = VALID_STATUSES.includes(
    rawStatus as StatusFilter
  )
    ? (rawStatus as StatusFilter)
    : "all";

  // local state for search input (so it stays in the box)
  const [searchTerm, setSearchTerm] = useState(urlSearchQuery);

  // keep input in sync if URL changes (back/forward)
  useEffect(() => {
    setSearchTerm(urlSearchQuery);
  }, [urlSearchQuery]);

  // ---- apply status + search filters ----
  const statusFiltered =
    statusFilter === "all"
      ? allRequests
      : allRequests.filter((r) => r.status === statusFilter);

  const normalizedQuery = searchTerm.trim().toLowerCase();

  const filtered =
    normalizedQuery === ""
      ? statusFiltered
      : statusFiltered.filter((r) => {
          const fields = [
            r.clientName,
            r.clientEmail,
            r.package ?? "",
            r.paymentMethod ?? "",
          ];

          return fields.some((f) =>
            f.toLowerCase().includes(normalizedQuery)
          );
        });

  // ---- pagination ----
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(initialPage, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // ---- helpers ----
  function updateUrl(paramsUpdater: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    paramsUpdater(params);
    const query = params.toString();
    router.push(`/admin/contacts${query ? `?${query}` : ""}`);
  }

  function handleFilterClick(status: StatusFilter) {
    updateUrl((params) => {
      if (status === "all") {
        params.delete("status");
      } else {
        params.set("status", status);
      }
      // reset page when filter changes
      params.delete("page");
    });
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateUrl((params) => {
      const trimmed = searchTerm.trim();
      if (trimmed === "") {
        params.delete("q");
      } else {
        params.set("q", trimmed);
      }
      // reset page when search changes
      params.delete("page");
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

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Filters row: status pills + search box */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Status filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          {VALID_STATUSES.map((s) => {
            const isActive = statusFilter === s;
            const label = s === "all" ? "All" : s[0].toUpperCase() + s.slice(1);

            return (
              <button
                key={s}
                type="button"
                onClick={() => handleFilterClick(s)}
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
            placeholder="Search by name, email, package..."
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

      {/* small debug line – remove later if you want */}
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
            <>No contact requests found yet.</>
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
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Requested</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {paginated.map((req, index) => {
                const rowNumber = startIndex + index + 1;
                const date = new Date(req.requestDate);
                const formatted = date.toLocaleString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return (
                  <tr
                    key={req.id}
                    className={
                      req.status === "pending"
                        ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                        : "hover:bg-neutral-900/60"
                    }
                  >
                    <td className="px-4 py-3 align-top text-gray-400 text-xs">
                      {rowNumber}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-100">
                      <div className="font-medium">{req.clientName}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-300">
                      <a
                        href={`mailto:${req.clientEmail}`}
                        className="underline decoration-dotted hover:text-yellow-300"
                      >
                        {req.clientEmail}
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-300">
                      {req.package || "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-300">
                      {req.paymentMethod || "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                          getStatusClasses(req.status),
                        ].join(" ")}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-400 text-xs">
                      {formatted}
                    </td>
                    <td className="px-4 py-3 align-top text-right text-xs">
                      <Link
                        href={`/admin/contacts/${req.id}`}
                        className="rounded-md border border-neutral-700 bg-neutral-900/80 px-3 py-1 font-medium text-gray-100 hover:border-yellow-500 hover:text-yellow-200"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="flex flex-col gap-2 border-t border-neutral-800 px-4 py-3 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
            <div>
              Showing{" "}
              <span className="font-mono">
                {startIndex + 1}-
                {Math.min(startIndex + PAGE_SIZE, totalItems)}
              </span>{" "}
              of <span className="font-mono">{totalItems}</span> contacts
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
