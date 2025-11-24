export const dynamic = "force-dynamic"

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";


// Helper: Date -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local" />
function toLocalInputValue(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// SERVER ACTION: create new banner (with optional file upload)
async function createBanner(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const imageUrlInput = String(formData.get("imageUrl") ?? "").trim();
  const redirectUrl = String(formData.get("redirectUrl") ?? "").trim();
  const startRaw = String(formData.get("startDate") ?? "").trim();
  const endRaw = String(formData.get("endDate") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!title || !redirectUrl || !startRaw || !endRaw) {
    // basic required fields
    return;
  }

  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);

  let finalImageUrl = imageUrlInput;

  // If a file is provided, upload it to Supabase and use its URL
  if (file && file.size > 0) {
    const arrayBuffer = await file.arrayBuffer();
    const filePath = `admin/new-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabaseServer.storage
      .from("banners")
      .upload(filePath, arrayBuffer, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error (create banner):", uploadError);
      return;
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from("banners").getPublicUrl(filePath);

    finalImageUrl = publicUrl;
  }

  // Require at least *some* image, either URL or uploaded file
  if (!finalImageUrl) {
    return;
  }

  const newBanner = await db.banner.create({
    data: {
      title,
      imageUrl: finalImageUrl,
      redirectUrl,
      startDate,
      endDate,
    },
  });

  revalidatePath("/admin/banners");
  redirect(`/admin/banners/${newBanner.id}?toast=created`);
}


export default function NewBannerPage() {
  // default values: now and now + 7 days
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const startDefault = toLocalInputValue(now);
  const endDefault = toLocalInputValue(inSevenDays);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Create new banner
        </p>
        <h1 className="text-2xl font-bold text-yellow-400">
          Add banner
        </h1>
        <p className="text-sm text-gray-400">
          Set up a new sponsor banner with image, link and schedule.
        </p>

        <div className="pt-2">
          <Link
            href="/admin/banners"
            className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 transition-colors"
          >
            ← Back to banners list
          </Link>
        </div>
      </header>

      <form
        action={createBanner}
        className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm"
      >
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">
            Title
          </label>
          <input
            type="text"
            name="title"
            className="w-full rounded-md border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            placeholder="Top sponsor banner"
          />
          <p className="text-[11px] text-gray-500">
            Internal name for this banner (used only in admin).
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">
            Image URL
          </label>
          <input
            type="text"
            name="imageUrl"
            className="w-full rounded-md border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            placeholder="https://..."
          />
          <p className="text-[11px] text-gray-500">
            You can paste a direct image URL here, or upload a file below.
          </p>

          <div className="mt-2 space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">
              Or upload image file
            </label>
            <input
              type="file"
              name="file"
              accept="image/*"
              className="w-full text-xs text-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-yellow-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black hover:file:bg-yellow-400"
            />
            <p className="text-[11px] text-gray-500">
              If you upload a file, it will be stored in the{" "}
              <span className="font-mono">banners</span> bucket and used as the banner
              image.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">
            Redirect URL
          </label>
          <input
            type="text"
            name="redirectUrl"
            className="w-full rounded-md border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            placeholder="https://sponsor-website.com"
          />
          <p className="text-[11px] text-gray-500">
            When users click the banner, they will be taken to this URL.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">
              Start date &amp; time
            </label>
            <input
              type="datetime-local"
              name="startDate"
              defaultValue={startDefault}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
            <p className="text-[11px] text-gray-500">
              Banner will be considered active from this time.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">
              End date &amp; time
            </label>
            <input
              type="datetime-local"
              name="endDate"
              defaultValue={endDefault}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
            <p className="text-[11px] text-gray-500">
              After this time, the banner can be treated as expired.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 transition-colors"
          >
            Create banner
          </button>

          <Link
            href="/admin/banners"
            className="text-xs text-gray-400 hover:text-yellow-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
