import swaggerJsdoc, { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Suraksha DMC API',
      version: '1.0.0',
      description: 'API documentation for the Suraksha Disaster Management Center',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        IncidentReport: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] },
            severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            category: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            reporterId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        DamageAssessment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              reportedById: { type: 'string' },
              incidentId: { type: 'string' },
              location: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              category: { type: 'string' },
              structuralDamage: { type: 'string' },
              cropDamage: { type: 'string' },
              utilityDamage: { type: 'string' },
              roadDamage: { type: 'string' },
              affectedPersons: { type: 'number' },
              estimatedLoss: { type: 'number' },
              mediaUrls: { type: 'array', items: { type: 'string' } },
              status: { type: 'string' },
              notes: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            }
        }
      },
    },
  },
  apis: ['./src/index.ts', './src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(options);
