import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { C, Card, SectionTitle, Btn, Modal } from '../components/ui';
import { ReadingHeatmap } from '../components/SessionTracker';

function fmtDate(s: string) {
  if (!s) return '';
  const [y,m,d] = s.split('-');
  return `${parseInt(d)} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][parseInt(m)-1]} ${y}`;
}

// ── Quick add session modal ───────────────────────────────────
function AddSessionModal({ open, onClose, books }: { open: boolean; onClose: () => void; books: any[] }) {
  const addSession = useStore((s: any) => s.addSession);
  const [bookId, setBookId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [pages, setPages] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const readingBooks = books.filter(b => b.status === 'reading' || b.status === 'finished');

  async function handleSave() {
    if (!bookId || !pages || !date) return;
    setSaving(true);
    try {
      await addSession({ bookId, date, pages: Number(pages), notes });
      setBookId(''); setPages(''); setNotes('');
      onClose();
    } finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
    background: C.bgSurface, border: `1px solid ${C.border}`,
    color: C.ink1, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <Modal open={open} onClose={onClose} title="Registrar sesión de lectura" width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>LIBRO *</label>
          <select value={bookId} onChange={e => setBookId(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}>
            <option value="">Seleccionar libro...</option>
            {readingBooks.sort((a,b) => a.title.localeCompare(b.title)).map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>FECHA *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>PÁGINAS *</label>
            <input type="number" min={1} value={pages} onChange={e => setPages(e.target.value)}
              placeholder="ej: 45" style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>NOTA (opcional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Reflexión, capítulo, avance..." style={inputStyle}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={handleSave} disabled={!bookId || !pages || !date || saving}>
            {saving ? 'Guardando…' : 'Registrar sesión'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function SessionsPage() {
  const sessions    = useStore((s: any) => s.sessions || []);
  const deleteSession = useStore((s: any) => s.deleteSession);
  const books       = useStore(s => s.books);
  const navigate    = useNavigate();

  const [showAdd, setShowAdd] = useState(false);
  const [filterBook, setFilterBook] = useState('all');
  const [sortBy, setSortBy] = useState<'date'|'pages'>('date');

  const bookMap = useMemo(() => Object.fromEntries(books.map(b => [b.id, b])), [books]);

  const booksWithSessions = useMemo(() =>
    [...new Set(sessions.map((s: any) => s.bookId))]
      .map((id: string) => bookMap[id])
      .filter(Boolean)
      .sort((a: any, b: any) => a.title.localeCompare(b.title)),
  [sessions, bookMap]);

  const filtered = useMemo(() => {
    let r = [...sessions];
    if (filterBook !== 'all') r = r.filter((s: any) => s.bookId === filterBook);
    r.sort((a: any, b: any) => {
      if (sortBy === 'pages') return b.pages - a.pages;
      return b.date.localeCompare(a.date);
    });
    return r;
  }, [sessions, filterBook, sortBy]);

  // Stats
  const totalPages = sessions.reduce((a: number, s: any) => a + (s.pages || 0), 0);
  const avgPages   = sessions.length ? Math.round(totalPages / sessions.length) : 0;
  const bestSession = sessions.length ? [...sessions].sort((a: any, b: any) => b.pages - a.pages)[0] : null;

  // Sessions by month for mini chart
  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s: any) => {
      const key = s.date?.slice(0, 7);
      if (key) map[key] = (map[key] || 0) + (s.pages || 0);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  }, [sessions]);

  const maxMonthPages = Math.max(...byMonth.map(([,v]) => v), 1);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 28px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}><span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>LECTURA ACTIVA</p>
          <h1 style={{ fontFamily: C.fontSans, fontSize: 30, fontWeight:700, color: C.ink1, position:'relative', display:'inline-block', marginBottom:16 }}>
            Sesiones
            <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                           background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
          </h1>
          <p style={{ color: C.ink3, fontSize: 13, marginTop: 4 }}>
            {sessions.length} sesiones · {totalPages.toLocaleString('es')} páginas registradas
          </p>
        </div>
        <Btn onClick={() => setShowAdd(true)}>+ Registrar sesión</Btn>
      </div>

      {/* Summary stats */}
      <div className="rx-sessions-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Sesiones', value: sessions.length, color: C.accent },
          { label: 'Páginas totales', value: totalPages.toLocaleString('es'), color: C.success },
          { label: 'Promedio/sesión', value: `${avgPages} pág.`, color: C.info },
          { label: 'Mejor sesión', value: bestSession ? `${bestSession.pages} pág.` : '—', color: C.xp },
        ].map(s => (
          <Card key={s.label}>
            <p style={{ fontSize: 10, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight:600, color: s.color, fontFamily:C.fontMono }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {sessions.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>📖</p>
            <p style={{ fontSize: 16, color: C.ink2, marginBottom: 8 }}>Todavía no hay sesiones registradas</p>
            <p style={{ fontSize: 13, color: C.ink4, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
              Registrá tus sesiones de lectura para ver tu actividad diaria y estadísticas de progreso. Las sesiones futuras aparecerán aquí y en el heatmap del Dashboard.
            </p>
            <Btn onClick={() => setShowAdd(true)}>+ Registrar primera sesión</Btn>
          </div>
        </Card>
      ) : (
        <>
          {/* Heatmap */}
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle>Actividad lectora — últimos 12 meses</SectionTitle>
            <ReadingHeatmap sessions={sessions}/>
          </Card>

          {/* Monthly bar chart */}
          {byMonth.length > 1 && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Páginas por mes</SectionTitle>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
                {byMonth.map(([month, pages]) => {
                  const [y, m] = month.split('-');
                  const label = `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(m)-1]} ${y.slice(2)}`;
                  const h = Math.max(4, (pages / maxMonthPages) * 64);
                  return (
                    <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <p style={{ fontSize: 9, color: C.ink4, fontFamily:C.fontMono }}>{pages}</p>
                      <div style={{ width: '100%', height: h, borderRadius: 4, background: C.accent, opacity: 0.7, transition: 'height 0.3s' }}/>
                      <p style={{ fontSize: 8, color: C.ink4, textAlign: 'center', lineHeight: 1.2 }}>{label}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={filterBook} onChange={e => setFilterBook(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, background: C.bgCard, border: `1px solid ${C.border}`, color: C.ink2, outline: 'none', cursor: 'pointer', flex: '1 1 200px' }}>
              <option value="all">Todos los libros</option>
              {booksWithSessions.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 2, background: C.bgSurface, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
              {([['date','Por fecha'],['pages','Por páginas']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setSortBy(v)}
                  style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, background: sortBy===v ? C.accent : 'transparent', color: sortBy===v ? C.onAccent : C.ink3, transition: 'all 0.15s' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions list */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filtered.map((s: any, i: number) => {
                const book = bookMap[s.bookId];
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 4px',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {/* Date */}
                    <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: C.ink3, fontFamily:C.fontMono }}>{fmtDate(s.date)}</p>
                    </div>
                    {/* Pages dot */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: `color-mix(in srgb, ${C.accent} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${C.accent} 19%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily:C.fontMono, lineHeight: 1 }}>{s.pages}</p>
                    </div>
                    {/* Book + note */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {book ? (
                        <button onClick={() => navigate(`/books/${book.id}`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: C.ink1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                            onMouseLeave={e => (e.currentTarget.style.color = C.ink1)}>
                            {book.title}
                          </p>
                        </button>
                      ) : (
                        <p style={{ fontSize: 12, color: C.ink4, fontStyle: 'italic' }}>Libro eliminado</p>
                      )}
                      {s.notes && <p style={{ fontSize: 11, color: C.ink3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes}</p>}
                    </div>
                    {/* Delete */}
                    <button onClick={() => { if(confirm('¿Eliminar sesión?')) deleteSession(s.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 16, flexShrink: 0, opacity: 0.5, padding: '0 4px' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>×</button>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      <AddSessionModal open={showAdd} onClose={() => setShowAdd(false)} books={books}/>
    </div>
  );
}
