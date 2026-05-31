import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const getSupabaseHeaders = () => ({
  'apikey': SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
});

// ─── GET /api/books ────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  const { search, subject, grade } = req.query as Record<string, string>;

  try {
    // 1. Try Supabase first if configured
    if (SUPABASE_URL && SUPABASE_URL.startsWith('http')) {
      let queryParams = new URLSearchParams();
      queryParams.append('select', '*');
      queryParams.append('order', 'created_at.desc');

      if (search) {
        queryParams.append('title', `ilike.*${search}*`);
      }
      // Only append subject/grade if they are explicitly requested and NOT empty
      if (subject && subject !== 'undefined') {
        queryParams.append('subject', `ilike.${subject}`);
      }
      if (grade && grade !== 'undefined') {
        queryParams.append('grade', `eq.${grade}`);
      }

      // Fetch from 'documents' table
      const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?${queryParams.toString()}`, {
        headers: getSupabaseHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const books = data.map((b: any) => ({
            id: b.id,
            title: b.title || 'Untitled Book',
            author: b.author || 'TVET Mastery',
            coverUrl: b.cover_url || b.coverUrl || null,
            pdfUrl: b.file_url || b.pdf_url || b.pdfUrl,
            description: b.description || '',
            subject: b.subject || 'General',
            grade: b.grade || '',
            uploadedBy: b.uploaded_by || 'System',
            createdAt: b.created_at || b.createdAt,
            updatedAt: b.updated_at || b.updatedAt || b.created_at
          }));
          return res.json(books);
        }
        console.warn('[Supabase] No books found in table, trying Prisma.');
      } else {
        console.warn('[Supabase] Fetch failed with status:', response.status, 'trying Prisma.');
      }
    }

    // 2. Fallback to Prisma (local/hosted Postgres)
    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (subject) {
      where.subject = { equals: subject, mode: 'insensitive' };
    }
    if (grade) {
      where.grade = grade;
    }

    const prismaBooks = await prisma.book.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(prismaBooks);
  } catch (error) {
    console.error('[Books GET]', error);
    res.json([]);
  }
});

// ─── GET /api/books/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!SUPABASE_URL) {
      return res.status(503).json({ error: 'Supabase is not configured' });
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${id}&select=*`, {
      headers: getSupabaseHeaders()
    });
    
    const data = await response.json();
    if (!data || data.length === 0) return res.status(404).json({ error: 'Book not found' });
    
    const b = data[0];
    res.json({
      id: b.id || b._id,
      title: b.title || b.book_title || 'Untitled',
      author: b.author || b.uploaded_by || 'TVET Mastery',
      coverUrl: b.coverUrl || b.cover_url || b.thumbnail,
      pdfUrl: b.pdfUrl || b.pdf_url || b.file_url || b.url,
      description: b.description,
      subject: b.subject,
      grade: b.grade,
      uploadedBy: b.uploadedBy || b.uploaded_by,
      createdAt: b.createdAt || b.created_at,
      updatedAt: b.updatedAt || b.updated_at
    });
  } catch (error) {
    console.error('[Books GET/:id]', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// ─── POST /api/books ───────────────────────────────────────────────────────────
// Used by the uploader app to push books into this database
router.post('/', async (req: Request, res: Response) => {
  const { title, author, coverUrl, pdfUrl, description, subject, grade, uploadedBy } = req.body;

  if (!title || !author || !pdfUrl) {
    return res.status(400).json({ error: 'title, author and pdfUrl are required' });
  }

  try {
    if (!SUPABASE_URL) {
      return res.status(503).json({ error: 'Supabase is not configured' });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        title,
        author,
        cover_url: coverUrl,
        pdf_url: pdfUrl,
        description,
        subject,
        grade,
        uploaded_by: uploadedBy
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Supabase post failed');
    }

    const data = await response.json();
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('[Books POST]', error);
    res.status(500).json({ error: 'Failed to create book in Supabase' });
  }
});

// ─── DELETE /api/books/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!SUPABASE_URL) {
      return res.status(503).json({ error: 'Supabase is not configured' });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${id}`, {
      method: 'DELETE',
      headers: getSupabaseHeaders()
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Supabase delete failed');
    }

    res.json({ message: 'Book deleted from Supabase' });
  } catch (error) {
    console.error('[Books DELETE]', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;
