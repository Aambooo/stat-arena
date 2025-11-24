// app/admin/banners/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { Banner } from "@prisma/client";
import { supabaseServer } from "@/lib/supabaseServer";
import BannerToast from "../BannerToast";



type BannerDetailPageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

// Helper: format for datetime-local input
function toLocalInputValue(date: Date | null): string {
  if (!date) return "";

  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getBannerStatus(banner: Banner) {
  const now = new Date();

  if (now < banner.startDate) {
    return {
      label: "upcoming",
      className:
        "bg-blue-500/10 text-blue-300 border-blue-500/40",
    };
  }

  if (now > banner.endDate) {
    return {
      label: "expired",
      className:
        "bg-red-500/10 text-red-300 border-red-500/40",
    };
  }

  return {
    label: "active",
    className:
      "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  };
}

// SERVER ACTION: update banner in DB
async function updateBanner(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const redirectUrl = String(formData.get("redirectUrl") ?? "").trim();
  const startRaw = String(formData.get("startDate") ?? "").trim();
  const endRaw = String(formData.get("endDate") ?? "").trim();

  if (!id || !title || !imageUrl || !redirectUrl || !startRaw || !endRaw) {
    return;
  }

  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);

  await db.banner.update({
    where: { id },
    data: {
      title,
      imageUrl,
      redirectUrl,
      startDate,
      endDate,
    },
  });

  revalidatePath(`/admin/banners/${id}`);
  revalidatePath("/admin/banners");

  redirect(`/admin/banners/${id}?toast=updated`);
}

// SERVER ACTION: delete banner
async function deleteBanner(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id) return;

  await db.banner.delete({
    where: { id },
  });

  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}
