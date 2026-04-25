import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';

// Routes
import authRoutes from './routes/authRoutes';
import incidentRoutes from './routes/incidentRoutes';
import alertRoutes from './routes/alertRoutes';
import campRoutes from './routes/campRoutes';
import userRoutes from './routes/userRoutes';
import resourceRoutes from './routes/resourceRoutes';
import tokenRoutes from './routes/tokenRoutes';
import volunteerRoutes from './routes/volunteerRoutes';
import helpRequestRoutes from './routes/helpRequestRoutes';
import reliefTokenRoutes from './routes/reliefTokenRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import supportRoutes from './routes/supportRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:19000", "http://localhost:8081"], // Web and Mobile dev ports
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Make io accessible in request object
app.set('socketio', io);

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/relief-tokens', reliefTokenRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/support', supportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Suraksha Backend is Running', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Suraksha Backend listening on port ${PORT}`);
  console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
});
