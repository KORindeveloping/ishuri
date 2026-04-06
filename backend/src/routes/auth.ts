import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'tvet_secret_key_2026';

// Student Signup
router.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password, trade } = req.body;

  if (!name || !email || !password || !trade) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        trade,
        role: 'Student'
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const userData = user as any;
    res.status(201).json({ 
      user: { 
        ...userData, 
        competencies: userData.competencies ? JSON.parse(userData.competencies) : [],
        streak: userData.streak || 0
      }, 
      token 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed', details: error instanceof Error ? error.message : String(error) });
  }
});

// Student Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // --- Robust Streak Logic ---
    let newStreak = user.streak || 0;
    const now = new Date();
    const last = user.lastLogin ? new Date(user.lastLogin) : null;
    
    const today = now.toISOString().split('T')[0];
    const lastDay = last ? last.toISOString().split('T')[0] : null;

    if (newStreak === 0) {
      newStreak = 1;
    } else if (lastDay && today !== lastDay) {
      const diffDays = Math.floor(Math.abs(now.getTime() - last!.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak++;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { streak: newStreak, lastLogin: now }
    });

    const userData = updatedUser as any;
    res.status(200).json({ 
      user: { 
        ...userData, 
        competencies: userData.competencies ? JSON.parse(userData.competencies) : [] 
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error instanceof Error ? error.message : String(error) });
  }
});

// Update User Onboarding Data
router.patch('/onboarding', async (req: Request, res: Response) => {
  const { userId, subjects, studyTime, trade, educationLevel, combination } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        subjects,
        studyTime,
        trade,
        educationLevel,
        combination
      }
    });

    const { password: _, ...userData } = user;
    res.status(200).json({ user: { ...userData, competencies: [] } });
  } catch (error) {
    console.error('Onboarding update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Update generic profile
router.patch('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, trade, educationLevel, combination, subjects, studyTime } = req.body;
  const userId = req.user?.id;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, trade, educationLevel, combination, subjects, studyTime }
    });
    const userData = user as any;
    res.status(200).json({ 
      user: { 
        ...userData, 
        competencies: userData.competencies ? JSON.parse(userData.competencies) : [] 
      } 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Get current profile (and update streak)
router.get('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // --- Robust Streak Logic ---
    let newStreak = user.streak || 0;
    const now = new Date();
    const last = user.lastLogin ? new Date(user.lastLogin) : null;
    
    const today = now.toISOString().split('T')[0];
    const lastDay = last ? last.toISOString().split('T')[0] : null;

    if (newStreak === 0) {
      newStreak = 1;
    } else if (lastDay && today !== lastDay) {
      const diffDays = Math.floor(Math.abs(now.getTime() - last!.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak++;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { streak: newStreak, lastLogin: now }
    });

    const userData = updatedUser as any;
    res.status(200).json({ 
      user: { 
        ...userData, 
        competencies: userData.competencies ? JSON.parse(userData.competencies) : [] 
      } 
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

export default router;
