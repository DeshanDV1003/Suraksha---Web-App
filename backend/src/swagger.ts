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
  },
  apis: ['./src/index.ts', './src/routes/*.ts'],
};

export const specs = swaggerJsdoc(options);
