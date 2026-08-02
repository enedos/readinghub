import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { usePersistedState } from '../lib/usePersistedState';
import { C, Modal, Btn } from '../components/ui';
import { CATEGORY_COLORS } from '../lib/colors';

interface Quote {
  text: string; page: string; bookId: string;
  bookTitle: string; bookAuthor: string; tags: string[];
}

function parseQuotes(raw: string, book: any): Quote[] {
  const lines = raw.split('\n');
  const blocks: Quote[] = [];
  let cur = { text: '', page: '' };
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('> "') || t.startsWith("> '")) {
      cur.text = t.replace(/^> ["']/, '').replace(/["']$/, '');
    } else if (t.startsWith('> —')) {
      cur.page = t.replace('> —', '').trim();
      if (cur.text) {
        blocks.push({ text:cur.text, page:cur.page, bookId:book.id, bookTitle:book.title, bookAuthor:book.author, tags:book.tags });
        cur = { text:'', page:'' };
      }
    } else if (t.startsWith('>') && t.length > 1) {
      const txt = t.replace(/^> /,'').replace(/^["']/,'').replace(/["']$/,'');
      if (txt) cur.text = txt;
    }
  }
  if (cur.text) blocks.push({ text:cur.text, page:cur.page, bookId:book.id, bookTitle:book.title, bookAuthor:book.author, tags:book.tags });
  return blocks;
}

// Color per book for card backgrounds
const CARD_GRADIENTS = [
  'linear-gradient(135deg,#1a1035,#0d0d1a)',
  'linear-gradient(135deg,#0f1f1a,#0d1510)',
  'linear-gradient(135deg,#1a0f0f,#120808)',
  'linear-gradient(135deg,#0f1a2e,#091018)',
  'linear-gradient(135deg,#1a150a,#110d05)',
  'linear-gradient(135deg,#150f1a,#0d0810)',
  'linear-gradient(135deg,#0f1a1a,#081010)',
];
const CARD_ACCENTS = CATEGORY_COLORS;
function bookColorIdx(title: string) {
  return Math.abs([...title].reduce((a,c)=>a+c.charCodeAt(0),0)) % CARD_GRADIENTS.length;
}


// ── Add Quote Modal ───────────────────────────────────────────
function AddQuoteModal({ open, onClose, books }: { open: boolean; onClose: () => void; books: any[] }) {
  const updateBook = useStore(s => s.updateBook);
  const [bookId, setBookId] = useState('');
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [saving, setSaving] = useState(false);

  const booksWithQuoteSupport = [...books].sort((a,b) => a.title.localeCompare(b.title));

  async function handleSave() {
    if (!bookId || !text.trim()) return;
    setSaving(true);
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;
      const newQuoteBlock = `> "${text.trim()}"${page.trim() ? `\n> — ${page.trim()}` : ''}`;
      const existing = book.quotes ? book.quotes.trim() : '';
      const updated = existing ? `${existing}\n\n${newQuoteBlock}` : newQuoteBlock;
      await updateBook(bookId, { quotes: updated });
      setText(''); setPage(''); setBookId('');
      onClose();
    } finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
    background: C.bgSurface, border: `1px solid ${C.border}`,
    color: C.ink1, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar cita" width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>LIBRO *</label>
          <select value={bookId} onChange={e => setBookId(e.target.value)}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}>
            <option value="">Seleccionar libro...</option>
            {booksWithQuoteSupport.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>TEXTO DE LA CITA *</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
            placeholder="Escribí la cita exacta aquí..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: C.fontSerif, fontStyle: 'italic' }}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>REFERENCIA (opcional)</label>
          <input value={page} onChange={e => setPage(e.target.value)}
            placeholder="p. 47, Capítulo 3, Parte II..."
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}/>
        </div>
        {text.trim() && (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: `linear-gradient(135deg,rgba(139,92,246,0.06),transparent)`, border: `1px solid color-mix(in srgb, ${C.accent} 13%, transparent)` }}>
            <p style={{ fontFamily: C.fontSerif, fontSize: 14, color: C.ink1, fontStyle: 'italic', lineHeight: 1.6 }}>"{text.trim()}"</p>
            {page && <p style={{ fontSize: 11, color: C.accent, marginTop: 8, fontFamily:C.fontMono }}>— {page}</p>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={handleSave} disabled={!bookId || !text.trim() || saving}>
            {saving ? 'Guardando…' : '+ Agregar cita'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function QuotesPage() {
  const books    = useStore(s => s.books);
  const navigate = useNavigate();
  const [search,     setSearch]     = useState('');
  const [filterBook, setFilterBook] = useState('all');
  const [filterAuthor, setFilterAuthor] = useState('all');
  const [view,       setView]       = usePersistedState<'list'|'cards'>('quotes-view', 'list');
  const [showAdd,    setShowAdd]    = useState(false);

  const allQuotes = useMemo(() => books.flatMap(b => parseQuotes(b.quotes||'', b)), [books]);
  const allAuthors = useMemo(() => {
    return [...new Set(books.filter(b=>b.quotes&&b.quotes.trim()).map(b => {
      const a = b.author.includes(',') ? b.author.split(',').reverse().join(' ').trim() : b.author;
      return a;
    }))].sort();
  }, [books]);
  const booksWithQuotes = useMemo(() => books.filter(b=>b.quotes&&b.quotes.trim()), [books]);

  const filtered = useMemo(() => {
    let r = allQuotes;
    if (filterBook!=='all') r = r.filter(q=>q.bookId===filterBook);
    if (filterAuthor !=='all') { r = r.filter(q => { const a = q.bookAuthor.includes(',') ? q.bookAuthor.split(',').reverse().join(' ').trim() : q.bookAuthor; return a === filterAuthor; }); }
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(q2=>q2.text.toLowerCase().includes(q)||q2.bookTitle.toLowerCase().includes(q));
    }
    return r;
  }, [allQuotes, filterBook, filterAuthor, search]);

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 28px' }}>

      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}><span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>EXPLORAR</p>
          <h1 style={{ fontFamily:C.fontSans, fontSize:30, fontWeight:700, color:C.ink1, position:'relative', display:'inline-block', marginBottom:16 }}>
            Citas
            <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                           background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
          </h1>
          <p style={{ color:C.ink3, fontSize:13, marginTop:4 }}>{allQuotes.length} citas de {booksWithQuotes.length} libros</p>
        </div>
        <Btn onClick={() => setShowAdd(true)}>+ Agregar cita</Btn>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24, alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1 1 180px', minWidth:160 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.ink3, fontSize:13 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar en citas..."
            autoComplete="off"
            autoCorrect="off" spellCheck="false"
            style={{ width:'100%', padding:'8px 12px 8px 36px', borderRadius:10, fontSize:13,
                     background:C.bgCard, border:`1px solid ${C.border}`, color:C.ink1, outline:'none' }}/>
        </div>
        <select value={filterBook} onChange={e=>setFilterBook(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:8, fontSize:12, background:C.bgCard, border:`1px solid ${C.border}`, color:C.ink2, outline:'none', cursor:'pointer' }}>
          <option value="all">Todos los libros</option>
          {booksWithQuotes.map(b=><option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        <select value={filterAuthor} onChange={e=>setFilterAuthor(e.target.value)}
          style={{ padding:'7px 12px', borderRadius:8, fontSize:12, background:C.bgCard, border:`1px solid ${C.border}`, color:C.ink2, outline:'none', cursor:'pointer' }}>
          <option value="all">Todos los autores</option>
          {allAuthors.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        {/* View toggle */}
        <div style={{ display:'flex', gap:2, padding:3, background:C.bgSurface, borderRadius:8, border:`1px solid ${C.border}` }}>
          {[
            { v:'list' as const,  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg> },
            { v:'cards' as const, icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
          ].map(({v,icon})=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ width:30, height:30, borderRadius:6, border:'none', cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background:view===v?C.bgHover:'transparent',
                        color:view===v?C.ink1:C.ink4, transition:'all 0.2s' }}>
              <span style={{ width:16, height:16, display:'block' }}>{icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length===0 && (
        <div style={{ textAlign:'center', padding:60, color:C.ink3 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>💬</div>
          <p style={{ fontSize:15, color:C.ink2 }}>{allQuotes.length===0?'Agregá citas en tus libros':'Sin resultados'}</p>
        </div>
      )}

      {/* List view */}
      {filtered.length>0 && view==='list' && (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {filtered.map((q,i)=>{
            const author = q.bookAuthor.includes(',')?q.bookAuthor.split(',').reverse().join(' ').trim():q.bookAuthor;
            return (
              <article key={i} className="fade-in" style={{ borderLeft:`2px solid ${C.accent}`, paddingLeft:24 }}>
                <p style={{ fontFamily:C.fontSerif, fontSize:18, color:C.ink1, fontStyle:'italic', lineHeight:1.7 }}>
                  "{q.text}"
                </p>
                {q.page && <p style={{ fontSize:12, color:C.ink4, marginTop:8 }}>— {q.page}</p>}
                <button onClick={()=>navigate(`/books/${q.bookId}`)}
                  style={{ background:'none', border:'none', cursor:'pointer', marginTop:10,
                            display:'flex', alignItems:'center', gap:6, padding:0 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:C.ink2 }}>{q.bookTitle}</span>
                  <span style={{ fontSize:11, color:C.ink4 }}>· {author}</span>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Card view */}
      {filtered.length>0 && view==='cards' && (
        <div className="rx-quote-cards" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {filtered.map((q,i)=>{
            const idx = bookColorIdx(q.bookTitle);
            const author = q.bookAuthor.includes(',')?q.bookAuthor.split(',').reverse().join(' ').trim():q.bookAuthor;
            return (
              <div key={i} className="fade-in"
                style={{
                  padding:'24px 20px', borderRadius:16,
                  background:CARD_GRADIENTS[idx],
                  border:`1px solid ${CARD_ACCENTS[idx]}30`,
                  display:'flex', flexDirection:'column', gap:16,
                  minHeight:160, position:'relative', overflow:'hidden',
                }}>
                {/* Decorative quote mark */}
                <span style={{ position:'absolute', top:12, right:16, fontSize:64,
                                color:CARD_ACCENTS[idx], opacity:0.08, fontFamily:'serif', lineHeight:1 }}>
                  "
                </span>
                <p style={{ fontFamily:C.fontSerif, fontSize:15, color:'rgba(255,255,255,0.88)',
                             fontStyle:'italic', lineHeight:1.65, flex:1, position:'relative' }}>
                  "{q.text}"
                </p>
                {q.page && (
                  <p style={{ fontSize:11, color:CARD_ACCENTS[idx], opacity:0.7 }}>— {q.page}</p>
                )}
                <button onClick={()=>navigate(`/books/${q.bookId}`)}
                  style={{ background:'none', border:`1px solid ${CARD_ACCENTS[idx]}40`, cursor:'pointer',
                            padding:'6px 12px', borderRadius:8, textAlign:'left', display:'flex',
                            flexDirection:'column', gap:2, transition:'all 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=CARD_ACCENTS[idx])}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor=`${CARD_ACCENTS[idx]}40`)}>
                  <span style={{ fontSize:12, fontWeight:600, color:CARD_ACCENTS[idx] }}>{q.bookTitle}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>{author}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop:28, fontSize:11, color:C.ink4, fontFamily:C.fontMono }}>
        {filtered.length} {filtered.length===1?'cita':'citas'}
        {filtered.length!==allQuotes.length?` de ${allQuotes.length} total`:''}
      </p>
      <AddQuoteModal open={showAdd} onClose={() => setShowAdd(false)} books={books}/>
    </div>
  );
}
