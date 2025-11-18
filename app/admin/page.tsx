export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Internal panel to review sponsor inquiries, manage banner ads, and
          monitor basic stats for STAT ARENA.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <p className="text-xs text-gray-400 mb-2">Contact requests</p>
          <p className="text-2xl font-semibold">—</p>
          <p className="mt-1 text-xs text-gray-500">
            Will show pending sponsor inquiries.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <p className="text-xs text-gray-400 mb-2">Active banners</p>
          <p className="text-2xl font-semibold">—</p>
          <p className="mt-1 text-xs text-gray-500">
            Will show how many ads are currently running.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <p className="text-xs text-gray-400 mb-2">Total banner clicks</p>
          <p className="text-2xl font-semibold">—</p>
          <p className="mt-1 text-xs text-gray-500">
            Will show click stats from the banner system.
          </p>
        </div>
      </section>
    </div>
  );
}
