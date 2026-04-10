import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'tvet_secret_key_2026';

// Multer storage setup for avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'unknown';
    cb(null, `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

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
    console.log('[Login] Finding user in database...');
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      console.log('[Login] User not found:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('[Login] User found, comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[Login] Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('[Login] Signing JWT token...');
    let token;
    try {
      token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    } catch (jwtError) {
      console.error('[Login] JWT signing failed:', jwtError);
      throw new Error('Internal authentication error (JWT)');
    }
    
    // --- Robust Streak Logic ---
    console.log('[Login] Calculating streak...');
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

    console.log('[Login] Updating user streak and lastLogin...');
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { streak: newStreak, lastLogin: now }
      });
    } catch (dbError) {
      console.error('[Login] Database update failed:', dbError);
      // We can still proceed if streak update fails, but we should log it
      updatedUser = user; 
    }

    const { password: _, ...userWithoutPassword } = (updatedUser || user) as any;
    let competencies = [];
    try {
      if (userWithoutPassword.competencies) {
        competencies = JSON.parse(userWithoutPassword.competencies);
      }
    } catch (e) {
      console.error('[Login] Failed to parse competencies:', e);
      competencies = [];
    }

    console.log('[Login] Login successful for:', normalizedEmail);
    res.status(200).json({ 
      user: { 
        ...userWithoutPassword, 
        competencies 
      }, 
      token 
    });
  } catch (error: any) {
    console.error('[Login] Fatal error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      details: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update User Onboarding Data
router.patch('/onboarding', async (req: Request, res: Response) => {
  const { userId, subjects, studyTime, trade, educationLevel, combination } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const now = new Date();
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        subjects,
        studyTime,
        trade,
        educationLevel,
        combination,
        lastLogin: now
      }
    });

    const { password: _, ...userData } = user;
    let competencies = [];
    try {
      competencies = userData.competencies ? JSON.parse(userData.competencies) : [];
    } catch (e) {
      console.error('Failed to parse competencies during onboarding:', e);
      competencies = [];
    }
    res.status(200).json({ user: { ...userData, competencies } });
  } catch (error) {
    console.error('Onboarding update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Update generic profile
router.patch('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, trade, educationLevel, combination, subjects, studyTime, avatarUrl, restDay } = req.body;
  const userId = req.user?.id;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, trade, educationLevel, combination, subjects, studyTime, avatarUrl, restDay }
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

// Change Password
router.patch('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password incorrect' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete Account
router.delete('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Avatar Upload
router.post('/avatar', requireAuth, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });
    res.status(200).json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

export default router;
