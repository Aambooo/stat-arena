import type { ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import AdminSidebar from "@/components/admin/AdminSidebar";



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

        <AdminSidebar />

        <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-gray-500">
          <span>Admin tools for managing sponsors &amp; banners.</span>
          <UserButton afterSignOutUrl="/admin/login" />
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
