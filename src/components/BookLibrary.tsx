import { useState, useEffect, useCallback } from 'react';
import { Book } from '../types';
import { api } from '../lib/api';
import { Lock, Unlock, X } from 'lucide-react';

// ─── Fallback cover when no coverUrl ─────────────────────────────────────────
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80';

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="book-card book-card--skeleton">
      <div className="book-cover skeleton-box" />
      <div className="book-info">
        <div className="skeleton-box" style={{ height: 18, width: '70%', borderRadius: 6 }} />
        <div className="skeleton-box" style={{ height: 13, width: '50%', borderRadius: 6, marginTop: 8 }} />
        <div className="skeleton-box" style={{ height: 13, width: '40%', borderRadius: 6, marginTop: 6 }} />
      </div>
    </div>
  );
}

// ─── PDF Viewer modal ─────────────────────────────────────────────────────────
function PdfViewer({ book, onClose }: { book: Book; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Reading: ${book.title}`}>
      <div className="bg-white dark:bg-[#050505] w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div className="flex flex-col">
            <span className="font-bold text-lg text-zinc-900 dark:text-white">{book.title}</span>
            <span className="text-xs text-zinc-500">by {book.author}</span>
          </div>
          <button 
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20" 
            onClick={onClose} 
            aria-label="Close reader"
          >
            <X className="w-4 h-4" /> Close Book
          </button>
        </div>
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-950">
          <iframe
            src={`${book.pdfUrl}#toolbar=1&navpanes=1`}
            title={book.title}
            className="w-full h-full border-none"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookLibrary() {
  const [books, setBooks]         = useState<Book[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [query, setQuery]         = useState('');
  const [openBook, setOpenBook]   = useState<Book | null>(null);

  const fetchBooks = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBooks(searchTerm ? { search: searchTerm } : undefined);
      setBooks(data);
    } catch (err: any) {
      setError(err.message || 'Could not load books. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchBooks(''); }, [fetchBooks]);

  // Search with debounce
  useEffect(() => {
    const t = setTimeout(() => fetchBooks(query), 350);
    return () => clearTimeout(t);
  }, [query, fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <section className="book-library">
      {/* Header */}
      <div className="book-library__header">
        <div>
          <h1 className="book-library__title">📚 Book Library</h1>
          <p className="book-library__sub">Explore our collection of TVET resources</p>
        </div>
        <button
          className="book-library__refresh"
          onClick={() => fetchBooks(query)}
          disabled={loading}
          aria-label="Refresh books"
        >
          <span className={loading ? 'spin' : ''}>↻</span> Refresh
        </button>
      </div>

      {/* Search bar */}
      <form className="book-search" onSubmit={handleSearch} role="search">
        <div className="book-search__wrap">
          <span className="book-search__icon">🔍</span>
          <input
            id="book-search-input"
            className="book-search__input"
            type="search"
            placeholder="Search by title or author…"
            value={search}
            onChange={e => { setSearch(e.target.value); setQuery(e.target.value); }}
            aria-label="Search books"
          />
          {search && (
            <button type="button" className="book-search__clear" onClick={() => { setSearch(''); setQuery(''); }}>✕</button>
          )}
        </div>
      </form>

      {/* States */}
      {loading && (
        <div className="book-grid">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && error && (
        <div className="book-state book-state--error">
          <span className="book-state__icon">⚠️</span>
          <p className="book-state__msg">{error}</p>
          <button className="book-state__btn" onClick={() => fetchBooks(query)}>Try Again</button>
        </div>
      )}

      {!loading && !error && books.length === 0 && (
        <div className="book-state book-state--empty">
          <span className="book-state__icon">📭</span>
          <p className="book-state__msg">
            {query ? `No books match "${query}"` : 'No books yet. Upload books from the upload app and they will appear here.'}
          </p>
          {query && <button className="book-state__btn" onClick={() => { setSearch(''); setQuery(''); }}>Clear Search</button>}
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        <>
          <p className="book-library__count">{books.length} book{books.length !== 1 ? 's' : ''}</p>
          <div className="book-grid">
            {books.map(book => (
                <button
                  key={book.id}
                  className="book-card relative overflow-hidden transition-all hover:translate-y-[-4px]"
                  onClick={() => setOpenBook(book)}
                  aria-label={`Open ${book.title}`}
                >
                  <div className="book-cover-wrap relative">
                    <img
                      src={book.coverUrl || FALLBACK_COVER}
                      alt={`Cover of ${book.title}`}
                      className="book-cover"
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_COVER; }}
                    />
                    
                    <div className="book-cover-overlay">
                      <span className="book-read-btn">Read</span>
                    </div>

                    {book.subject && <span className="book-badge z-10">{book.subject}</span>}
                  </div>
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">by {book.author}</p>
                    {book.grade && <p className="book-grade">{book.grade}</p>}
                  </div>
                </button>
              ))}
          </div>
        </>
      )}

      {/* PDF Viewer */}
      {openBook && <PdfViewer book={openBook} onClose={() => setOpenBook(null)} />}
    </section>
  );
}
