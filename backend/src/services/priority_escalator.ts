import { Status, Severity } from '../../prisma/generated/client';
import prisma from '../utils/prisma';

export async function reevaluateIncidentPriorities() {
  console.log('--- Re-evaluating Incident Priorities ---');

  // Find all pending or assigned incidents
  const openIncidents = await prisma.incidentReport.findMany({
    where: {
      status: {
        in: [Status.PENDING, Status.ASSIGNED]
      }
    }
  });

  for (const incident of openIncidents) {
    if (!incident.location && !incident.province) continue;

    // We fetch severe weather and see if it applies to this incident's location or province
    const severeRain = await prisma.rainfallReading.findFirst({
      where: {
        riskLevel: { in: ['WARNING', 'DANGER'] }
      },
      orderBy: { recordedAt: 'desc' }
    });

    const severeRiver = await prisma.riverWaterLevel.findFirst({
      where: {
        status: { in: ['MINOR_FLOOD', 'MAJOR_FLOOD'] }
      },
      orderBy: { recordedAt: 'desc' }
    });

    // Simple matching logic: if the incident's location or province string contains the severe weather's district
    const rainMatches = severeRain && (
      (incident.province && incident.province.includes(severeRain.district)) || 
      (incident.location && incident.location.includes(severeRain.district))
    );
    
    const riverMatches = severeRiver && (
      (incident.province && incident.province.includes(severeRiver.district)) || 
      (incident.location && incident.location.includes(severeRiver.district))
    );

    if ((rainMatches || riverMatches) && incident.severity !== Severity.CRITICAL && incident.severity !== Severity.HIGH) {
      // Elevate priority
      console.log(`[ESCALATION] Upgrading priority for Incident ${incident.id} from ${incident.severity} to HIGH due to environmental conditions.`);
      
      await prisma.incidentReport.update({
        where: { id: incident.id },
        data: { severity: Severity.HIGH }
      });
      
      // We would also notify the assigned officer via WebSocket here
    }
  }

  console.log('--- Completed Incident Re-evaluation ---');
}
