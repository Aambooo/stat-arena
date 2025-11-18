import type { ReactNode } from "react";
import Link from "next/link";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* SIDEBAR */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-neutral-800 bg-neutral-950/80">
        <div className="px-6 py-4 border-b border-neutral-800">
          <Link
            href="/"
            className="block text-xl font-bold text-yellow-400 tracking-wide"
          >
            STAT ARENA
          </Link>
          <p className="mt-1 text-xs text-gray-400">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2 bg-neutral-900 text-yellow-400 font-medium"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/contacts"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-neutral-900 hover:text-yellow-300 transition-colors"
          >
            Contact Requests
          </Link>

          <Link
            href="/admin/banners"
            className="block rounded-lg px-3 py-2 text-gray-300 hover:bg-neutral-900 hover:text-yellow-300 transition-colors"
          >
            Banners
          </Link>
        </nav>

        <div className="px-4 py-3 border-t border-neutral-800 text-xs text-gray-500">
          Admin tools for managing sponsors &amp; banners.
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        {/* Small-screen header */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <Link href="/" className="text-lg font-semibold text-yellow-400">
            STAT ARENA
          </Link>
          <span className="text-xs text-gray-400">Admin</span>
        </div>

        {children}
      </main>
    </div>
  );
}
