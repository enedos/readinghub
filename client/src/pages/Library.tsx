import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { bookXP } from '../lib/xp';
import { usePersistedState } from '../lib/usePersistedState';
import { C, Stars, StatusBadge, Modal, Input, Select, Textarea, Btn, ProgressBar } from '../components/ui';
import { useFixedTooltip, FixedTooltip } from '../components/Tooltip';
import { CATEGORY_COLORS, STATUS_COLORS } from '../lib/colors';
import type { Book, BookStatus, BookFormat } from '../types';

// ── Cover component ──────────────────────────────────────────
function BookCover({ book, height = '100%' }: { book: Book; height?: string }) {
  const [err, setErr] = useState(false);
  const isAudio = book.format === 'audio';
  // Audio: teal palette; regular: color per title
  const COLORS  = isAudio
    ? ['#051a1a','#071f1f','#061c1c','#081e1e','#051818','#071d1d','#061b1b']
    : ['#1a1035','#0f1f1a','#1a0f0f','#0f1a2e','#1a150a','#150f1a','#0f1a1a'];
  const ACCENTS = isAudio
    ? ['#14B8A6','#0EA5E9','#06B6D4','#14B8A6','#0EA5E9','#22D3EE','#14B8A6']
    : CATEGORY_COLORS;
  const idx = Math.abs([...book.title].reduce((a:number,v:string)=>a+v.charCodeAt(0),0)) % COLORS.length;
  const bg = COLORS[idx], ac = ACCENTS[idx];

  const lastName = book.author.includes(',') ? book.author.split(',')[0] : book.author.split(' ').pop() || '';

  if (book.cover && !err) {
    return (
      <div style={{ position:'relative', width:'100%', height }}>
        <img src={book.cover} alt={book.title} onError={()=>setErr(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        {isAudio && (
          <div style={{
            position:'absolute', top:6, left:6,
            background:'rgba(20,184,166,0.85)', borderRadius:6,
            padding:'2px 6px', display:'flex', alignItems:'center', gap:3,
            backdropFilter:'blur(4px)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
            </svg>
            <span style={{ fontSize:9, color:'white', fontWeight:600, letterSpacing:'0.04em' }}>AUDIO</span>
          </div>
        )}
      </div>
    );
  }

  // SVG placeholder — different layout for audio
  if (isAudio) {
    const durH = Math.floor((book.pages||0)/60);
    const durM = (book.pages||0) % 60;
    const durStr = durH > 0 ? `${durH}h ${durM}m` : `${durM}m`;
    return (
      <svg viewBox="0 0 200 300" style={{ width:'100%', height, display:'block' }}>
        <rect width="200" height="300" fill={bg}/>
        {/* Waveform decoration */}
        {[20,30,48,36,52,28,44,32,50,38].map((h,i) => (
          <rect key={i} x={22+i*16} y={150-h/2} width="8" height={h} rx="4" fill={ac} opacity="0.5"/>
        ))}
        {/* Headphone icon centered */}
        <text x="100" y="115" textAnchor="middle" fontSize="40" fill={ac} opacity="0.6">🎧</text>
        {/* Title */}
        {book.title.split(' ').slice(0,4).map((word,i) => (
          <text key={i} x="100" y={200+i*18} textAnchor="middle" fill="rgba(255,255,255,0.85)"
            fontFamily="Georgia,serif" fontSize="13">{word}</text>
        ))}
        {/* Duration */}
        {durStr !== '0m' && (
          <text x="100" y="285" textAnchor="middle" fill={ac}
            fontFamily="monospace" fontSize="10" opacity="0.8">{durStr}</text>
        )}
        <rect x="20" y="30" width="160" height="0.5" fill={ac} opacity="0.3"/>
        <rect x="20" y="268" width="160" height="0.5" fill={ac} opacity="0.3"/>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 300" style={{ width:'100%', height, display:'block' }}>
      <rect width="200" height="300" fill={bg}/>
      <rect x="20" y="20" width="160" height="1" fill={ac} opacity="0.5"/>
      <rect x="20" y="30" width="3" height="80" fill={ac}/>
      {book.title.split(' ').slice(0,6).map((word,i)=>(
        <text key={i} x="30" y={52+i*20} fill="rgba(255,255,255,0.85)"
          fontFamily="Georgia,serif" fontSize="13">{word}</text>
      ))}
      <circle cx="100" cy="195" r="38" fill="none" stroke={ac} strokeWidth="0.5" opacity="0.35"/>
      <text x="100" y="203" fill={ac} fontFamily="Georgia,serif" fontSize="32"
        textAnchor="middle" opacity="0.45">{book.title[0]}</text>
      <rect x="20" y="272" width="160" height="0.5" fill={ac} opacity="0.4"/>
      <text x="20" y="287" fill={ac} fontFamily="system-ui,sans-serif"
        fontSize="8" letterSpacing="1.5" opacity="0.7">{lastName.toUpperCase()}</text>
    </svg>
  );
}


const EMPTY_BOOK = {
  title:'', author:'', year: new Date().getFullYear(), cover:'',
  tags:[] as string[], language:'es', status:'planned' as any,
  start:'', end:'', pages:0, pagesRead:0, rating:0, difficulty:3,
  recommended:false, publisher:'', isbn:'', format:'physical' as any,
  summary:'', quotes:'', characters:'', notes:'', themes:[] as string[],
  duration:0, minutesListened:0,
};

function AddBookModal({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const addBook = useStore(s => s.addBook);
  const [form, setForm] = useState(EMPTY_BOOK);
  const [tab, setTab] = useState('info');

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit() {
    if (!form.title || !form.author || !form.pages) return;
    addBook({ ...form, themes: form.tags, duration: 0, minutesListened: 0 });
    setForm(EMPTY_BOOK);
    setTab('info');
    onClose();
  }

  const tabs = [
    { id:'info',    label:'Información' },
    { id:'content', label:'Contenido'   },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Agregar libro" width={600}>
      {/* Tab switcher */}
      <div style={{ display:'flex',gap:2,borderBottom:`1px solid ${C.border}`,marginBottom:24 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'7px 16px',border:'none',cursor:'pointer',fontSize:13,
              fontWeight:tab===t.id?600:400, color:tab===t.id?C.ink1:C.ink3,
              background:'transparent',
              borderBottom:tab===t.id?`2px solid ${C.accent}`:'2px solid transparent',
              marginBottom:-1,transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display:'grid',gap:16 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Título *" value={form.title} onChange={v=>set('title',v)} placeholder="Nombre del libro" required />
            </div>
            <Input label="Autor *" value={form.author} onChange={v=>set('author',v)} placeholder="Apellido, Nombre" />
            <Input label="Año" value={form.year} onChange={v=>set('year',Number(v))} type="number" min={1000} max={2030} />
            <Input label="Páginas *" value={form.pages||''} onChange={v=>set('pages',Number(v))} type="number" min={1} />
            <Select label="Estado" value={form.status} onChange={v=>set('status',v as BookStatus)} options={[
              {value:'planned',label:'Pendiente'},{value:'reading',label:'Leyendo'},
              {value:'finished',label:'Leído'},{value:'abandoned',label:'Abandonado'},
            ]}/>
            <Select label="Formato" value={form.format} onChange={v=>set('format',v as BookFormat)} options={[
              {value:'physical',label:'Físico'},{value:'digital',label:'Digital'},{value:'audio',label:'Audio'},
            ]}/>
            <Input label="Inicio" value={form.start} onChange={v=>set('start',v)} type="date" />
            <Input label="Fin" value={form.end} onChange={v=>set('end',v)} type="date" />
            <Input label="Editorial" value={form.publisher} onChange={v=>set('publisher',v)} />
            <Input label="ISBN" value={form.isbn} onChange={v=>set('isbn',v)} />
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="URL de portada" value={form.cover} onChange={v=>set('cover',v)} placeholder="https://..." />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Tags (separados por coma)" value={form.tags.join(', ')}
                onChange={v=>set('tags', v.split(',').map(t=>t.trim()).filter(Boolean))}
                placeholder="novela, historia, ensayo" />
            </div>
          </div>
          <div>
            <span style={{ fontSize:11,fontWeight:500,color:C.ink3,letterSpacing:'0.04em' }}>Rating</span>
            <div style={{ marginTop:6 }}>
              <Stars rating={form.rating} size={20} interactive onChange={v=>set('rating',v)} />
            </div>
          </div>
          <div>
            <span style={{ fontSize:11,fontWeight:500,color:C.ink3,letterSpacing:'0.04em' }}>
              Dificultad: {form.difficulty}/5
            </span>
            <input type="range" min={1} max={5} value={form.difficulty}
              onChange={e=>set('difficulty',Number(e.target.value))}
              style={{ width:'100%',marginTop:6,accentColor:C.accent }} />
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div style={{ display:'grid',gap:16 }}>
          <Textarea label="Resumen" value={form.summary} onChange={v=>set('summary',v)} rows={4} />
          <Textarea label="Citas" value={form.quotes} onChange={v=>set('quotes',v)} rows={4}
            placeholder={'> "La cita"\n> — Página 42'} />
          <Textarea label="Personajes" value={form.characters} onChange={v=>set('characters',v)} rows={3}
            placeholder="**Nombre** — descripción" />
          <Textarea label="Notas personales" value={form.notes} onChange={v=>set('notes',v)} rows={4} />
        </div>
      )}

      <div style={{ display:'flex',justifyContent:'flex-end',gap:8,marginTop:24,paddingTop:16,
                    borderTop:`1px solid ${C.border}` }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSubmit} disabled={!form.title||!form.author||!form.pages}>
          Agregar libro
        </Btn>
      </div>
    </Modal>
  );
}

// ── Library page ─────────────────────────────────────────────
export default function LibraryPage({ onAddBook }: { onAddBook?: () => void }) {
  const books = useStore(s => s.books);
  const importData = useStore(s => s.importData);
  const [loadingDemo, setLoadingDemo] = useState(false);
  async function loadDemo() {
    setLoadingDemo(true);
    try {
      const res = await fetch('/demo-data.json');
      const data = await res.json();
      await importData(data);
    } finally {
      setLoadingDemo(false);
    }
  }
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('all');
  const [tag,     setTag]     = useState('all');
  const [sort,    setSort]    = useState('end');
  const [format,  setFormat]  = useState('all');
  const [view,    setView]    = usePersistedState<'grid'|'list'|'shelf'>('library-view', 'grid');
  const [showFilters, setShowFilters] = useState(false);
  const { tooltipProps, showTip, hideTip } = useFixedTooltip();

  const allTags = useMemo(() =>
    [...new Set(books.flatMap(b=>b.tags))].sort(), [books]);

  const matchesSearch = (b: Book) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  };

  // Reading books get pinned above the rest — no longer sink to the
  // bottom of "Todos" for lacking an end date.
  const showPinned = status === 'all';
  const pinnedReading = showPinned
    ? books.filter(b => b.status==='reading' && matchesSearch(b) && (tag==='all'||b.tags.includes(tag)) && (format==='all'||b.format===format))
    : [];

  const filtered = useMemo(() => {
    let r = [...books];
    if (status !== 'all') r = r.filter(b=>b.status===status);
    if (tag    !== 'all') r = r.filter(b=>b.tags.includes(tag));
    if (format !== 'all') r = r.filter(b=>b.format===format);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(b=>b.title.toLowerCase().includes(q)||b.author.toLowerCase().includes(q));
    }
    return r.sort((a,b)=> {
      if (sort==='title')  return a.title.localeCompare(b.title);
      if (sort==='rating') return b.rating-a.rating;
      if (sort==='year')   return b.year-a.year;
      if (sort==='end')    return (b.end||'').localeCompare(a.end||'') || b.createdAt.localeCompare(a.createdAt);
      if (sort==='recent') return b.createdAt.localeCompare(a.createdAt);
      return 0;
    });
  }, [books, status, tag, search, sort, format]);

  // Main list excludes reading books when they're already pinned above,
  // so they don't appear twice. The shelf view groups by status itself
  // (including its own "Leyendo ahora" plank), so it keeps them inline.
  const mainList = (showPinned && view !== 'shelf') ? filtered.filter(b=>b.status!=='reading') : filtered;

  const activeFilterCount = (tag!=='all'?1:0) + (format!=='all'?1:0);
  const totalPages = books.filter(b=>b.status==='finished').reduce((a,b)=>a+(b.pages||0),0);

  const counts = {
    all:      books.length,
    finished: books.filter(b=>b.status==='finished').length,
    reading:  books.filter(b=>b.status==='reading').length,
    planned:  books.filter(b=>b.status==='planned').length,
  };

  const STATUSES = [
    {value:'all',      label:`Todos (${counts.all})`},
    {value:'finished', label:`Leídos (${counts.finished})`},
    {value:'reading',  label:`Leyendo (${counts.reading})`},
    {value:'planned',  label:`Pendientes (${counts.planned})`},
  ];

  return (
    <div style={{ maxWidth:1400,margin:'0 auto',padding:'32px 28px' }}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:6,flexWrap:'wrap',gap:12 }}>
        <div>
          <p style={{ fontSize:10,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:C.info,marginBottom:8,
                       display:'flex',alignItems:'center',gap:7 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>
            BIBLIOTECA
          </p>
          <h1 style={{ fontFamily:C.fontSans,fontSize:34,fontWeight:700,color:C.ink1,position:'relative',display:'inline-block' }}>
            Tu colección
            <span style={{ position:'absolute',left:0,bottom:-8,width:44,height:3,borderRadius:2,
                           background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
          </h1>
        </div>
        <Btn onClick={()=>onAddBook ? onAddBook() : setShowAdd(true)} style={{ display:'flex',alignItems:'center',gap:6 }}>
          + Agregar libro
        </Btn>
      </div>
      <p style={{ fontSize:13, color:C.ink3, margin:'16px 0 24px' }}>
        <b style={{ color:C.ink2, fontFamily:C.fontMono, fontWeight:600 }}>{counts.all}</b> libros ·{' '}
        <b style={{ color:C.ink2, fontFamily:C.fontMono, fontWeight:600 }}>{totalPages.toLocaleString('es')}</b> páginas leídas ·{' '}
        <b style={{ color:C.ink2, fontFamily:C.fontMono, fontWeight:600 }}>{allTags.length}</b> géneros distintos
      </p>

      {/* Filters */}
      <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:28,alignItems:'center',position:'relative' }}>
        {/* Search */}
        <div style={{ position:'relative',flex:'1 1 220px',minWidth:200 }}>
          <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C.ink3,fontSize:13 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar título o autor..."
            autoComplete="off"
            autoCorrect="off" spellCheck="false"
            style={{ width:'100%',padding:'8px 12px 8px 36px',borderRadius:10,fontSize:13,
                     background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none' }} />
        </div>

        {/* Status */}
        <div style={{ display:'flex',gap:3,flexWrap:'wrap' }}>
          {STATUSES.map(s=>(
            <button key={s.value} onClick={()=>setStatus(s.value)}
              style={{ padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:500,
                       border:'none',cursor:'pointer',transition:'all 0.2s',
                       background:status===s.value?C.accent:C.bgCard,
                       color:status===s.value?C.onAccent:C.ink2 }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Filtros — consolida tag / formato / orden */}
        <div style={{ position:'relative' }}>
          <button onClick={()=>setShowFilters(v=>!v)}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:500,
                     background:C.bgCard,border:`1px solid ${showFilters?C.accent:C.border}`,color:C.ink2,cursor:'pointer' }}>
            ⚙ Filtros
            {activeFilterCount>0 && (
              <span style={{ background:C.accent,color:C.onAccent,fontSize:10,fontWeight:700,width:16,height:16,
                             borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {showFilters && (
            <>
              <div onClick={()=>setShowFilters(false)} style={{ position:'fixed',inset:0,zIndex:40 }}/>
              <div style={{ position:'absolute',top:'calc(100% + 8px)',right:0,zIndex:41,width:240,
                            background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:16,
                            boxShadow:'0 16px 40px rgba(0,0,0,0.4)',display:'flex',flexDirection:'column',gap:12 }}>
                <Select label="Tag" value={tag} onChange={setTag}
                  options={[{value:'all',label:'Todos los tags'}, ...allTags.map(t=>({value:t,label:t}))]}/>
                <Select label="Formato" value={format} onChange={setFormat}
                  options={[
                    {value:'all',label:'Todos los formatos'},
                    {value:'physical',label:'📖 Físico'},
                    {value:'digital',label:'📱 Digital'},
                    {value:'audio',label:'🎧 Audio'},
                  ]}/>
                <Select label="Ordenar por" value={sort} onChange={setSort}
                  options={[
                    {value:'end',label:'Fecha de lectura'},
                    {value:'recent',label:'Fecha de ingreso'},
                    {value:'title',label:'Título A–Z'},
                    {value:'rating',label:'Mejor rating'},
                    {value:'year',label:'Año publicación'},
                  ]}/>
                {activeFilterCount>0 && (
                  <button onClick={()=>{setTag('all');setFormat('all');}}
                    style={{ fontSize:11,color:C.ink3,background:'none',border:'none',cursor:'pointer',textAlign:'left',padding:0 }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* View toggle — 3 matching SVG icons, no more mixed emoji */}
        <div style={{ display:'flex',gap:2,padding:3,background:C.bgSurface,borderRadius:8,border:`1px solid ${C.border}`,marginLeft:'auto' }}>
          {[
            { v:'grid',  title:'Cuadrícula', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
            { v:'list',  title:'Lista',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg> },
            { v:'shelf', title:'Estante',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5a1 1 0 011-1h3a1 1 0 011 1v14M4 19h5M12 19V5a1 1 0 011-1h3a1 1 0 011 1v14m-5 0h5M20 19V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v14"/><line x1="2" y1="19" x2="22" y2="19"/></svg> },
          ].map(({v,title,icon})=>(
            <button key={v} onClick={()=>setView(v as any)}
              style={{ width:30,height:30,borderRadius:6,border:'none',cursor:'pointer',
                       display:'flex',alignItems:'center',justifyContent:'center',
                       background:view===v?C.bgHover:'transparent',
                       color:view===v?C.ink1:C.ink4,transition:'all 0.2s' }}
              title={title}>
              <span style={{ width:16,height:16,display:'block' }}>{icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Leyendo ahora — fijo arriba, ya no se hunde al final de "Todos" ──
           Se adapta a la vista activa: en grid usa tarjetas del mismo tamaño
           que el resto, en lista usa filas de tabla, y en estante no se
           duplica porque esa vista ya agrupa "Leyendo ahora" como su propio
           estante (ver más abajo). */}
      {showPinned && view !== 'shelf' && pinnedReading.length > 0 && (
        <div style={{ marginBottom:36 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <span style={{ width:3, height:11, borderRadius:2, background:'#3B82F6', boxShadow:'0 0 6px #3B82F6', display:'inline-block' }}/>
            <p style={{ fontSize:11, fontWeight:600, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.1em' }}>Leyendo ahora</p>
          </div>

          {view === 'grid' && (
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',
              gap:24,
            }}>
              {pinnedReading.map(book=>{
                const pct = book.pages > 0 ? Math.min(Math.round((book.pagesRead/book.pages)*100),100) : 0;
                return (
                  <div key={book.id} onClick={()=>navigate(`/books/${book.id}`)} style={{ cursor:'pointer' }} className="fade-in">
                    <div style={{ aspectRatio:'2/3', borderRadius:12, overflow:'hidden', position:'relative',
                                  background:C.bgCard, border:'1px solid rgba(59,130,246,0.35)',
                                  boxShadow:'0 4px 14px rgba(0,0,0,0.35)' }}>
                      <BookCover book={book}/>
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:4, background:'rgba(0,0,0,0.4)' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:'#3B82F6' }}/>
                      </div>
                    </div>
                    <div style={{ marginTop:10 }}>
                      <p style={{ fontSize:12, fontWeight:500, color:C.ink1, lineHeight:1.4,
                                   overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                        {book.title}
                      </p>
                      <p style={{ fontSize:11, color:'#3B82F6', marginTop:3, fontFamily:C.fontMono }}>{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'list' && (
            <div style={{ border:'1px solid rgba(59,130,246,0.35)', borderRadius:12, overflow:'hidden' }}>
              <div className="rx-list-row-pinned" style={{ display:'grid', gridTemplateColumns:'48px 1fr 180px 120px 90px',
                            gap:16, padding:'10px 16px',
                            fontSize:10, color:C.ink3, fontWeight:600, letterSpacing:'0.1em',
                            textTransform:'uppercase', borderBottom:`1px solid ${C.border}`,
                            background:C.bgSurface }}>
                <span/>
                <span>Título</span><span>Autor</span><span>Progreso</span><span style={{textAlign:'right'}}>Páginas</span>
              </div>
              {pinnedReading.map((book,i)=>{
                const author = book.author.includes(',') ? book.author.split(',').reverse().join(' ').trim() : book.author;
                const pct = book.pages > 0 ? Math.min(Math.round((book.pagesRead/book.pages)*100),100) : 0;
                return (
                  <div key={book.id} onClick={()=>navigate(`/books/${book.id}`)}
                    className="rx-list-row-pinned"
                    style={{ display:'grid', gridTemplateColumns:'48px 1fr 180px 120px 90px',
                              gap:16, padding:'12px 16px', cursor:'pointer', alignItems:'center',
                              borderBottom:i<pinnedReading.length-1?`1px solid ${C.border}`:'none',
                              transition:'background 0.15s', background:'transparent' }}
                    onMouseEnter={e=>(e.currentTarget.style.background=C.bgHover)}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <div style={{ width:32, height:48, borderRadius:4, overflow:'hidden', flexShrink:0 }}>
                      <BookCover book={book} />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:500, color:C.ink1,
                                   overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{book.title}</p>
                      <p style={{ fontSize:11, color:C.ink4, marginTop:2 }}>{book.year}</p>
                    </div>
                    <p style={{ fontSize:12, color:C.ink2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{author}</p>
                    <div>
                      <ProgressBar value={pct} color="#3B82F6" height={5}/>
                      <p style={{ fontSize:10, color:'#3B82F6', marginTop:3, fontFamily:C.fontMono }}>{pct}%</p>
                    </div>
                    <p style={{ fontSize:12, color:C.ink3, fontFamily:C.fontMono, textAlign:'right' }}>
                      {book.pagesRead}/{book.pages}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {mainList.length === 0 && (
        <div style={{ textAlign:'center',padding:'80px 0',color:C.ink3 }}>
          <div style={{ fontSize:48,marginBottom:12 }}>📚</div>
          <p style={{ fontSize:16,color:C.ink2 }}>No hay libros</p>
          <p style={{ fontSize:13,marginTop:6,color:C.ink4 }}>
            {books.length===0 ? 'Agregá tu primer libro' : 'Probá con otros filtros'}
          </p>
          {books.length===0 && (
            <div style={{ marginTop:20 }}>
              <Btn variant="ghost" onClick={loadDemo} disabled={loadingDemo}>
                {loadingDemo ? 'Cargando…' : '✨ Cargar biblioteca de ejemplo'}
              </Btn>
              <p style={{ fontSize:11,color:C.ink4,marginTop:10 }}>
                10 libros de ejemplo con citas, personajes y progreso — para ver la app en uso.<br/>
                Podés borrar los libros de ejemplo cuando quieras desde Ajustes → Datos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {mainList.length > 0 && view === 'grid' && (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',
          gap:24,
        }}>
          {mainList.map(book=>(
            <div key={book.id} onClick={()=>navigate(`/books/${book.id}`)}
              style={{ cursor:'pointer' }}
              className="fade-in">
              <div style={{ aspectRatio:'2/3',borderRadius:12,overflow:'hidden',
                            background:C.bgCard,position:'relative',
                            border:'1px solid rgba(139,92,246,0.18)',
                            transition:'transform 0.25s,box-shadow 0.25s,border-color 0.25s',
                            boxShadow:'0 4px 14px rgba(0,0,0,0.35), 0 0 0 rgba(139,92,246,0)' }}
                onMouseEnter={e=>{
                  (e.currentTarget as HTMLDivElement).style.transform='translateY(-5px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow='0 16px 36px rgba(0,0,0,0.45), 0 0 32px rgba(139,92,246,0.4)';
                  (e.currentTarget as HTMLDivElement).style.borderColor='rgba(139,92,246,0.6)';
                }}
                onMouseLeave={e=>{
                  (e.currentTarget as HTMLDivElement).style.transform='none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 14px rgba(0,0,0,0.35), 0 0 0 rgba(139,92,246,0)';
                  (e.currentTarget as HTMLDivElement).style.borderColor='rgba(139,92,246,0.18)';
                }}>
                <BookCover book={book} />
                {/* Status dot — bottom-right, out of the way of the bevel notch */}
                <div style={{
                  position:'absolute',bottom:8,right:8,width:9,height:9,borderRadius:'50%',
                  background:STATUS_COLORS[book.status]||STATUS_COLORS.planned,
                  boxShadow:`0 0 8px 1px ${STATUS_COLORS[book.status]||STATUS_COLORS.planned}`,
                  border:'1.5px solid rgba(0,0,0,0.3)',
                }}/>
              </div>
              <div style={{ marginTop:10 }}>
                <p style={{ fontSize:12,fontWeight:500,color:C.ink1,lineHeight:1.4,
                             overflow:'hidden',display:'-webkit-box',
                             WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>
                  {book.title}
                </p>
                <p style={{ fontSize:11,color:C.ink3,marginTop:3,
                             overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                  {book.author.includes(',') ? book.author.split(',').reverse().join(' ').trim() : book.author}
                </p>
                {book.rating>0 && <Stars rating={book.rating} size={10} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {mainList.length > 0 && view === 'list' && (
        <div style={{ border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden' }}>
          <div className="rx-list-row" style={{ display:'grid',gridTemplateColumns:'48px 1fr 180px 120px 90px 80px',
                        gap:16,padding:'10px 16px',
                        fontSize:10,color:C.ink3,fontWeight:600,letterSpacing:'0.1em',
                        textTransform:'uppercase',borderBottom:`1px solid ${C.border}`,
                        background:C.bgSurface }}>
            <span/>
            <span>Título</span><span>Autor</span><span>Estado</span>
            <span>Páginas</span><span style={{textAlign:'right'}}>Rating</span>
          </div>
          {mainList.map((book,i)=>{
            const author = book.author.includes(',') ? book.author.split(',').reverse().join(' ').trim() : book.author;
            return (
              <div key={book.id} onClick={()=>navigate(`/books/${book.id}`)}
                className="rx-list-row"
                style={{ display:'grid',gridTemplateColumns:'48px 1fr 180px 120px 90px 80px',
                          gap:16,padding:'12px 16px',cursor:'pointer',alignItems:'center',
                          borderBottom:i<mainList.length-1?`1px solid ${C.border}`:'none',
                          transition:'background 0.15s',background:'transparent' }}
                onMouseEnter={e=>(e.currentTarget.style.background=C.bgHover)}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div style={{ width:32,height:48,borderRadius:4,overflow:'hidden',flexShrink:0 }}>
                  <BookCover book={book} />
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:13,fontWeight:500,color:C.ink1,
                               overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{book.title}</p>
                  <p style={{ fontSize:11,color:C.ink4,marginTop:2 }}>{book.year}</p>
                  <p className="rx-mobile-only-line" style={{ display:'none',fontSize:11,color:C.ink3,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{author}</p>
                </div>
                <p style={{ fontSize:12,color:C.ink2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{author}</p>
                <StatusBadge status={book.status}/>
                <p style={{ fontSize:12,color:C.ink3,fontFamily:C.fontMono }}>{book.pages.toLocaleString('es')}</p>
                <div style={{ display:'flex',justifyContent:'flex-end' }}>
                  {book.rating>0 && <Stars rating={book.rating} size={10}/>}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Shelf */}
      {mainList.length > 0 && view === 'shelf' && (() => {
        // Group by status for shelf sections
        const sections = [
          { key:'reading',  label:'Leyendo ahora',    color:STATUS_COLORS.reading },
          { key:'finished', label:'Leídos',           color:STATUS_COLORS.finished },
          { key:'planned',  label:'Pendientes',       color:STATUS_COLORS.planned },
          { key:'abandoned',label:'Abandonados',      color:STATUS_COLORS.abandoned },
        ];
        return (
          <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
            {sections.map(sec => {
              const secBooks = mainList.filter(b => b.status === sec.key);
              if (secBooks.length === 0) return null;
              return (
                <div key={sec.key}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:sec.color, flexShrink:0, display:'inline-block' }}/>
                    <span style={{ fontSize:11, fontWeight:600, color:sec.color, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                      {sec.label}
                    </span>
                    <span style={{ fontSize:11, color:C.ink4, fontFamily:C.fontMono }}>{secBooks.length}</span>
                    <div style={{ flex:1, height:1, background:C.border }}/>
                  </div>
                  {/* The shelf plank */}
                  <div style={{
                    position:'relative',
                    background:`linear-gradient(180deg, ${C.bgSurface} 0%, ${C.bgCard} 100%)`,
                    borderRadius:12,
                    padding:'24px 24px 0',
                    border:`1px solid ${C.border}`,
                    overflowX:'auto',
                  }}>
                    <div style={{ display:'flex', gap:3, alignItems:'flex-end', minHeight:160, paddingBottom:0, position:'relative', zIndex:1 }}>
                      {secBooks.map(book => {
                        const isAudio = book.format === 'audio';
                        const COLORS  = isAudio
                          ? ['#051a1a','#071f1f','#061c1c','#081e1e','#051818','#071d1d','#061b1b']
                          : ['#1a1035','#0f1f1a','#1a0f0f','#0f1a2e','#1a150a','#150f1a','#0f1a1a'];
                        const ACCENTS = isAudio
                          ? ['#14B8A6','#0EA5E9','#06B6D4','#14B8A6','#0EA5E9','#22D3EE','#14B8A6']
                          : CATEGORY_COLORS;
                        const idx = Math.abs([...book.title].reduce((a:number,v:string)=>a+v.charCodeAt(0),0)) % COLORS.length;
                        // Spine height based on pages (relative, clamped 100–160px)
                        const maxPages = Math.max(...secBooks.map(b=>b.pages||200));
                        const spineH = 100 + Math.round(((book.pages||200)/maxPages)*60);
                        // Spine width ~26-30px — wide enough to carry a title
                        const spineW = 27;
                        return (
                          <div key={book.id}
                            onClick={() => navigate(`/books/${book.id}`)}
                            style={{ flexShrink:0, cursor:'pointer', transition:'transform 0.2s', position:'relative' }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.transform='translateY(-10px)';
                              const auth = book.author.includes(',') ? book.author.split(',').reverse().join(' ').trim() : book.author;
                              showTip(e, <>
                                <p style={{ fontWeight:600, color:C.ink1, marginBottom:2 }}>{book.title}</p>
                                <p style={{ color:C.ink3 }}>{auth}</p>
                                {book.rating > 0 && <p style={{ color:ACCENTS[idx], marginTop:2 }}>{'★'.repeat(book.rating)}</p>}
                              </>);
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.transform='none';
                              hideTip();
                            }}>
                            {/* Spine */}
                            {book.cover
                              ? <div style={{ position:'relative', width:spineW, height:spineH, borderRadius:'3px 3px 0 0', overflow:'hidden',
                                              boxShadow:'2px 0 8px rgba(0,0,0,0.4), inset 1px 0 0 rgba(255,255,255,0.1), inset -1px 0 0 rgba(0,0,0,0.3)' }}>
                                  <img src={book.cover} alt={book.title}
                                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }}/>
                                </div>
                              : (
                                <svg width={spineW} height={spineH} style={{ display:'block', borderRadius:'3px 3px 0 0',
                                     boxShadow:'2px 0 8px rgba(0,0,0,0.4)' }}>
                                  <defs>
                                    <linearGradient id={`spine-${book.id}`} x1="0" y1="0" x2="1" y2="0">
                                      <stop offset="0%"  stopColor={ACCENTS[idx]} stopOpacity="0.5"/>
                                      <stop offset="18%" stopColor={COLORS[idx]}/>
                                      <stop offset="100%" stopColor={COLORS[idx]}/>
                                    </linearGradient>
                                  </defs>
                                  <rect width={spineW} height={spineH} fill={`url(#spine-${book.id})`}/>
                                  <rect x={0} y={0} width={1.5} height={spineH} fill="rgba(255,255,255,0.15)"/>
                                  <text
                                    x={spineW/2} y={spineH-10}
                                    fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle"
                                    transform={`rotate(-90, ${spineW/2}, ${spineH/2})`}
                                    fontFamily="'Space Grotesk',sans-serif" fontWeight="500"
                                    style={{ letterSpacing:'0.02em' }}>
                                    {book.title.slice(0, 22)}
                                  </text>
                                </svg>
                              )
                            }
                          </div>
                        );
                      })}
                    </div>
                    {/* Wood-toned shelf plank — a real ledge, not just a colored bar */}
                    <div style={{
                      height:16, marginTop:-1, borderRadius:'0 0 8px 8px', position:'relative', zIndex:0,
                      background:'linear-gradient(180deg, #3a2e1f 0%, #241c13 100%)',
                      boxShadow:'0 8px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      <p style={{ marginTop:16,fontSize:11,color:C.ink4,fontFamily:C.fontMono }}>
        {filtered.length} {filtered.length===1?'libro':'libros'}
        {filtered.length!==books.length ? ` de ${books.length} total` : ''}
      </p>

      <AddBookModal open={showAdd} onClose={()=>setShowAdd(false)} />
      <FixedTooltip {...tooltipProps} />
    </div>
  );
}
