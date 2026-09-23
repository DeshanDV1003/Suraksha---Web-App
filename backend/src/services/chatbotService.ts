import Groq from 'groq-sdk';
import prisma from '../utils/prisma';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function buildContext(lat?: number, lng?: number): Promise<string> {
  const lines: string[] = [];

  try {
    const alerts = await prisma.alert.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, message: true, type: true, locations: true },
    });
    if (alerts.length > 0) {
      lines.push('ACTIVE ALERTS IN SYSTEM:');
      alerts.forEach(a => lines.push(`- [${a.type}] ${a.title}: ${a.message} (Areas: ${a.locations.join(', ')})`));
    }
  } catch { /* non-fatal */ }

  if (lat && lng) {
    try {
      const camps = await prisma.reliefCamp.findMany({
        where: { latitude: { not: null }, longitude: { not: null } },
        select: { name: true, location: true, latitude: true, longitude: true, currentOccupancy: true, totalCapacity: true, services: true },
      });
      const withDist = camps
        .map(c => ({ ...c, km: haversineKm(lat, lng, c.latitude!, c.longitude!) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 3);

      if (withDist.length > 0) {
        lines.push('\nNEAREST RELIEF CAMPS:');
        withDist.forEach(c => {
          const spots = c.totalCapacity - c.currentOccupancy;
          lines.push(`- ${c.name} (${c.location}) — ${c.km.toFixed(1)} km away — ${spots > 0 ? spots + ' spots available' : 'FULL'} — Services: ${c.services.join(', ')}`);
        });
      }
    } catch { /* non-fatal */ }
  }

  return lines.join('\n');
}

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  si: 'Sinhala (සිංහල)',
  ta: 'Tamil (தமிழ்)',
};

