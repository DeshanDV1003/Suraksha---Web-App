import prisma from '../utils/prisma';

export const createEvacuationRoute = async (data: any) => {
  return prisma.evacuationRoute.create({ data });
};

export const getEvacuationRoutes = async () => {
  return prisma.evacuationRoute.findMany();
};

export const createVolunteerLocation = async (data: any) => {
  return prisma.volunteerLocation.create({ data });
};

export const getVolunteerLocations = async () => {
  return prisma.volunteerLocation.findMany();
};

export const createThreatProjection = async (data: any) => {
  return prisma.threatProjection.create({ data });
};

export const getThreatProjections = async () => {
  return prisma.threatProjection.findMany({ where: { active: true } });
};

export const exportRoutePdf = async (routeData: any, res: any) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(24).font('Helvetica-Bold').text('Evacuation Route Report', { align: 'center' });
  doc.moveDown(2);
  
  doc.fontSize(12).font('Helvetica').text(`Generated Date: ${new Date().toLocaleString()}`);
  doc.moveDown(2);

  doc.fontSize(16).font('Helvetica-Bold').text('Primary Route (Waypoints)');
  doc.moveDown(1);
  if (routeData.primary && routeData.primary.length > 0) {
    routeData.primary.forEach((point: [number, number], index: number) => {
      doc.fontSize(12).font('Helvetica').text(`${index + 1}. Latitude: ${point[0]}, Longitude: ${point[1]}`);
    });
  } else {
    doc.text('No primary route defined.');
  }

  doc.moveDown(2);
  
  doc.fontSize(16).font('Helvetica-Bold').text('Alternate Route (Waypoints)');
  doc.moveDown(1);
  if (routeData.alternate && routeData.alternate.length > 0) {
    routeData.alternate.forEach((point: [number, number], index: number) => {
      doc.fontSize(12).font('Helvetica').text(`${index + 1}. Latitude: ${point[0]}, Longitude: ${point[1]}`);
    });
  } else {
    doc.text('No alternate route defined.');
  }

  doc.end();
};
