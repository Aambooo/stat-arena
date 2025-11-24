"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
      <Link
        href="/admin"
        className={
          "block rounded-lg px-3 py-2 transition-colors " +
          (isActive("/admin")
            ? "bg-neutral-900 text-yellow-400 font-medium"
            : "text-gray-300 hover:bg-neutral-900 hover:text-yellow-300")
        }
      >
        Dashboard
      </Link>

      <Link
        href="/admin/contacts"
        className={
          "block rounded-lg px-3 py-2 transition-colors " +
          (isActive("/admin/contacts")
            ? "bg-neutral-900 text-yellow-400 font-medium"
            : "text-gray-300 hover:bg-neutral-900 hover:text-yellow-300")
        }
      >
        Contact Requests
      </Link>

      <Link
        href="/admin/banners"
        className={
          "block rounded-lg px-3 py-2 transition-colors " +
          (isActive("/admin/banners")
            ? "bg-neutral-900 text-yellow-400 font-medium"
            : "text-gray-300 hover:bg-neutral-900 hover:text-yellow-300")
        }
      >
        Banners
      </Link>
    </nav>
  );
}
