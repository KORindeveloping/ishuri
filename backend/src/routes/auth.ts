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
  console.log('[Signup] Request for:', email);

  if (!name || !email || !password || !trade) {
    const missing = [];
    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!trade) missing.push('trade');
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      console.log('[Signup] User already exists:', normalizedEmail);
      return res.status(400).json({ error: 'This email is already registered. Please try logging in instead.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('[Signup] Password hashed successfully');
    
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        trade,
        role: 'Student',
        streak: 1,
        lastLogin: now
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userWithoutPassword } = user as any;
    let competencies = [];
    try {
      competencies = userWithoutPassword.competencies ? JSON.parse(userWithoutPassword.competencies) : [];
    } catch (e) {
      console.error('Failed to parse competencies during signup:', e);
      competencies = [];
    }

    res.status(201).json({ 
      user: { 
        ...userWithoutPassword, 
        competencies,
        streak: 1
      }, 
      token 
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Specifically handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already in use (P2002)' });
    }
    
    res.status(500).json({ error: 'Signup failed', details: error instanceof Error ? error.message : String(error) });
  }
});

// Student Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log('[Login] Request for:', email);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      console.log('[Login] User not found:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[Login] Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // --- Robust Streak Logic ---
    let newStreak = user.streak || 1;
    const now = new Date();
    const last = user.lastLogin ? new Date(user.lastLogin) : null;
    
    const today = now.toISOString().split('T')[0];
    const lastDay = (last && !isNaN(last.getTime())) ? last.toISOString().split('T')[0] : null;

    if (!last || isNaN(last.getTime())) {
      // First time ever logging in or invalid date
      newStreak = 1;
    } else if (today !== lastDay) {
      // It's a new day - check if it was exactly yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDay = yesterday.toISOString().split('T')[0];

      if (lastDay === yesterdayDay) {
        // Consecutive calendar day
        newStreak++;
      } else {
        // Streak broken (more than 1 day gap)
        newStreak = 1;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { streak: newStreak, lastLogin: now }
    });

    const { password: _, ...userWithoutPassword } = updatedUser as any;
    let competencies = [];
    try {
      competencies = userWithoutPassword.competencies ? JSON.parse(userWithoutPassword.competencies) : [];
    } catch (e) {
      console.error('Failed to parse competencies during login:', e);
      competencies = [];
    }

    res.status(200).json({ 
      user: { 
        ...userWithoutPassword, 
        competencies 
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
    const { password: _, ...userWithoutPassword } = user as any;
    let competencies = [];
    try {
      competencies = userWithoutPassword.competencies ? JSON.parse(userWithoutPassword.competencies) : [];
    } catch (e) {
      console.error('Failed to parse competencies during profile update:', e);
      competencies = [];
    }

    res.status(200).json({ 
      user: { 
        ...userWithoutPassword, 
        competencies
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
    let newStreak = user.streak || 1;
    const now = new Date();
    const last = user.lastLogin ? new Date(user.lastLogin) : null;
    
    const today = now.toISOString().split('T')[0];
    const lastDay = (last && !isNaN(last.getTime())) ? last.toISOString().split('T')[0] : null;

    if (!last || isNaN(last.getTime())) {
      newStreak = 1;
    } else if (today !== lastDay) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDay = yesterday.toISOString().split('T')[0];

      if (lastDay === yesterdayDay) {
        newStreak++;
      } else {
        newStreak = 1;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { streak: newStreak, lastLogin: now }
    });

    const { password: _, ...userWithoutPassword } = updatedUser as any;
    let competencies = [];
    try {
      competencies = userWithoutPassword.competencies ? JSON.parse(userWithoutPassword.competencies) : [];
    } catch (e) {
      console.error('Failed to parse competencies during profile fetch:', e);
      competencies = [];
    }

    res.status(200).json({ 
      user: { 
        ...userWithoutPassword, 
        competencies
      } 
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

export default router;
