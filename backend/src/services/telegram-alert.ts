/**
 * Suraksha — Telegram Flood Alert Service
 * -----------------------------------------
 * Sends formatted flood warnings to a Telegram bot/group.
 * Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in backend/.env
 *
 * To set up (2 minutes):
 *   1. Open Telegram → search @BotFather → /newbot
 *   2. Follow prompts, copy the token → TELEGRAM_BOT_TOKEN
 *   3. Add the bot to your group → get chat ID via
 *      https://api.telegram.org/bot<TOKEN>/getUpdates
 *      → copy the "id" value → TELEGRAM_CHAT_ID
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || '';
const ENABLED   = BOT_TOKEN.length > 0 && CHAT_ID.length > 0;

if (!ENABLED) {
  console.warn('[Telegram] ⚠️  TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in .env — alerts disabled.');
}

// Deduplication: store recently sent alerts (gauge + level) to avoid spam
const recentAlerts = new Map<string, number>(); // gaugeKey → timestamp
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export interface SafeZoneTelegramInfo {
  name: string;
  type: string;
  distanceKm: number;
  isInDangerZone: boolean;
  mapsUrl: string;
  address?: string | null;
}

export interface FloodAlertPayload {
  gaugeName:      string;
  district:       string;
  currentLevelM: number;
  predictedT1M:   number;
  predictedT2M:   number;
  confidence:     number;   // 0.0 – 1.0
  alertLevel:     string;   // WATCH | WARNING | CRITICAL
  watchThreshold: number;
  reason:         string;
  nearestShelter?: string;
  safeZones?:     SafeZoneTelegramInfo[];
  gaugeLatitude?:  number;
  gaugeLongitude?: number;
}

// ─── Format alert emoji by level ────────────────────────────────
function alertEmoji(level: string): string {
  switch (level) {
    case 'CRITICAL': return '🚨';
    case 'WARNING':  return '🟠';
    case 'WATCH':    return '💛';
    default:         return '🔵';
  }
}

// ─── Build the Telegram message ─────────────────────────────────
function buildMessage(p: FloodAlertPayload): string {
  const emoji    = alertEmoji(p.alertLevel);
  const confPct  = Math.round(p.confidence * 100);
  const trend1   = p.predictedT1M > p.currentLevelM ? '▲ rising' : '▼ falling';
  const trend2   = p.predictedT2M > p.predictedT1M  ? '▲ rising' : '▼ falling';
  const now      = new Date().toLocaleString('en-LK', {
    timeZone: 'Asia/Colombo',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const shelter = p.nearestShelter
    ? `\n🏕  <b>Nearest shelter:</b> ${p.nearestShelter}`
    : '';

  // Safe zones section
  let safeZoneSection = '';
  if (p.safeZones && p.safeZones.length > 0) {
    const safeOnes   = p.safeZones.filter(z => !z.isInDangerZone).slice(0, 3);
    const dangerOnes = p.safeZones.filter(z => z.isInDangerZone).slice(0, 2);

    const typeEmoji: Record<string, string> = {
      HOSPITAL: '🏥', SCHOOL: '🏫', TEMPLE: '⛪', POLICE_STATION: '👮',
      FIRE_BRIGADE: '🚒', COMMUNITY_HALL: '🏛', SPORTS_GROUND: '🏟',
    };

    const formatPlace = (z: SafeZoneTelegramInfo) => {
      const em = typeEmoji[z.type] || '📍';
      const addr = z.address ? ` — ${z.address}` : '';
      const flag = z.isInDangerZone ? ' ⚠️' : ' ✅';
      return `   ${em} <a href="${z.mapsUrl}">${z.name}</a>${addr} (${z.distanceKm} km)${flag}`;
    };

    const lines: string[] = ['', '🛡 <b>NEAREST SAFE ZONES:</b>'];
    safeOnes.forEach(z => lines.push(formatPlace(z)));

    if (dangerOnes.length > 0) {
      lines.push('');
      lines.push('⚠️  <i>These places are also in the danger zone — seek alternatives above:</i>');
      dangerOnes.forEach(z => lines.push(formatPlace(z)));
    }

    lines.push('');
    lines.push('📲 <b>Open Suraksha app → Safe Zones for live map & directions</b>');
    safeZoneSection = lines.join('\n');
  }

  return [
    `${emoji} <b>SURAKSHA FLOOD ALERT — ${p.alertLevel}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📍 <b>${p.gaugeName}</b>`,
    `🏛  District: ${p.district}`,
    ``,
    `💧 <b>Current level:</b> ${p.currentLevelM.toFixed(2)} m  (Watch: ${p.watchThreshold.toFixed(1)} m)`,
    ``,
    `🔮 <b>AI PREDICTION (LSTM):</b>`,
    `   In 1 hour: <b>${p.predictedT1M.toFixed(2)} m</b>  ${trend1}`,
    `   In 2 hours: <b>${p.predictedT2M.toFixed(2)} m</b>  ${trend2}`,
    ``,
    `🧠 Confidence: <b>${confPct}%</b>`,
    `📊 Reason: ${p.reason}`,
    shelter,
    safeZoneSection,
    ``,
    `⏰ ${now}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡ Suraksha Command Center`,
  ].join('\n');
}

// ─── Core send function ─────────────────────────────────────────
async function sendMessage(text: string, inlineKeyboard?: object[][]): Promise<boolean> {
  if (!ENABLED) return false;
  try {
    const url  = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload: Record<string, any> = {
      chat_id:    CHAT_ID,
      text,
      parse_mode: 'HTML',
    };
    if (inlineKeyboard) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }
    const body = JSON.stringify(payload);

    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal:  AbortSignal.timeout(10000),
    });

    if (res.ok) {
      console.log('[Telegram] ✅ Alert sent successfully.');
      return true;
    } else {
      const err = await res.text();
      console.error(`[Telegram] ❌ Send failed (${res.status}): ${err}`);
      return false;
    }
  } catch (e) {
    console.error('[Telegram] ❌ Network error:', e);
    return false;
  }
}

// ─── Public: Send flood alert (with deduplication) ───────────────
export async function sendTelegramFloodAlert(p: FloodAlertPayload): Promise<boolean> {
  const key = `${p.gaugeName}:${p.alertLevel}`;
  const now  = Date.now();

  // Dedup check
  const lastSent = recentAlerts.get(key);
  if (lastSent && now - lastSent < DEDUP_WINDOW_MS) {
    console.log(`[Telegram] Dedup: alert for ${key} sent ${Math.round((now - lastSent) / 60000)}m ago — skipping.`);
    return false;
  }

  const message = buildMessage(p);

  // Build inline keyboard: map button for each safe zone + view all link
  const keyboard: object[][] = [];
  if (p.safeZones && p.safeZones.length > 0) {
    const safeOnes = p.safeZones.filter(z => !z.isInDangerZone).slice(0, 3);
    safeOnes.forEach(z => {
      keyboard.push([{ text: `🗺 ${z.name} (${z.distanceKm} km)`, url: z.mapsUrl }]);
    });
  }
  if (p.gaugeLatitude && p.gaugeLongitude) {
    keyboard.push([{
      text: '📍 View Danger Zone on Map',
      url: `https://www.google.com/maps/search/?api=1&query=${p.gaugeLatitude},${p.gaugeLongitude}`,
    }]);
  }
  keyboard.push([{ text: '📲 Open Suraksha App', url: 'https://suraksha.lk' }]);

  const success = await sendMessage(message, keyboard.length > 0 ? keyboard : undefined);

  if (success) {
    recentAlerts.set(key, now);
    // Cleanup old entries
    for (const [k, ts] of recentAlerts.entries()) {
      if (now - ts > DEDUP_WINDOW_MS * 2) recentAlerts.delete(k);
    }
  }

  return success;
}

// ─── Public: Test message ────────────────────────────────────────
export async function sendTelegramTestMessage(): Promise<boolean> {
  const msg = [
    `✅ <b>Suraksha Telegram Integration — Connected</b>`,
    ``,
    `This is a test message from the Suraksha Command Center.`,
    `Flood alert notifications are active.`,
    ``,
    `⏰ ${new Date().toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`,
  ].join('\n');
  return sendMessage(msg);
}

// ─── Public: Daily summary ───────────────────────────────────────
export async function sendTelegramDailySummary(stats: {
  totalGauges: number;
  alertsToday: number;
  criticalCount: number;
  avgConfidence: number;
}): Promise<boolean> {
  const msg = [
    `📊 <b>Suraksha Daily Water Level Summary</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📍 Gauges monitored: ${stats.totalGauges}`,
    `🚨 Alerts sent today: ${stats.alertsToday}`,
    `🔴 Critical events: ${stats.criticalCount}`,
    `🧠 Avg AI confidence: ${Math.round(stats.avgConfidence * 100)}%`,
    ``,
    `⏰ Report time: ${new Date().toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`,
    `⚡ Suraksha Command Center`,
  ].join('\n');
  return sendMessage(msg);
}
