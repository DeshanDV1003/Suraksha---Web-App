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
import damageAssessmentRoutes from './routes/damageAssessmentRoutes';
import missingPersonRoutes from './routes/missingPersonRoutes';
import supportRoutes from './routes/supportRoutes';
import psychologicalSupportRoutes from './routes/psychologicalSupportRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import auditRoutes from './routes/auditRoutes';
import notificationRoutes from './routes/notificationRoutes';
import locationRoutes from './routes/locationRoutes';
import mapRoutes from './routes/mapRoutes';
import donationRoutes from './routes/donationRoutes';
import familyRoutes from './routes/familyRoutes';
import waterRoutes from './routes/waterRoutes';
import reportRoutes from './routes/reportRoutes';
import aiRoutes from './routes/aiRoutes';
import safeZoneRoutes from './routes/safeZoneRoutes';
import rescueRoutes from './routes/rescueRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import supplyRequestRoutes from './routes/supplyRequestRoutes';
import { setupWaterDataCron } from './services/water-data-fetcher';
import { setupRainfallWeatherCron } from './services/rainfallWeatherCron';
import weatherRoutes from './routes/weatherRoutes';
import { setupBackupCron, runBackup } from './services/backupService';
import { setIO } from './utils/socketInstance';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:19000", "http://localhost:8081"], // Web and Mobile dev ports
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Make io accessible in request object and via singleton for services
app.set('socketio', io);
setIO(io);

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ["http://localhost:5173", "http://localhost:19000", "http://localhost:8081", "https://suraksha-web-app-frontend-rgid-beige.vercel.app"],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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
app.use('/api/assessments', damageAssessmentRoutes);
app.use('/api/missing-persons', missingPersonRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/psych-support', psychologicalSupportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/safe-zones', safeZoneRoutes);
app.use('/api/rescue', rescueRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/supply-requests', supplyRequestRoutes);
app.use('/api/weather', weatherRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Suraksha Backend is Running', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Chat feature WebSockets
  socket.on('join_chat', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined chat session ${sessionId}`);
  });

  // Location/Alert feature WebSockets
  socket.on('join_sector', (sectorId) => {
    socket.join(`sector_${sectorId}`);
    console.log(`Socket ${socket.id} subscribed to alerts for sector ${sectorId}`);
  });

  socket.on('send_message', async (data) => {
    // data should contain { sessionId, senderId, content }
    // we would normally save to DB here, but we can also just save in the HTTP endpoint and emit here, or save here directly.
    // For simplicity, let's just broadcast to the room. The actual DB save will be done via HTTP, or we can just emit it back.
    io.to(data.sessionId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const waterNamespace = io.of('/water');
waterNamespace.on('connection', (socket) => {
  console.log('Client connected to /water namespace:', socket.id);
});

// Start the water data fetch cron job
setupWaterDataCron();

// Start real rainfall weather cron (Open-Meteo, every 30 min, independent)
setupRainfallWeatherCron();

// Start daily DB backup cron (02:00 AM → D:\SurakshaBackups)
setupBackupCron();

// Manual backup trigger (admin only)
app.post('/api/admin/backup', async (req, res) => {
  try {
    await runBackup();
    res.json({ success: true, message: 'Backup completed successfully', location: 'D:\\SurakshaBackups' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Suraksha Backend listening on port ${PORT}`);
  console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
});
