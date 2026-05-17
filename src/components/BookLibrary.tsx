import { useState, useEffect, useCallback } from 'react';
import { Book } from '../types';
import { api } from '../lib/api';

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
    <div className="pdf-overlay" role="dialog" aria-modal="true" aria-label={`Reading: ${book.title}`}>
      <div className="pdf-modal">
        <div className="pdf-modal__header">
          <div className="pdf-modal__title-wrap">
            <span className="pdf-modal__title">{book.title}</span>
            <span className="pdf-modal__author">by {book.author}</span>
          </div>
          <button className="pdf-modal__close" onClick={onClose} aria-label="Close reader">✕</button>
        </div>
        <div className="pdf-modal__body">
          <iframe
            src={`${book.pdfUrl}#toolbar=1&navpanes=1`}
            title={book.title}
            className="pdf-iframe"
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
          <p className="book-library__sub">Books sync automatically from the upload app</p>
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
                className="book-card"
                onClick={() => setOpenBook(book)}
                aria-label={`Open ${book.title}`}
              >
                <div className="book-cover-wrap">
                  <img
                    src={book.coverUrl || FALLBACK_COVER}
                    alt={`Cover of ${book.title}`}
                    className="book-cover"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_COVER; }}
                  />
                  <div className="book-cover-overlay">
                    <span className="book-read-btn">📖 Read</span>
                  </div>
                  {book.subject && <span className="book-badge">{book.subject}</span>}
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
