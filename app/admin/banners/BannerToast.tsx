"use client";

import { useEffect, useState } from "react";

export default function BannerToast({
  type,
}: {
  type?: "created" | "updated";
}) {
  const [visible, setVisible] = useState(!!type);

  useEffect(() => {
    if (!type) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [type]);

  if (!visible || !type) return null;

  const message =
    type === "created"
      ? "Banner created successfully."
      : "Banner updated successfully.";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-lg bg-neutral-900 border border-emerald-500/60 px-4 py-3 text-sm text-emerald-100 shadow-lg shadow-black/40">
        {message}
      </div>
    </div>
  );
}
