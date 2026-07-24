import axios from 'axios';
import prisma from '../utils/prisma';

const ML = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const ml = axios.create({ baseURL: ML, timeout: 15000 });

// ── F5 + F3 — Full multitask analysis + uncertainty ──────────────────────────
export async function analyzeReport(reportData: {
  text: string;
  latitude?: number | null;
  longitude?: number | null;
  detectedLanguage?: string;
  languageConfidence?: number;
  priorityConfidence?: number;
}) {
  try {
    const res = await ml.post('/analyze-report', {
      text: reportData.text,
      latitude: reportData.latitude ?? null,
      longitude: reportData.longitude ?? null,
      detected_language: reportData.detectedLanguage ?? 'en',
      language_confidence: reportData.languageConfidence ?? 0.7,
      priority_confidence: reportData.priorityConfidence ?? 0.5,
    });
    return res.data;
  } catch (err: any) {
    console.error('AI analyze-report error:', err.message);
    return null;
  }
}

// ── F4 — Clarification questions ─────────────────────────────────────────────
export async function getClarificationQuestions(data: {
  text: string;
  disaster_type?: string;
  urgency?: string;
  detected_language?: string;
}) {
  try {
    const res = await ml.post('/clarification-questions', data);
    return res.data;
  } catch (err: any) {
    console.error('AI clarification error:', err.message);
    return null;
  }
}

// ── F7 + F8 — Hotspot forecast ───────────────────────────────────────────────
export async function getHotspotForecast() {
  try {
    const [incidents, waterLevels] = await Promise.all([
      prisma.incidentReport.findMany({
        select: {
          id: true, category: true, severity: true,
          latitude: true, longitude: true, createdAt: true,
          province: true, zoneName: true,
        },
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.riverWaterLevel.findMany({
        select: { id: true, riverName: true, district: true, status: true, waterLevelMetres: true },
      }),
    ]);

    const res = await ml.post('/hotspot-forecast', {
      incidents: incidents.map(i => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
      })),
      water_levels: waterLevels,
    });
    return res.data;
  } catch (err: any) {
    console.error('AI hotspot error:', err.message);
    return null;
  }
}

// ── F10 — Resource optimization ──────────────────────────────────────────────
export async function optimizeResources() {
  try {
    const [helpRequests, resources, volunteers] = await Promise.all([
      prisma.helpRequest.findMany({
        where: { status: { in: ['PENDING', 'ASSIGNED'] } },
        select: {
          id: true, type: true, priority: true, status: true,
          latitude: true, longitude: true, peopleCount: true, location: true,
        },
      }),
      prisma.resource.findMany({
        select: { id: true, type: true, location: true, status: true, capacity: true },
      }),
      prisma.user.findMany({
        where: { role: { in: ['VOLUNTEER', 'FIELD_RESPONDER'] } },
        select: {
          id: true, name: true, role: true, isFieldActive: true,
          volunteerProfile: {
            select: {
              readinessScore: true,
              skills: { select: { skillName: true } },
              checkIns: {
                select: { latitude: true, longitude: true, activeHours: true },
                orderBy: { checkInTime: 'desc' },
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    const res = await ml.post('/optimize-allocation', {
      help_requests: helpRequests,
      resources,
      volunteers,
    });
    return res.data;
  } catch (err: any) {
    console.error('AI optimize error:', err.message);
    return null;
  }
}

// ── F12 — Team composition ───────────────────────────────────────────────────
export async function composeTeam(data: {
  disaster_type: string;
  latitude?: number | null;
  longitude?: number | null;
  team_size?: number;
}) {
  try {
    const volunteers = await prisma.user.findMany({
      where: { role: { in: ['VOLUNTEER', 'FIELD_RESPONDER'] } },
      select: {
        id: true, name: true, role: true, isFieldActive: true,
        volunteerProfile: {
          select: {
            readinessScore: true,
            skills: { select: { skillName: true } },
            checkIns: {
              select: { latitude: true, longitude: true, activeHours: true },
              orderBy: { checkInTime: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    const res = await ml.post('/compose-team', {
      volunteers,
      disaster_type: data.disaster_type,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      team_size: data.team_size ?? 4,
    });
    return res.data;
  } catch (err: any) {
    console.error('AI team compose error:', err.message);
    return null;
  }
}

// ── F16 — Situation summary ──────────────────────────────────────────────────
export async function getSituationSummary(windowHours: number = 2) {
  try {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const [incidents, helpRequests, waterLevels, camps] = await Promise.all([
      prisma.incidentReport.findMany({
        where: { createdAt: { gte: since } },
        select: {
          id: true, title: true, category: true, severity: true,
          location: true, province: true, zoneName: true,
          status: true, createdAt: true, mlConfidence: true, detectedLanguage: true,
        },
      }),
      prisma.helpRequest.findMany({
        select: {
          id: true, type: true, priority: true, status: true,
          peopleCount: true, location: true, createdAt: true,
        },
      }),
      prisma.riverWaterLevel.findMany({
        select: { id: true, riverName: true, district: true, status: true },
      }),
      prisma.reliefCamp.findMany({
        select: { id: true, name: true, currentOccupancy: true, totalCapacity: true, status: true },
      }),
    ]);

    const res = await ml.post('/situation-summary', {
      incidents: incidents.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })),
      help_requests: helpRequests.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
      water_levels: waterLevels,
      camps,
      window_hours: windowHours,
    });
    return res.data;
  } catch (err: any) {
    console.error('AI situation summary error:', err.message);
    return null;
  }
}

// ── F15 — Drift detection ────────────────────────────────────────────────────
export async function detectDrift(windowHours: number = 24) {
  try {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const incidents = await prisma.incidentReport.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true, category: true, severity: true,
        detectedLanguage: true, mlConfidence: true,
        province: true, zoneName: true,
        description: true, title: true, createdAt: true,
      },
    });

    const res = await ml.post('/detect-drift', {
      recent_incidents: incidents.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })),
      window_hours: windowHours,
    });
    return res.data;
  } catch (err: any) {
    console.error('AI drift detect error:', err.message);
    return null;
  }
}
