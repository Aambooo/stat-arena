'use client';

import { useEffect, useState } from 'react';

type Banner = {
  id: number;
  title: string;
  imageUrl: string;
  redirectUrl: string;
};

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load active banners from API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/banners/active', { cache: 'no-store' });
        if (!res.ok) {
          console.error('Failed to load banners', res.status);
          return;
        }
        const data: Banner[] = await res.json();
        setBanners(data ?? []);
      } catch (err) {
        console.error('Error loading banners', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (!banners.length) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full max-w-5xl px-4">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur-md p-4 md:p-6 shadow-lg shadow-black/40">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Wrapper>
        <div className="h-40 md:h-52 rounded-xl bg-neutral-800/80 animate-pulse" />
      </Wrapper>
    );
  }

  if (!banners.length) {
    return (
      <Wrapper>
        <div className="h-40 md:h-52 flex flex-col items-center justify-center text-neutral-400 text-sm md:text-base">
          <p className="font-['Oswald'] uppercase tracking-[0.2em] text-yellow-400 mb-2">
            Sponsor Spotlight
          </p>
          <p>No active sponsor banners yet. Check back soon.</p>
        </div>
      </Wrapper>
    );
  }

  const next = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  return (
    <Wrapper>
      <div className="relative flex items-center justify-center">
        {/* Left arrow */}
        <button
          onClick={prev}
          className="absolute left-2 md:left-4 z-20 rounded-full bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center text-lg"
        >
          ‹
        </button>

        {/* Slider track */}
        <div className="w-full overflow-hidden">
          <div
            className="flex h-40 md:h-56 lg:h-64 rounded-xl bg-black border border-neutral-700 transition-transform duration-[3500ms] ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {banners.map((banner) => (
              <a
                key={banner.id}
                href={`/api/banners/click/${banner.id}`}
                target="_blank"
                rel="noreferrer"
                className="block min-w-full h-full flex-shrink-0 no-underline"
              >
                <div className="relative w-full h-full">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          className="absolute right-2 md:right-4 z-20 rounded-full bg-black/60 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center text-lg"
        >
          ›
        </button>
      </div>
    </Wrapper>
  );
}
