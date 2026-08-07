import nodemailer from 'nodemailer';

// ── Twilio (SMS + WhatsApp) ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const twilio = require('twilio');

const twilioClient = (() => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token && !sid.startsWith('ACxxx')) {
    return twilio(sid, token);
  }
  return null;
})();

// ── Nodemailer (SMTP Email) ───────────────────────────────────────────────────
const mailer = (() => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass && !pass.startsWith('your_')) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });
  }
  return null;
})();

// ── SMS ───────────────────────────────────────────────────────────────────────
export const sendSMS = async (phones: string[], title: string, body: string): Promise<void> => {
  if (!twilioClient) {
    console.warn('[ChannelDelivery] SMS skipped — TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not configured');
    return;
  }
  const from = process.env.TWILIO_SMS_FROM;
  if (!from) {
    console.warn('[ChannelDelivery] SMS skipped — TWILIO_SMS_FROM not configured');
    return;
  }

  const text = `🚨 SURAKSHA ALERT\n${title}\n\n${body}`;
  const validPhones = phones.filter(p => p && p.trim().length >= 7);

  let sent = 0;
  for (const to of validPhones) {
    try {
      await twilioClient.messages.create({ from, to, body: text });
      sent++;
    } catch (err: any) {
      console.error(`[ChannelDelivery] SMS failed to ${to}:`, err.message);
    }
  }
  console.log(`[ChannelDelivery] SMS: sent to ${sent}/${validPhones.length} recipients`);
};

// ── WhatsApp ──────────────────────────────────────────────────────────────────
export const sendWhatsApp = async (phones: string[], title: string, body: string): Promise<void> => {
  if (!twilioClient) {
    console.warn('[ChannelDelivery] WhatsApp skipped — Twilio not configured');
    return;
  }
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    console.warn('[ChannelDelivery] WhatsApp skipped — TWILIO_WHATSAPP_FROM not configured');
    return;
  }

  const text = `🚨 *SURAKSHA DISASTER ALERT*\n*${title}*\n\n${body}\n\n_Sent by Suraksha Disaster Management System_`;
  const validPhones = phones.filter(p => p && p.trim().length >= 7);

  let sent = 0;
  for (const to of validPhones) {
    const waTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    try {
      await twilioClient.messages.create({ from, to: waTo, body: text });
      sent++;
    } catch (err: any) {
      console.error(`[ChannelDelivery] WhatsApp failed to ${to}:`, err.message);
    }
  }
  console.log(`[ChannelDelivery] WhatsApp: sent to ${sent}/${validPhones.length} recipients`);
};

// ── Email ─────────────────────────────────────────────────────────────────────
export const sendAlertEmail = async (emails: string[], title: string, body: string, locations: string[]): Promise<void> => {
  if (!mailer) {
    console.warn('[ChannelDelivery] Email skipped — SMTP not configured');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const validEmails = emails.filter(e => e && e.includes('@'));
  if (validEmails.length === 0) return;

  const locationText = locations.length > 0 ? locations.join(', ') : 'All Island';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:24px 32px;">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🚨 SURAKSHA DISASTER ALERT</h1>
        <p style="color:#fca5a5;margin:6px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Sri Lanka Disaster Management System</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:18px;margin:0 0 12px;">${title}</h2>
        <p style="color:#374151;line-height:1.7;font-size:15px;margin:0 0 24px;">${body}</p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-size:13px;color:#7f1d1d;font-weight:700;">📍 AFFECTED AREAS</p>
          <p style="margin:4px 0 0;color:#991b1b;font-size:14px;">${locationText}</p>
        </div>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
          This is an automated alert from Suraksha Disaster Management System.
          Follow official instructions from local authorities.
        </p>
      </div>
    </div>
  `;

  try {
    await mailer.sendMail({
      from,
      to: validEmails.join(', '),
      subject: `🚨 ALERT: ${title}`,
      html,
      text: `SURAKSHA DISASTER ALERT\n\n${title}\n\n${body}\n\nAffected areas: ${locationText}`,
    });
    console.log(`[ChannelDelivery] Email: sent to ${validEmails.length} recipients`);
  } catch (err: any) {
    console.error('[ChannelDelivery] Email send failed:', err.message);
  }
};
