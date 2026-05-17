import { Router, Request, Response } from 'express';

const router = Router();

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
    // Construct Supabase query
    // Supabase REST API uses PostgREST syntax
    let queryParams = new URLSearchParams();
    queryParams.append('select', '*');
    queryParams.append('order', 'created_at.desc');

    if (search) {
      // Search ONLY in title because author column doesn't exist in documents table
      queryParams.append('title', `ilike.*${search}*`);
    }
    if (subject) {
      queryParams.append('subject', `ilike.${subject}`);
    }
    if (grade) {
      queryParams.append('grade', `eq.${grade}`);
    }

    if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
      console.warn('[Supabase] SUPABASE_URL is missing or invalid. Returning empty list.');
      return res.json([]);
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/documents?${queryParams.toString()}`, {
      headers: getSupabaseHeaders()
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[Supabase] Fetch failed:', err);
      return res.json([]); // Fallback to empty array instead of failing
    }

    const data = await response.json();
    
    // Map Supabase fields to frontend format
    const books = data.map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author || 'TVET Mastery', // Default if author is missing
      coverUrl: b.cover_url || b.coverUrl || null,
      pdfUrl: b.file_url || b.pdf_url || b.pdfUrl, // Use file_url from documents table
      description: b.description || '',
      subject: b.subject || 'General',
      grade: b.grade || '',
      uploadedBy: b.uploaded_by || b.uploadedBy || 'System',
      createdAt: b.created_at || b.createdAt,
      updatedAt: b.updated_at || b.updatedAt || b.created_at
    }));

    res.json(books);
  } catch (error) {
    console.error('[Books GET]', error);
    // Gracefully fallback to empty array so the UI doesn't break
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
      title: b.title,
      author: b.author,
      coverUrl: b.coverUrl || b.cover_url,
      pdfUrl: b.pdfUrl || b.pdf_url,
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
