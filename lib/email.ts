// lib/email.ts
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const toEmail = process.env.ADVERTISE_CONTACT_TO;
const fromEmail =
  process.env.ADVERTISE_FROM_EMAIL || 'Stat Arena <onboarding@resend.dev>';

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set – email notifications are disabled.');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type AdvertisePayload = {
  clientName: string;
  clientEmail: string;
  message: string;
  pkg?: string | null;
  paymentMethod?: string | null;
  targetUrl?: string | null;
  preferredStartDate?: Date | null;
};

/**
 * Send an email to you (site owner) when a new sponsor inquiry is created.
 * If email env vars are missing, this function just logs and returns.
 */
export async function sendAdvertiseNotification(
  payload: AdvertisePayload,
) {
  if (!resend || !toEmail) {
    console.warn(
      'Resend or ADVERTISE_CONTACT_TO not configured – skipping email send.',
    );
    return;
  }

  const {
    clientName,
    clientEmail,
    message,
    pkg,
    paymentMethod,
    targetUrl,
    preferredStartDate,
  } = payload;

  const subject = `New sponsor inquiry from ${clientName}`;

  const lines: string[] = [
    `You have a new STAT ARENA sponsor inquiry.\n`,
    `Name: ${clientName}`,
    `Email: ${clientEmail}`,
    `Package: ${pkg || 'Not specified'}`,
    `Preferred payment method: ${paymentMethod || 'Not specified'}`,
    `Target URL: ${targetUrl || 'Not provided'}`,
    `Preferred start date: ${
      preferredStartDate ? preferredStartDate.toDateString() : 'Not specified'
    }`,
    '',
    'Message:',
    message || '(no message provided)',
    '',
    '---',
    'This request was sent from the Advertise page.',
  ];

  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject,
    text: lines.join('\n'),
  });
}
