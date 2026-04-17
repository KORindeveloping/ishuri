import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quizzes';
import historyRoutes from './routes/history';
import portfolioRoutes from './routes/portfolio';
import goalsRoutes from './routes/goals';
import chatRoutes from './routes/chat';

const app = express();
const httpServer = createServer(app);
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"]
  }
});

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:5173",
  "https://ishuri.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain (covers all preview & production deployments)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true
}));
app.use(express.json());
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error Handler]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err instanceof Error ? err.message : String(err),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Socket.IO for live feedback simulation
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('start_exam', (data) => {
    console.log('Exam started by:', data.userId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`TVET Mastery Server running on port ${PORT}`);
});
