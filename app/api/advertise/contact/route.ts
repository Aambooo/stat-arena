// app/api/advertise/contact/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_TO = process.env.ADVERTISE_CONTACT_TO;
const FROM_EMAIL =
  process.env.ADVERTISE_FROM_EMAIL || 'Stat Arena <onboarding@resend.dev>';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      clientName,
      clientEmail,
      message,
      package: pkg,
      paymentMethod,
      transactionId,
      targetUrl,
      preferredStartDate,
    } = body ?? {};

    // --- basic checks ---
    if (!clientName || !clientEmail || !preferredStartDate) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Name, email and preferred start date are required.',
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(clientEmail)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // normalize URL (optional)
    let normalizedTargetUrl: string | null = null;
    if (targetUrl && typeof targetUrl === 'string') {
      try {
        const u = new URL(
          targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`
        );
        normalizedTargetUrl = u.toString();
      } catch {
        normalizedTargetUrl = null;
      }
    }

    // convert date
    let preferred: Date | null = null;
    if (preferredStartDate) {
      const d = new Date(preferredStartDate);
      if (!Number.isNaN(d.getTime())) {
        preferred = d;
      } else {
        return NextResponse.json(
          { ok: false, error: 'Invalid preferred start date.' },
          { status: 400 }
        );
      }
    }

    // --- save to DB ---
    const created = await db.contactRequest.create({
      data: {
        clientName,
        clientEmail,
        message: message ?? null,
        package: pkg ?? null,
        paymentMethod: paymentMethod ?? null,
        transactionId: transactionId ?? null,
        targetUrl: normalizedTargetUrl,
        preferredStartDate: preferred,
      },
    });

    // --- LOG ENV STATUS (for debugging) ---
    console.log('[CONTACT] RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
    console.log('[CONTACT] ADVERTISE_CONTACT_TO:', CONTACT_TO);
    console.log('[CONTACT] ADVERTISE_FROM_EMAIL:', FROM_EMAIL);

    let emailSent = false;
    let emailError: string | undefined;

    // --- try to send email ---
    if (process.env.RESEND_API_KEY && CONTACT_TO) {
      try {
        const toList = CONTACT_TO.split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        const prettyDate = preferred
          ? preferred.toISOString().slice(0, 10)
          : 'Not specified';

        const html = `
          <h2>New Sponsor Inquiry</h2>
          <p><strong>Name:</strong> ${clientName}</p>
          <p><strong>Email:</strong> ${clientEmail}</p>
          <p><strong>Package:</strong> ${pkg || 'Not specified'}</p>
          <p><strong>Payment method:</strong> ${paymentMethod || 'Not specified'}</p>
          <p><strong>Preferred start date:</strong> ${prettyDate}</p>
          <p><strong>Target URL:</strong> ${
            normalizedTargetUrl || 'Not provided'
          }</p>
          <p><strong>Transaction ID:</strong> ${
            transactionId || 'Not provided'
          }</p>
          <p><strong>Message:</strong></p>
          <pre style="white-space:pre-wrap;font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
${message || '(no message)'}
          </pre>
          <hr />
          <p><strong>Request ID:</strong> ${created.id}</p>
          <p><strong>Status:</strong> ${created.status}</p>
        `;

        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: toList,
          subject: `New sponsor inquiry from ${clientName}`,
          replyTo: clientEmail,
          html,
        });

        console.log('[CONTACT] Resend result:', result);
        emailSent = true;
      } catch (e: any) {
        console.error('[CONTACT] Failed to send email:', e);
        emailError = String(e?.message ?? e);
      }
    } else {
      console.warn(
        '[CONTACT] RESEND_API_KEY or ADVERTISE_CONTACT_TO missing – email not sent.'
      );
    }

    return NextResponse.json(
      {
        ok: true,
        requestId: created.id,
        status: created.status,
        emailSent,
        emailError,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Contact request error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create contact request.',
        details:
          process.env.NODE_ENV === 'development'
            ? String(err?.message ?? err)
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Use POST to submit a contact request.',
    },
    { status: 405 }
  );
}
