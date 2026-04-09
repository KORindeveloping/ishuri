import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import fs from 'fs';
import { detectStudyLevel } from '../services/ai.service';

// Dummy Cloudinary simulation for MVC
const upload = multer({ dest: 'uploads/' });

const router = Router();
const prisma = new PrismaClient();

// Add new portfolio item (evidence or certificate)
router.post('/', requireAuth, upload.single('media'), async (req: AuthRequest, res: Response) => {
  const { title, description, mediaType, type } = req.body; // Added 'type' to body
  const userId = req.user?.id;
  const file = req.file;

  if (!userId || !title) {
    return res.status(400).json({ error: 'User ID and title required' });
  }

  try {
    const mediaUrl = file
      ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'; // Default placeholder image

    let aiDetectedLevel = null;
    if (type === 'certificate' && file && file.mimetype.startsWith('image/')) {
      const buffer = fs.readFileSync(file.path);
      aiDetectedLevel = await detectStudyLevel(buffer, file.mimetype);
    }

    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        userId,
        title: aiDetectedLevel ? `${title} (Detected: ${aiDetectedLevel})` : title,
        description: aiDetectedLevel ? `AI Detected Level: ${aiDetectedLevel}. ${description || ''}` : (description || ''),
        mediaUrl,
        mediaType: mediaType || 'image', // Default to image if not specified
        status: 'Pending', // Default status
        type: type || 'evidence' // Set type, default to 'evidence' if not provided
      }
    });

    res.status(201).json(portfolioItem);
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({ error: 'Failed to upload portfolio item' });
  }
});

// Fetch user portfolio
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const items = await prisma.portfolioItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

export default router;
