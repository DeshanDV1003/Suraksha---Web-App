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

// ── R3 — Evidence graph verification ────────────────────────────────────────
export async function verifyIncidentCredibility(reportId: string) {
  try {
    const target = await prisma.incidentReport.findUnique({
      where: { id: reportId },
      select: {
        id: true, description: true, latitude: true, longitude: true,
        category: true, severity: true, createdAt: true,
        mlConfidence: true, zoneName: true,
      },
    });
    if (!target) return null;

    const related = await prisma.incidentReport.findMany({
      where: {
        id: { not: reportId },
        createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        latitude: { not: null }, longitude: { not: null },
      },
      select: {
        id: true, description: true, latitude: true, longitude: true,
        category: true, severity: true, createdAt: true, mlConfidence: true,
      },
      take: 10,
    });

    const res = await ml.post('/verify-incident', {
      target_report: {
        text: target.description || '',
        latitude: target.latitude, longitude: target.longitude,
        district: target.zoneName || 'UNKNOWN',
        disaster_type: target.category || 'UNKNOWN',
        timestamp_hour: new Date(target.createdAt).getHours(),
        user_verified: false, is_volunteer: false, is_officer: false,
        reports_submitted: 1, past_accuracy: 0.7,
      },
      related_reports: related.map(r => ({
        text: r.description || '',
        latitude: r.latitude, longitude: r.longitude,
        district: 'UNKNOWN',
        disaster_type: r.category || 'UNKNOWN',
        timestamp_hour: new Date(r.createdAt).getHours(),
        user_verified: false, reports_submitted: 1,
        past_accuracy: (r.mlConfidence ?? 70) / 100,
      })),
      verifications: [],
    });
    return res.data;
  } catch (err: any) {
    console.error('AI verify-incident error:', err.message);
    return null;
  }
}

// ── R4 — Active learning annotation queue ───────────────────────────────────
export async function getActiveLearningQueue() {
  try {
    // mlConfidence stored as 0.0–1.0 float; fetch recent reports with low or null confidence
    const reports = await prisma.incidentReport.findMany({
      where: {
        OR: [
          { mlConfidence: { lt: 0.75 } },
          { mlConfidence: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, description: true, detectedLanguage: true,
        severity: true, category: true, mlConfidence: true, createdAt: true,
      },
      take: 20,
    });

    if (reports.length === 0) return { ranked_candidates: [], total_candidates: 0 };

    const candidates = reports.map(r => ({
      text: r.description || '',
      language: r.detectedLanguage || 'en',
      urgency: r.severity || 'MEDIUM',
      disaster_type: r.category || 'UNKNOWN',
      has_vulnerable: false,
      predicted_label: r.severity || 'MEDIUM',
      confidence_distribution: (() => {
        const c = r.mlConfidence ?? 0.50;  // already 0.0–1.0
        const rest = (1 - c) / 3;
        return [c, rest, rest, rest];
      })(),
      embedding: [],
      report_id: r.id,
    }));

    const res = await ml.post('/active-learning/query', { candidates, n_select: 10 });
    return res.data;
  } catch (err: any) {
    console.error('AI active-learning error:', err.message);
    return null;
  }
}

// ── R5 — Bias-aware spatiotemporal district risk forecast ────────────────────
export async function getBiasAwareRiskForecast() {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const incidents = await prisma.incidentReport.findMany({
      where: { createdAt: { gte: since }, latitude: { not: null } },
      select: { severity: true, zoneName: true, createdAt: true },
    });

    const waterLevels = await prisma.riverWaterLevel.findMany({
      select: { district: true, status: true },
    });

    // Group incidents by district with temporal decay buckets
    const districtMap: Record<string, { hours_ago: number; severity: string; count: number }[]> = {};
    const now = Date.now();
    for (const inc of incidents) {
      const dist = inc.zoneName || 'Unknown';
      const hoursAgo = (now - new Date(inc.createdAt).getTime()) / 3600000;
      if (!districtMap[dist]) districtMap[dist] = [];
      districtMap[dist].push({ hours_ago: hoursAgo, severity: inc.severity || 'MEDIUM', count: 1 });
    }

    const month = new Date().getMonth() + 1;
    const districts = Object.entries(districtMap).map(([district, history]) => {
      const wl = waterLevels.find(w => w.district === district);
      return {
        district,
        incident_history: history,
        environmental_data: wl ? {
          rainfall_mm_hr: 0,
          river_status: wl.status ?? 'NORMAL',
        } : undefined,
      };
    });

    if (districts.length === 0) return { forecasts: [], summary: { bias_warning: 'No recent incidents.' } };

    const res = await ml.post('/forecast/multi-district', { districts, month });
    return res.data;
  } catch (err: any) {
    console.error('AI bias-forecast error:', err.message);
    return null;
  }
}

// ── R6 — NSGA-II multi-objective relief coordination ────────────────────────
export async function coordinateRelief() {
  try {
    const [helpRequests, resources, volunteers] = await Promise.all([
      prisma.helpRequest.findMany({
        where: { status: { in: ['PENDING', 'ASSIGNED'] } },
        select: {
          id: true, type: true, priority: true,
          latitude: true, longitude: true, peopleCount: true, location: true,
        },
        take: 10,
      }),
      prisma.resource.findMany({
        select: { type: true, status: true, capacity: true },
      }),
      prisma.user.findMany({
        where: { role: { in: ['VOLUNTEER', 'FIELD_RESPONDER'] }, isFieldActive: true },
        select: { id: true },
      }),
    ]);

    const SEVERITY_MAP: Record<string, string> = {
      CRITICAL: 'CRITICAL', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW',
      URGENT: 'CRITICAL', NORMAL: 'LOW',
    };

    const sites = helpRequests.map((r, i) => ({
      id: r.id,
      severity: SEVERITY_MAP[r.priority] || 'MEDIUM',
      distance_km: 10 + i * 5,
      affected_persons: r.peopleCount || 10,
      resource_needs: { medical_kits: 2, food_packages: 5, shelters: 1, boats: 0, rescue_equipment: 1 },
    }));

    // Tally depot from available resources
    const depot = { volunteer_teams: volunteers.length || 5, medical_kits: 0, boats: 0, food_packages: 0, shelters: 0, rescue_equipment: 0 };
    for (const r of resources) {
      if (r.status === 'AVAILABLE') {
        const t = r.type?.toLowerCase() || '';
        if (t.includes('medical')) depot.medical_kits += Number(r.capacity) || 5;
        else if (t.includes('boat')) depot.boats += Number(r.capacity) || 1;
        else if (t.includes('food')) depot.food_packages += Number(r.capacity) || 10;
        else if (t.includes('shelter') || t.includes('camp')) depot.shelters += Number(r.capacity) || 3;
        else depot.rescue_equipment += Number(r.capacity) || 2;
      }
    }
    // Fallback minimums so algorithm always has something to work with
    depot.medical_kits = Math.max(depot.medical_kits, 10);
    depot.food_packages = Math.max(depot.food_packages, 20);
    depot.shelters = Math.max(depot.shelters, 5);
    depot.rescue_equipment = Math.max(depot.rescue_equipment, 4);
    depot.boats = Math.max(depot.boats, 2);

    if (sites.length === 0) return { pareto_front: [], recommended_plan: null, narrative: 'No active help requests to coordinate.' };

    const res = await ml.post('/relief/coordinate', {
      sites,
      depot,
      available_teams: depot.volunteer_teams,
      preferred_objective: 'BALANCED',
    });
    return res.data;
  } catch (err: any) {
    console.error('AI relief-coordinate error:', err.message);
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
