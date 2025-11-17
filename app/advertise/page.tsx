'use client';

import { useState } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function AdvertisePage() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    message: '',
    package: '1_week',
    paymentMethod: 'bank',
    targetUrl: '',
    preferredStartDate: '',
  });

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgb(115,115,115) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Back / logo header */}
        <header className="mb-10 flex items-center justify-between">
          <a
            href="/"
            className="text-2xl font-bold text-yellow-500 font-['Oswald'] tracking-wider"
          >
            STAT ARENA
          </a>

          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-yellow-400 transition-colors"
          >
            <span>←</span>
            <span>Back to Home</span>
          </a>
        </header>

        {/* Page title + subtitle */}
        <div className="mb-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Advertise on <span className="text-yellow-500">STAT ARENA</span>
          </h1>
          <p className="text-gray-300">
            Reach PUBG players with targeted banner placements. Fill out this form
            and we&apos;ll review your campaign details and confirm via email.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
          {/* FORM CARD */}
          <section className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-6 md:p-8 backdrop-blur-md">
            <h2 className="text-2xl font-semibold mb-2">Sponsor Inquiry Form</h2>
            <p className="text-sm text-gray-400 mb-6">
              Tell us about your brand and campaign. We&apos;ll get back to you with
              pricing and next steps.
            </p>

            {/* Status messages */}
            {status === 'success' && successMessage && (
              <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            )}

            {status === 'error' && error && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* FORM */}
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();

                setStatus('submitting');
                setError(null);
                setSuccessMessage(null);

                try {
                  const res = await fetch('/api/advertise/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                  });

                  const data = await res.json();

                  if (!res.ok || !data.ok) {
                    throw new Error(data.error || 'Failed to submit request.');
                  }

                  setStatus('success');
                  setSuccessMessage(
                    'Thank you! Your request has been received. We will contact you within 24–48 hours.'
                  );

                  // Reset the form except for package & paymentMethod defaults
                  setForm({
                    clientName: '',
                    clientEmail: '',
                    message: '',
                    package: form.package,
                    paymentMethod: form.paymentMethod,
                    targetUrl: '',
                    preferredStartDate: '',
                  });
                } catch (err: any) {
                  console.error(err);
                  setStatus('error');
                  setError(err?.message ?? 'Something went wrong. Please try again.');
                }
              }}
            >
              {/* Row 1 – name + email */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Organization / Brand name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    className="w-full rounded-lg bg-neutral-950/60 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="e.g. XYZ Esports, Brand, Product"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contact email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.clientEmail}
                    onChange={(e) => updateField('clientEmail', e.target.value)}
                    className="w-full rounded-lg bg-neutral-950/60 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Row 2 – target URL */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Target URL for banner
                </label>
                <input
                  type="url"
                  required
                  value={form.targetUrl}
                  onChange={(e) => updateField('targetUrl', e.target.value)}
                  className="w-full rounded-lg bg-neutral-950/60 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="https://your-website.com/landing-page"
                />
                <p className="mt-1 text-xs text-gray-400">
                  This is where users will be redirected when they click your banner.
                </p>
              </div>

              {/* Row 3 – package + payment method */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Campaign package
                  </label>
                  <select
                    value={form.package}
                    onChange={(e) => updateField('package', e.target.value)}
                    className="w-full rounded-lg bg-neutral-950/60 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="1_week">1 week – homepage banner</option>
                    <option value="2_weeks">2 weeks – homepage banner</option>
                    <option value="1_month">1 month – homepage banner</option>
                    <option value="custom">Custom package (describe below)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Preferred payment method
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => updateField('paymentMethod', e.target.value)}
                    className="w-full rounded-lg bg-neutral-950/60 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="bank">Bank transfer</option>
                    <option value="qr">QR (Khalti / eSewa / ConnectIPS)</option>
                    <option value="other">Other (mention in message)</option>
                  </select>
                </div>
              </div>

              {/* Row 4 – preferred start date (required) */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Preferred campaign start date
                </label>
                <input
                  type="date"
                  required
                  value={form.preferredStartDate}
                  onChange={(e) => updateField('preferredStartDate', e.target.value)}
                  className="w-full rounded-lg bg-neutral-950/60 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  We&apos;ll confirm availability and final schedule around this date.
                </p>
              </div>

              {/* Row 5 – message */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Campaign details / message
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  className="w-full rounded-lg bg-neutral-950/60 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Describe your brand, target audience, campaign goals, banner creative, and anything else we should know."
                />
              </div>

              {/* Submit button */}
              <div className="pt-2 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="inline-flex items-center justify-center rounded-lg bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'submitting' ? 'Sending…' : 'Submit Request'}
                </button>

                <p className="text-xs text-gray-500">
                  By submitting, you agree that we may contact you via email regarding
                  sponsorship opportunities.
                </p>
              </div>
            </form>
          </section>

          {/* SIDEBAR CARD */}
          <aside className="bg-neutral-900/40 border border-neutral-700 rounded-xl p-6 backdrop-blur-md space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Why advertise here?</h3>
              <ul className="space-y-1 text-sm text-gray-300 list-disc pl-4">
                <li>Highly engaged PUBG audience</li>
                <li>Performance-focused analytics</li>
                <li>Flexible campaign duration (1–4 weeks)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Placement details</h3>
              <ul className="space-y-1 text-sm text-gray-300 list-disc pl-4">
                <li>Premium banner slot on the stats dashboard</li>
                <li>Clickable image linked to your URL</li>
                <li>Impression &amp; click tracking via our backend</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Payment process</h3>
              <ol className="space-y-1 text-sm text-gray-300 list-decimal pl-4">
                <li>Submit this form with your campaign details</li>
                <li>We reply with final quote and QR / bank info</li>
                <li>You confirm payment and share transaction proof</li>
                <li>We activate your banner on agreed dates</li>
              </ol>
            </div>

            <div className="text-xs text-gray-500 border-t border-neutral-800 pt-4">
              * For now, payments are handled manually via QR / bank transfer.
              Automation and dashboard will be added in later phases.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
