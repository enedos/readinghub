import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { C } from './ui';

// ── Quote parser (same logic as Quotes page) ─────────────────
function parseQuotes(raw: string, book: any) {
  if (!raw) return [];
  const lines = raw.split('\n');
  const blocks: { text: string; page: string; bookId: string; bookTitle: string }[] = [];
  let cur = { text: '', page: '' };
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('> "') || t.startsWith("> '")) {
      cur.text = t.replace(/^> ["']/, '').replace(/["']$/, '');
    } else if (t.startsWith('> —')) {
      cur.page = t.replace('> —', '').trim();
      if (cur.text) { blocks.push({ ...cur, bookId: book.id, bookTitle: book.title }); cur = { text: '', page: '' }; }
    } else if (t.startsWith('>') && t.length > 1) {
      const txt = t.replace(/^> /, '').replace(/^["']/, '').replace(/["']$/, '');
      if (txt) cur.text = txt;
    }
  }
  if (cur.text) blocks.push({ ...cur, bookId: book.id, bookTitle: book.title });
  return blocks;
}

// ── Result types ──────────────────────────────────────────────
type ResultKind = 'book' | 'quote' | 'note' | 'document';
interface Result {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  matchText?: string;
}

const KIND_LABEL: Record<ResultKind, string> = {
  book:     'Libro',
  quote:    'Cita',
  note:     'Nota',
  document: 'Documento',
};
const KIND_COLOR: Record<ResultKind, string> = {
  book:     '#8B5CF6',
  quote:    '#FFB84D',
  note:     '#22C55E',
  document: '#14B8A6',
};

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: `color-mix(in srgb, ${C.accent} 19%, transparent)`, color: C.accent, borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ── Main component ────────────────────────────────────────────
export function CommandPalette() {
  const books     = useStore(s => s.books);
  const documents = useStore(s => s.documents);
  const navigate  = useNavigate();
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const [sel,   setSel]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut — Ctrl+K / Cmd+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build results
  const results = useMemo((): Result[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Result[] = [];

    // Books — match title, author, tags, notes
    books.forEach(b => {
      const searchable = `${b.title} ${b.author} ${b.tags.join(' ')} ${b.notes}`.toLowerCase();
      if (!searchable.includes(q)) return;
      out.push({
        id: `book-${b.id}`, kind: 'book',
        title: b.title,
        subtitle: b.author.includes(',') ? b.author.split(',').reverse().join(' ').trim() : b.author,
        icon: b.format === 'audio' ? '🎧' : b.format === 'digital' ? '📱' : '📖',
        href: `/books/${b.id}`,
      });
    });

    // Quotes — match quote text
    books.forEach(b => {
      parseQuotes(b.quotes || '', b).forEach((qt, i) => {
        if (!qt.text.toLowerCase().includes(q)) return;
        out.push({
          id: `quote-${b.id}-${i}`, kind: 'quote',
          title: `"${qt.text.slice(0, 80)}${qt.text.length > 80 ? '…' : ''}"`,
          subtitle: b.title,
          icon: '💬',
          href: `/books/${b.id}`,
          matchText: qt.text,
        });
      });
    });

    // Notes — match book notes field
    books.forEach(b => {
      if (!b.notes?.toLowerCase().includes(q)) return;
      // Avoid duplicate if already matched as book
      if (out.find(r => r.id === `book-${b.id}`)) return;
      const idx = b.notes.toLowerCase().indexOf(q);
      const snippet = b.notes.slice(Math.max(0, idx - 20), idx + 60);
      out.push({
        id: `note-${b.id}`, kind: 'note',
        title: b.title,
        subtitle: `…${snippet}…`,
        icon: '📝',
        href: `/books/${b.id}`,
      });
    });

    // Documents
    documents.forEach((d: any) => {
      const searchable = `${d.title} ${d.content}`.toLowerCase();
      if (!searchable.includes(q)) return;
      out.push({
        id: `doc-${d.id}`, kind: 'document',
        title: d.title,
        subtitle: d.content?.slice(0, 80) || '',
        icon: '📄',
        href: '/documents',
      });
    });

    return out.slice(0, 12);
  }, [query, books, documents]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[sel]) {
        navigate(results[sel].href);
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, sel, navigate]);

  useEffect(() => { setSel(0); }, [results]);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      title="Búsqueda global (Ctrl+K)"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderRadius: 10,
        background: C.bgCard, border: `1px solid ${C.border}`,
        cursor: 'pointer', color: C.ink3, fontSize: 12,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.accent; el.style.color = C.ink2; el.style.boxShadow = '0 0 12px rgba(139,92,246,0.22)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.color = C.ink3; el.style.boxShadow = 'none'; }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <span>Buscar</span>
      <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: C.bgSurface, border: `1px solid ${C.border}`, color: C.ink4, fontFamily: C.fontMono }}>
        Ctrl+K
      </kbd>
    </button>
  );

  return createPortal((
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: C.overlay, backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12vh',
    }} onClick={() => setOpen(false)}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 620,
          background: C.bgCard, borderRadius: 16,
          border: `1px solid ${C.border}`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.12)`,
          overflow: 'hidden',
          animation: 'scaleIn 0.15s ease both',
        }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar libros, citas, notas, documentos…"
            autoComplete="off"
            autoCorrect="off" spellCheck="false"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 15, color: C.ink1, fontFamily: 'inherit',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 18, lineHeight: 1 }}>
              ×
            </button>
          )}
          <kbd onClick={() => setOpen(false)}
            style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: C.bgSurface, border: `1px solid ${C.border}`, color: C.ink4, fontFamily: C.fontMono, cursor: 'pointer' }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        {query && (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: C.ink4 }}>
                <p style={{ fontSize: 14 }}>Sin resultados para <strong style={{ color: C.ink2 }}>"{query}"</strong></p>
              </div>
            ) : (
              <div>
                {results.map((r, i) => (
                  <div key={r.id}
                    onClick={() => { navigate(r.href); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '11px 18px', cursor: 'pointer',
                      background: i === sel ? 'var(--rx-accent-mid)' : 'transparent',
                      borderLeft: `2px solid ${i === sel ? C.accent : 'transparent'}`,
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={() => setSel(i)}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.ink1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {highlight(r.title, query)}
                      </p>
                      {r.subtitle && (
                        <p style={{ fontSize: 11, color: C.ink3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {highlight(r.subtitle, query)}
                        </p>
                      )}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: KIND_COLOR[r.kind], background: `${KIND_COLOR[r.kind]}15`,
                      padding: '2px 7px', borderRadius: 999, flexShrink: 0,
                    }}>
                      {KIND_LABEL[r.kind]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!query && (
          <div style={{ padding: '20px 18px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { icon: '📚', label: 'libros', count: books.length },
              { icon: '💬', label: 'citas', count: books.reduce((n, b) => n + parseQuotes(b.quotes || '', b).length, 0) },
              { icon: '📝', label: 'notas', count: books.filter(b => b.notes?.trim()).length },
              { icon: '📄', label: 'documentos', count: documents.length },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                <span style={{ fontSize: 12, color: C.ink3 }}>{s.count} {s.label}</span>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div style={{ padding: '8px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 16 }}>
            {[['↑↓', 'navegar'], ['↵', 'abrir'], ['Esc', 'cerrar']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: C.bgSurface, border: `1px solid ${C.border}`, color: C.ink4, fontFamily: C.fontMono }}>{key}</kbd>
                <span style={{ fontSize: 11, color: C.ink4 }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  ), document.body);
}
