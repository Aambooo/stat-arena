// app/admin/contacts/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ContactDetailPageProps = {
  params: Promise<{ id: string }>;
};

// SERVER ACTION: update status in DB
async function updateStatus(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !status) {
    return;
  }

  await db.contactRequest.update({
    where: { id },
    data: { status },
  });

  // refresh both the detail page and the list page
  revalidatePath(`/admin/contacts/${id}`);
  revalidatePath("/admin/contacts");
}

// SERVER ACTION: delete contact request
async function deleteContact(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  if (!id) {
    return;
  }

  await db.contactRequest.delete({
    where: { id },
  });

  // refresh the list page and go back there
  revalidatePath("/admin/contacts");
  redirect("/admin/contacts");
}

export default async function ContactDetailPage(props: ContactDetailPageProps) {
  const params = await props.params;
  const id = Number(params.id);

  if (Number.isNaN(id)) {
    notFound();
  }

  const req = await db.contactRequest.findUnique({
    where: { id },
  });

  if (!req) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Contact Request #{req.id}
        </p>
        <h1 className="text-2xl font-bold text-yellow-400">
          {req.clientName}
        </h1>
        <p className="text-sm text-gray-400">
          Requested on{" "}
          {new Date(req.requestDate).toLocaleString()}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm">
          <h2 className="text-base font-semibold text-gray-100">
            Contact info
          </h2>
          <div className="space-y-1">
            <p>
              <span className="text-gray-400">Email: </span>
              <a
                href={`mailto:${req.clientEmail}`}
                className="underline hover:text-yellow-400"
              >
                {req.clientEmail}
              </a>
            </p>
            <p>
              <span className="text-gray-400">Package: </span>
              {req.package || "—"}
            </p>
            <p>
              <span className="text-gray-400">Payment method: </span>
              {req.paymentMethod || "—"}
            </p>
            <p>
              <span className="text-gray-400">Target URL: </span>
              {req.targetUrl ? (
                <a
                  href={req.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-yellow-400 break-all"
                >
                  {req.targetUrl}
                </a>
              ) : (
                "—"
              )}
            </p>
            <p>
              <span className="text-gray-400">Preferred start date: </span>
              {req.preferredStartDate
                ? new Date(req.preferredStartDate).toLocaleDateString()
                : "—"}
            </p>
            <p>
              <span className="text-gray-400">Transaction ID: </span>
              {req.transactionId || "—"}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-100">
              Status
            </h2>
            <span className="inline-flex items-center rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
              {req.status}
            </span>
          </div>

          {/* Status update form */}
          <form
            action={updateStatus}
            className="mt-2 flex flex-wrap items-center gap-3 text-xs"
          >
            <input type="hidden" name="id" value={req.id} />

            <label className="text-gray-300 flex items-center gap-2">
              Update status:
              <select
                name="status"
                defaultValue={req.status}
                className="rounded-md border border-neutral-700 bg-neutral-950/70 px-2 py-1 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              >
                <option value="pending">pending</option>
                <option value="contacted">contacted</option>
                <option value="rejected">rejected</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-md bg-yellow-500 px-3 py-1 font-semibold text-xs text-black hover:bg-yellow-400 transition-colors cursor-pointer"
            >
              Save
            </button>
          </form>

          <p className="text-[11px] text-gray-500">
            When you update the status here, it will also change in the
            Contact Requests list.
          </p>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-200">
              Campaign details / message
            </h3>
            <div className="rounded-md border border-neutral-800 bg-neutral-950/70 p-3 text-xs text-gray-200 whitespace-pre-wrap">
              {req.message || "(no message provided)"}
            </div>
          </div>

          {/* Danger zone */}
          <div className="mt-4 border-t border-neutral-800 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-red-400">
              Danger zone
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">
              Deleting this contact request is permanent and cannot be undone.
            </p>
            <form action={deleteContact} className="mt-2">
              <input type="hidden" name="id" value={req.id} />
              <button
                type="submit"
                className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 transition-colors cursor-pointer"
              >
                Delete contact request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
