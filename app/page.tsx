'use client';

import {
  Search,
  TrendingUp,
  Target,
  BarChart3,
  Shield,
  Clock3,
  Activity,
  RefreshCcw,
  Database,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import AirdropViewer from '@/components/AirdropModel';
import BannerCarousel from '@/components/BannerCarousel';
import Link from "next/link";


export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/player/${searchQuery}`;
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-200 overflow-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full z-30 bg-neutral-900/60 backdrop-blur-md border-b border-neutral-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-500 font-['Oswald'] tracking-wider">
            STAT ARENA
          </h1>
        </div>
      </header>

      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 z-0" />

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgb(115, 115, 115) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Hero + feature cards */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-24 flex flex-col justify-center items-center pointer-events-none">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 max-w-4xl pointer-events-auto"
        >
          <h1
            className="
              text-3xl sm:text-4xl md:text-6xl lg:text-7xl
              font-bold text-white mb-6
              tracking-tight uppercase
              font-['Oswald']
              leading-[1.02] md:leading-tight
              max-w-full
              px-4
              break-words
              text-center
            "
          >
            PUBG: BATTLEGROUNDS STATS
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 mb-8 font-['Archivo_Narrow']">
            Track your performance, analyze your gameplay, dominate the battleground.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-10">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Soldier's Handle... (e.g., y2k9)"
                className="w-full px-6 py-4 pr-16 text-lg rounded-xl bg-neutral-900/50 backdrop-blur-md border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition-all duration-300 shadow-xl shadow-black/30"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors duration-300"
              >
                <Search className="w-6 h-6 text-neutral-950" />
              </button>
            </div>
          </form>
        </motion.div>

        {/* Feature Cards (top row) */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 justify-center pointer-events-auto">
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Performance"
            description="Track K/D, win rate, and damage over time"
            delay={0.2}
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Visual Analytics"
            description="Track progress with charts and radar evaluations"
            delay={0.4}
          />
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="Match Details"
            description="Detailed info upto 20 recent matches"
            delay={0.6}
          />
        </div>
      </div>

      {/* =============== WHY STAT ARENA =============== */}
      <section className="relative z-10 w-full pointer-events-auto bg-neutral-950/95 border-t border-neutral-900 py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-400 font-['Oswald'] mb-3">
              WHY STAT ARENA?
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase font-['Oswald'] tracking-wider mb-3">
              Built for players who want real insight.
            </h2>
            <p className="text-neutral-400 text-sm md:text-base font-['Archivo_Narrow']">
              Not just numbers on a screen – Stat Arena focuses on clarity, speed and data you can
              actually use to play better.
            </p>
          </div>

          {/* reuse same card style as top feature cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <WhyFeatureCard
              icon={<Shield className="w-7 h-7" />}
              title="Official Data"
              line1="Directly powered by the official PUBG API."
              line2="What you see here matches what you see in-game."
            />
            <WhyFeatureCard
              icon={<Activity className="w-7 h-7" />}
              title="Clear Analysis"
              line1="Trend lines and radar charts highlight patterns."
              line2="Easy to spot strengths & weak spots at a glance."
            />
            <WhyFeatureCard
              icon={<Clock3 className="w-7 h-7" />}
              title="Fast & Focused"
              line1="First deep fetch, then blazing-fast revisits."
              line2="Spend time reading stats, not waiting for them."
            />
          </div>
        </div>
      </section>

      {/* =============== HOW IT WORKS =============== */}
      <section className="relative z-10 w-full pointer-events-auto bg-neutral-950 py-20 md:py-24 border-t border-neutral-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-400 font-['Oswald'] mb-3">
              HOW IT WORKS
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase font-['Oswald'] tracking-wider mb-3">
              From handle to deep stats in four steps.
            </h2>
            <p className="text-neutral-400 text-sm md:text-base font-['Archivo_Narrow']">
              We balance live data with smart caching so you get meaningful stats without hammering
              the PUBG API.
            </p>
          </div>

          {/* Fancy step flow (timeline style) */}
          <div className="hidden md:flex items-center justify-between mb-10 max-w-4xl mx-auto">
            {[
              { step: 1, label: 'Search' },
              { step: 2, label: 'Fetch' },
              { step: 3, label: 'Analyze' },
              { step: 4, label: 'Refresh' },
            ].map((s, idx, arr) => (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-yellow-500 text-neutral-950 flex items-center justify-center font-bold">
                    {s.step}
                  </div>
                  <span className="text-xs font-['Oswald'] uppercase tracking-wide text-neutral-300">
                    {s.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className="h-px bg-neutral-700 flex-1 mx-4" />
                )}
              </div>
            ))}
          </div>

          {/* Step cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <HowStepCard
              icon={<Search className="w-6 h-6" />}
              step="Step 1"
              title="Search"
              text="Enter a PUBG handle. We find the right player on the correct shard (e.g., steam)."
            />
            <HowStepCard
              icon={<Database className="w-6 h-6" />}
              step="Step 2"
              title="Fetch"
              text="On first search, we pull up to 20 recent matches. For very active players this deep sync can take a little longer."
            />
            <HowStepCard
              icon={<BarChart3 className="w-6 h-6" />}
              step="Step 3"
              title="Analyze"
              text="We calculate kills, damage, ADR, survival & distance, then build trend and radar views."
            />
            <HowStepCard
              icon={<RefreshCcw className="w-6 h-6" />}
              step="Step 4"
              title="Refresh"
              text="We cache results so revisits are instant. Played more games? Hit Refresh to grab the latest 20."
            />
          </div>
        </div>
      </section>

      {/* 3D Models */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* Left 3D Model */}
        <div className="hidden lg:block absolute left-4 lg:left-8 top-[180px] w-[200px] lg:w-[220px] h-[260px] lg:h-[280px] pointer-events-auto">
          <AirdropViewer />
        </div>

        {/* Right 3D Model */}
        <div className="hidden lg:block absolute right-4 lg:right-8 top-[180px] w-[200px] lg:w-[220px] h-[260px] lg:h-[280px] pointer-events-auto">
          <AirdropViewer />
        </div>
      </div>

      {/* Banner Carousel */}
      <div className="relative z-30 mt-24 mb-12 pointer-events-auto w-full flex justify-center">
        <BannerCarousel />
      </div>

      {/* Advertise CTA under banner */}
      <div className="relative z-30 mb-10 pointer-events-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-300">
          Want your brand featured here?{" "}
          <Link
            href="/advertise"
            className="font-semibold text-yellow-400 hover:text-yellow-300 underline-offset-2 hover:underline"
          >
            Advertise with STAT ARENA
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-30 border-t border-neutral-800 mt-20 py-8 pointer-events-auto">
        <div className="container mx-auto px-4 text-center text-neutral-500">
          <p>© 2024 BATTLEGROUNDS STATS. Powered by official PUBG API.</p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Reusable cards ---------- */

function FeatureCard({ icon, title, description, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="group"
    >
      <div className="p-6 rounded-xl bg-neutral-900/60 backdrop-blur-md border border-neutral-700 hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 hover:-translate-y-2 h-full flex flex-col">
        <div className="flex items-center justify-center rounded-lg bg-yellow-500 text-neutral-950 mb-4 w-12 h-12">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 uppercase font-['Oswald'] tracking-wider">
          {title}
        </h3>
        <p className="text-neutral-400 font-['Archivo_Narrow']">{description}</p>
      </div>
    </motion.div>
  );
}

function WhyFeatureCard({
  icon,
  title,
  line1,
  line2,
}: {
  icon: React.ReactNode;
  title: string;
  line1: string;
  line2: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-neutral-900/60 backdrop-blur-md border border-neutral-700 hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 hover:-translate-y-2 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center rounded-lg bg-yellow-500 text-neutral-950 w-11 h-11">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white uppercase font-['Oswald'] tracking-wider">
          {title}
        </h3>
      </div>
      <p className="text-neutral-300 text-sm font-['Archivo_Narrow'] mb-1">{line1}</p>
      <p className="text-neutral-400 text-sm font-['Archivo_Narrow']">{line2}</p>
    </div>
  );
}

function HowStepCard({
  icon,
  step,
  title,
  text,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-neutral-900/60 backdrop-blur-md border border-neutral-700 hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 hover:-translate-y-2 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center rounded-lg bg-yellow-500 text-neutral-950 w-11 h-11">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-neutral-400 font-['Oswald']">
            {step}
          </span>
          <h3 className="text-white font-['Oswald'] text-sm md:text-base uppercase tracking-wide">
            {title}
          </h3>
        </div>
      </div>
      <p className="text-neutral-300 text-xs md:text-sm font-['Archivo_Narrow']">
        {text}
      </p>
    </div>
  );
}

