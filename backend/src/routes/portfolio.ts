import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import multer from 'multer';

// Dummy Cloudinary simulation for MVC
const upload = multer({ dest: 'uploads/' });

const router = Router();
const prisma = new PrismaClient();

// Add new portfolio item (evidence)
router.post('/', requireAuth, upload.single('media'), async (req: AuthRequest, res: Response) => {
  const { title, description, mediaType } = req.body;
  const userId = req.user?.id;
  const file = req.file;

  if (!userId || !title) {
    return res.status(400).json({ error: 'User ID and title required' });
  }

  try {
    const mediaUrl = file 
      ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800';

    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        userId,
        title,
        description: description || '',
        mediaUrl,
        mediaType: mediaType || 'image',
        status: 'Pending'
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