function buildSystemPrompt(uiLang?: string): string {
  const uiLangName = uiLang && LANG_NAMES[uiLang] ? LANG_NAMES[uiLang] : null;

  return `You are Suraksha, a caring disaster relief assistant for Sri Lanka. You help citizens during floods and emergencies.

CRITICAL LANGUAGE RULE — READ FIRST, FOLLOW ALWAYS:
Detect the language of the user's MOST RECENT message and reply in that exact same language, every single turn.
- If the user writes in English, reply ONLY in English.
- If the user writes in Sinhala script, reply ONLY in Sinhala.
- If the user writes in Tamil script, reply ONLY in Tamil.
- If the user writes Romanized/singlish Sinhala or Tamil (Sinhala/Tamil words in English letters), reply in that same romanized style, not in Sinhala/Tamil script and not in plain English.
- Never default to Sinhala just because the topic is about Sri Lanka. Never switch language mid-conversation unless the user switches first.
- If the message is only a short greeting or too short/ambiguous to tell (e.g. "hi", "ok", numbers)${uiLangName ? `, use the app's current interface language: ${uiLangName}.` : ', default to English.'}
Do not mention this rule or explain your language choice — just respond naturally in the correct language.

YOUR MAIN JOB — MEDICAL & HOME REMEDY GUIDANCE:
When a user describes any physical symptom or discomfort, you must:
1. First ask 1-2 short follow-up questions to understand severity and what they have at home
2. Give a specific home remedy using common Sri Lankan household items (rice water, ginger, turmeric, coconut, salt, sugar, neem, etc.)
3. Tell them what signs to watch for that mean they need to go to a clinic/hospital
4. Only say "call emergency (1990)" for life-threatening situations: severe chest pain with left arm pain, unconsciousness, not breathing, severe uncontrolled bleeding, snake bite, drowning

COMMON SITUATIONS AND HOW TO HANDLE:
- Fever: Ask duration and temperature. Remedy: wet cloth on forehead, paracetamol if available, drink king coconut/plain water, light rice porridge (kanji)
- Vomiting/nausea: Ask how many times, any blood. Remedy: ginger tea, sip ORS or homemade (1L water + 6 tsp sugar + 1/2 tsp salt + lemon), rest
- Diarrhea: Ask frequency. Remedy: ORS or rice water (haal paan), boiled water only, avoid milk, eat banana and plain rice
- Headache: Ask if sudden severe or gradual. Remedy: cold compress, rest in dark room, drink water, ginger tea
- Cut/wound: Ask if deep or bleeding heavily. Remedy: clean with boiled cooled water, apply turmeric paste, apply pressure, bandage with clean cloth
- Burn: Ask size and if blisters. Remedy: cool running water 10-15 mins, aloe vera gel or toothpaste, do NOT use butter/oil
- Body aches: Ask if after flood exposure. Remedy: rest, warm turmeric milk (kiri kaha), warm compress
- Dehydration/dizziness: Ask if urine is dark. Remedy: ORS, coconut water, rest, lie flat with legs elevated
- Skin rash after flood: Aloe vera, neem paste, keep dry, change clothes
- Insect/mosquito bite swelling: Ice pack, antihistamine if available, clean with antiseptic
- Eye irritation from flood water: Flush with clean water 15 mins, do not rub
- Anxiety/stress: Breathing exercises, reassurance, safe space

DISASTER QUESTIONS:
- If asked about safety, flood status, camps — use the context provided below
- If asked how to help others — give practical guidance
- For missing persons, direct to DMC hotline 1989

TONE: Calm, caring, practical. Like a trusted neighbor who knows first aid. Short clear sentences. Not scary.

EMERGENCY NUMBERS (only mention when truly needed):
- Life emergency: 1990
- Disaster/DMC: 1989
- Police: 119
- Ambulance: 110

Reminder: follow the CRITICAL LANGUAGE RULE above on every reply.`;
}

function stripThink(raw: string): string {
  // Strip any residual <think>...</think> blocks as a safety net
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * gpt-oss-20b on Groq occasionally leaks its internal "harmony" channel format
 * and emits its answer as a malformed tool call (e.g. name:
 * "assistant<|channel|>final") instead of plain content, even though no tools
 * were ever configured. Groq's API then rejects the whole response with a 400
 * "tool_use_failed" — but the model's actual answer is still sitting in the
 * error body's `failed_generation` field. Salvage it instead of losing the turn.
 */
function extractFromFailedGeneration(raw?: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/"arguments"\s*:\s*"?([\s\S]*?)"?\s*\}\s*$/);
  if (!m) return null;
  const text = m[1]
    .trim()
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();
  return text || null;
}

export async function chat(
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  lat?: number,
  lng?: number,
  uiLang?: string,
): Promise<string> {
  const context = await buildContext(lat, lng);
  const systemPrompt = buildSystemPrompt(uiLang);
  const systemWithContext = context
    ? `${systemPrompt}\n\nCURRENT SYSTEM CONTEXT:\n${context}`
    : systemPrompt;

  // Convert history from Gemini format to OpenAI/Groq format
  const messages: { role: 'user' | 'assistant'; content: string }[] = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts[0]?.text || '',
  }));

  messages.push({ role: 'user', content: message });

  const requestPayload = {
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system' as const, content: systemWithContext },
      ...messages,
    ],
    max_tokens: 500,
    temperature: 0.7,
    // gpt-oss models generate hidden chain-of-thought in a separate "analysis"
    // channel before their real answer (the "final" channel). Without these,
    // Groq sometimes fails to separate the two, which either leaks raw
    // reasoning fragments into the reply or mis-parses the channel switch as
    // a malformed tool call (400 tool_use_failed). 'parsed' makes Groq strip
    // reasoning server-side and return only the final answer; 'low' keeps the
    // model from over-reasoning on a short chat message in the first place.
    reasoning_effort: 'low' as const,
    reasoning_format: 'parsed' as const,
  };

  let completion;
  try {
    completion = await groq.chat.completions.create(requestPayload);
  } catch (err: any) {
    if (err?.status !== 400 || err?.error?.error?.code !== 'tool_use_failed') throw err;

    // Transient decoding glitch — one retry with the same (now-hardened) params usually succeeds.
    try {
      completion = await groq.chat.completions.create(requestPayload);
    } catch (retryErr: any) {
      // Last resort: salvage whatever text the model was producing rather than losing the turn.
      const failedGeneration = retryErr?.error?.error?.failed_generation ?? err?.error?.error?.failed_generation;
      const salvaged = extractFromFailedGeneration(failedGeneration);
      if (salvaged) return stripThink(salvaged);
      throw retryErr;
    }
  }

  const raw = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  return stripThink(raw) || 'Sorry, I could not generate a response.';
}