// SERVER ACTION: upload image file to Supabase, update imageUrl, and delete older files for this banner
async function uploadBannerImage(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const file = formData.get("file") as File | null;

  if (!id || !file) {
    return;
  }

  // 1) Upload new file to Supabase
  const arrayBuffer = await file.arrayBuffer();
  const filePath = `admin/banner-${id}-${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabaseServer.storage
    .from("banners")
    .upload(filePath, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    return;
  }

  const {
    data: { publicUrl },
  } = supabaseServer.storage.from("banners").getPublicUrl(filePath);

  // 2) Update DB to use new image URL
  await db.banner.update({
    where: { id },
    data: {
      imageUrl: publicUrl,
    },
  });

  // 3) Clean up old files for this banner in the "admin" folder
  //    We keep ONLY the newly uploaded file (filePath) and delete others
  const prefix = `banner-${id}-`;

  const { data: existingFiles, error: listError } = await supabaseServer.storage
    .from("banners")
    .list("admin"); // list contents of "admin" folder

  if (listError) {
    console.error("Supabase list error while cleaning old banner files:", listError);
  } else if (existingFiles && existingFiles.length > 0) {
    const toRemove = existingFiles
      .filter((obj) => {
        // obj.name is like "banner-4-...jpg"
        const fullPath = `admin/${obj.name}`;
        return (
          obj.name.startsWith(prefix) &&
          fullPath !== filePath // keep the one we just uploaded
        );
      })
      .map((obj) => `admin/${obj.name}`);

    if (toRemove.length > 0) {
      const { error: removeError } = await supabaseServer.storage
        .from("banners")
        .remove(toRemove);

      if (removeError) {
        console.error("Supabase remove error:", removeError);
      }
    }
  }

  // 4) Revalidate pages
  revalidatePath(`/admin/banners/${id}`);
  revalidatePath("/admin/banners");

  redirect(`/admin/banners/${id}?toast=updated`);
}



export default async function BannerDetailPage({
  params,
  searchParams,
}: BannerDetailPageProps) {
  const { id: idParam } = params;
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    notFound();
  }

  const banner = await db.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    notFound();
  }

  const startDefault = toLocalInputValue(banner.startDate);
  const endDefault = toLocalInputValue(banner.endDate);
  const status = getBannerStatus(banner);

  const toastParam = searchParams?.toast;
  const toastType =
    toastParam === "updated"
      ? "updated"
      : toastParam === "created"
      ? "created"
      : undefined;

  return (
    <div className="space-y-6">
      {/* ✅ Toast for update / image upload */}
      <BannerToast type={toastType} />
      
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Banner #{banner.id}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-yellow-400">
            {banner.title}
          </h1>
          <span
            className={[
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              status.className,
            ].join(" ")}
          >
            {status.label}
          </span>
        </div>
        <p className="text-sm text-gray-400">
          Here you can edit this banner&apos;s content, links and schedule.
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

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        {/* Edit form */}
        <form
          action={updateBanner}
          className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm"
        >
          <input type="hidden" name="id" value={banner.id} />

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">
              Title
            </label>
            <input
              type="text"
              name="title"
              defaultValue={banner.title}
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
              defaultValue={banner.imageUrl}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              placeholder="https://..."
            />
            <p className="text-[11px] text-gray-500">
              Direct link to the banner image (stored in Supabase or CDN).
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">
              Redirect URL
            </label>
            <input
              type="text"
              name="redirectUrl"
              defaultValue={banner.redirectUrl}
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

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 transition-colors cursor-pointer"
            >
              Save changes
            </button>
          </div>
        </form>

        {/* Preview / info card */}
        <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm">
          <h2 className="text-base font-semibold text-gray-100">
            Quick preview / info
          </h2>

          {/* Image preview */}
          {banner.imageUrl ? (
            <div className="overflow-hidden rounded-md border border-neutral-800 bg-black/40">
              <div className="bg-neutral-950/80 px-3 py-1 text-[11px] text-gray-400">
                Banner image preview
              </div>
              <div className="w-full h-72 rounded-md overflow-hidden border border-neutral-800 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-gray-500">
              No image URL set for this banner yet.
            </p>
          )}

          <div className="space-y-2 text-xs text-gray-300">
            <p>
              <span className="text-gray-500">Current clicks: </span>
              <span className="font-mono">{banner.clicks}</span>
            </p>
            <p>
              <span className="text-gray-500">Redirect URL: </span>
              <a
                href={banner.redirectUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all underline decoration-dotted hover:text-yellow-300"
              >
                {banner.redirectUrl}
              </a>
            </p>
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-500">
              This is a simple admin-only overview. The actual banner display
              on the public site is handled by your frontend Banner component
              using this data.
            </p>
          </div>
        </div>
      </div>

      {/* Upload new image */}
      <section className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm">
        <h2 className="text-base font-semibold text-gray-100">
          Upload new image
        </h2>
        <p className="mt-1 text-[11px] text-gray-500">
          Upload a new banner image. The file will be stored in the Supabase{" "}
          <span className="font-mono">banners</span> bucket and the image URL
          will be updated automatically.
        </p>

        <form
          action={uploadBannerImage}
          className="mt-3 flex flex-col gap-3 text-xs"
        >
          <input type="hidden" name="id" value={banner.id} />

          <input
            type="file"
            name="file"
            accept="image/*"
            className="w-full cursor-pointer text-xs text-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-yellow-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black file:cursor-pointer hover:file:bg-yellow-400"
            required
          />

          <button
            type="submit"
            className="self-start rounded-md border border-yellow-500/70 bg-yellow-500 px-3 py-1 font-semibold text-xs text-black hover:bg-yellow-400 cursor-pointer"
          >
            Upload &amp; replace image
          </button>
        </form>
      </section>

      {/* Danger zone */}
      <section className="rounded-lg border border-red-800/60 bg-red-950/20 p-4 text-sm">
        <h2 className="text-base font-semibold text-red-300">
          Danger zone
        </h2>
        <p className="mt-1 text-xs text-red-200/80">
          Deleting this banner will permanently remove it from the database.
          Any places that rely on this banner ID will stop showing it.
        </p>

        <form
          action={deleteBanner}
          className="mt-3 flex flex-wrap items-center justify-between gap-3"
        >
          <input type="hidden" name="id" value={banner.id} />
          <p className="text-xs text-red-200/70">
            This action cannot be undone.
          </p>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-red-500/80 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 cursor-pointer"
          >
            Delete banner
          </button>
        </form>
      </section>
    </div>
  );
}
