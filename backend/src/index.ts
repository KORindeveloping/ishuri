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

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: '*', // Allow all during dev for simplicity
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
