import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { bookXP } from '../lib/xp';
import { C, SectionTitle, Stars, ProgressBar, Modal, Input, Select, Textarea, Btn, Tabs } from '../components/ui';
import type { BookStatus, BookFormat } from '../types';
import { BookSessionLog } from '../components/SessionTracker';
import { TagInput } from '../components/TagInput';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { CATEGORY_COLORS } from '../lib/colors';

// ── Cover ────────────────────────────────────────────────────
function BookCover({ book }: { book: any }) {
  const [err, setErr] = useState(false);
  const isAudio = book.format === 'audio';
  const COLORS  = isAudio
    ? ['#051a1a','#071f1f','#061c1c','#081e1e','#051818']
    : ['#1a1035','#0f1f1a','#1a0f0f','#0f1a2e','#1a150a','#150f1a','#0f1a1a'];
  const ACCENTS = isAudio
    ? ['#14B8A6','#0EA5E9','#06B6D4','#14B8A6','#0EA5E9']
    : CATEGORY_COLORS;
  const idx = Math.abs([...book.title].reduce((a:number,c:string)=>a+c.charCodeAt(0),0)) % COLORS.length;
  const bg = COLORS[idx], ac = ACCENTS[idx];

  if (book.cover && !err) {
    return (
      <div style={{ position:'relative', width:'100%', height:'100%' }}>
        <img src={book.cover} alt={book.title} onError={()=>setErr(true)}
          style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
        {isAudio && (
          <div style={{ position:'absolute',top:10,left:10,
            background:'rgba(20,184,166,0.9)',borderRadius:8,
            padding:'4px 10px',display:'flex',alignItems:'center',gap:5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 18v-6a9 9 0 0118 0v6"/>
              <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
            </svg>
            <span style={{ fontSize:11,color:'white',fontWeight:700,letterSpacing:'0.05em' }}>AUDIO</span>
          </div>
        )}
      </div>
    );
  }

  if (isAudio) {
    const durH = Math.floor((book.duration||book.pages||0)/60);
    const durM = (book.duration||book.pages||0) % 60;
    const durStr = durH > 0 ? `${durH}h ${durM}m` : durM > 0 ? `${durM}m` : '';
    return (
      <svg viewBox="0 0 200 300" style={{ width:'100%',height:'100%',display:'block' }}>
        <rect width="200" height="300" fill={bg}/>
        {[20,32,50,38,54,30,46,35,52,40].map((h,i)=>(
          <rect key={i} x={16+i*17} y={130-h/2} width="10" height={h} rx="5" fill={ac} opacity="0.45"/>
        ))}
        <text x="100" y="108" textAnchor="middle" fontSize="44" fill={ac} opacity="0.65">🎧</text>
        {book.title.split(' ').slice(0,5).map((word:string,i:number)=>(
          <text key={i} x="100" y={195+i*18} textAnchor="middle" fill="rgba(255,255,255,0.85)"
            fontFamily="Georgia,serif" fontSize="14">{word}</text>
        ))}
        {durStr && (
          <text x="100" y="283" textAnchor="middle" fill={ac}
            fontFamily="monospace" fontSize="11" opacity="0.8">{durStr}</text>
        )}
        <rect x="20" y="28" width="160" height="0.5" fill={ac} opacity="0.3"/>
        <rect x="20" y="268" width="160" height="0.5" fill={ac} opacity="0.3"/>
      </svg>
    );
  }

  const lastName = book.author.includes(',') ? book.author.split(',')[0] : book.author.split(' ').pop()||'';
  return (
    <svg viewBox="0 0 200 300" style={{ width:'100%',height:'100%',display:'block' }}>
      <rect width="200" height="300" fill={bg}/>
      <rect x="20" y="20" width="160" height="1" fill={ac} opacity="0.5"/>
      <rect x="20" y="30" width="3" height="80" fill={ac}/>
      {book.title.split(' ').slice(0,6).map((word:string,i:number)=>(
        <text key={i} x="30" y={52+i*20} fill="rgba(255,255,255,0.85)" fontFamily="Georgia,serif" fontSize="13">{word}</text>
      ))}
      <circle cx="100" cy="195" r="38" fill="none" stroke={ac} strokeWidth="0.5" opacity="0.35"/>
      <text x="100" y="203" fill={ac} fontFamily="Georgia,serif" fontSize="32" textAnchor="middle" opacity="0.45">{book.title[0]}</text>
      <rect x="20" y="272" width="160" height="0.5" fill={ac} opacity="0.4"/>
      <text x="20" y="287" fill={ac} fontFamily="system-ui,sans-serif" fontSize="8" letterSpacing="1.5" opacity="0.7">{lastName.toUpperCase()}</text>
    </svg>
  );
}

// ── Edit modal ───────────────────────────────────────────────
function EditModal({ book, open, onClose }: { book: any; open: boolean; onClose: () => void }) {
  const updateBook = useStore(s => s.updateBook);
  const deleteBook = useStore(s => s.deleteBook);
  const addBook    = useStore(s => s.addBook);
  const uploadCover = useStore(s => s.uploadCover);
  const [form, setForm] = useState({ ...book });
  const [tab, setTab] = useState('info');
  const [coverMode, setCoverMode] = useState<'url'|'file'>('url');
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const isAudio = form.format === 'audio';

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { set('cover', await uploadCover(file)); } catch { alert('Error al subir portada'); }
    finally { setUploading(false); }
  }

  function save() {
    updateBook(book.id, { ...form, themes: form.tags });
    onClose();
  }

  function handleDuplicate() {
    if (!confirm(`¿Duplicar "${form.title}" para una relectura?\nSe creará una copia con estado Pendiente.`)) return;
    const { id, createdAt, updatedAt, ...rest } = form as any;
    addBook({ ...rest, status: 'planned', start: '', end: '', pagesRead: 0, rating: 0, notes: '' });
    alert('Libro duplicado. Lo encontrás en Pendientes.');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}
      title={isAudio ? `Editar audiolibro · ${book.title}` : `Editar libro · ${book.title}`}
      width={640}>
      <Tabs
        tabs={[{ id:'info', label:'Información' }, { id:'content', label:'Contenido' }]}
        active={tab} onChange={setTab}/>

      {tab === 'info' && (
        <div style={{ display:'grid', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <Input label="Título" value={form.title} onChange={v=>set('title',v)}/>
            </div>
            <Input label="Autor / Narrador" value={form.author} onChange={v=>set('author',v)}/>

            {isAudio ? (
              <>
                <Input label="Duración total (minutos)" value={form.duration||form.pages||0}
                  onChange={v=>set('duration',Number(v))} type="number" min={0}
                  placeholder="ej: 540 = 9 horas"/>
                <Input label="Minutos escuchados" value={form.minutesListened||form.pagesRead||0}
                  onChange={v=>{ set('minutesListened',Number(v)); set('pagesRead',Number(v)); }}
                  type="number" min={0}/>
              </>
            ) : (
              <>
                <Input label="Páginas totales" value={form.pages} onChange={v=>set('pages',Number(v))} type="number"/>
                <Input label="Páginas leídas" value={form.pagesRead} onChange={v=>set('pagesRead',Number(v))} type="number"/>
              </>
            )}
            <Select label="Estado" value={form.status} onChange={v=>{
              set('status', v);
              if (v === 'finished' && form.pages > 0) set('pagesRead', form.pages);
            }} options={
              isAudio
                ? [{value:'planned',label:'Pendiente de escuchar'},{value:'reading',label:'Escuchando'},
                   {value:'finished',label:'Escuchado'},{value:'abandoned',label:'Abandonado'}]
                : [{value:'planned',label:'Pendiente'},{value:'reading',label:'Leyendo'},
                   {value:'finished',label:'Leído'},{value:'abandoned',label:'Abandonado'}]
            }/>
            <Select label="Formato" value={form.format} onChange={v=>set('format',v as BookFormat)} options={[
              {value:'physical',label:'📖 Físico'},
              {value:'digital', label:'📱 Digital'},
              {value:'audio',   label:'🎧 Audiolibro'},
            ]}/>

            <Input label={isAudio ? 'Inicio de escucha' : 'Inicio de lectura'} value={form.start} onChange={v=>set('start',v)} type="date"/>
            <Input label="Fin" value={form.end} onChange={v=>set('end',v)} type="date"/>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:11,fontWeight:500,color:C.ink3,letterSpacing:'0.04em',display:'block',marginBottom:8 }}>PORTADA</label>
              <div style={{ display:'flex',gap:4,marginBottom:10,background:C.bgSurface,borderRadius:8,padding:3,border:`1px solid ${C.border}`,width:'fit-content' }}>
                {(['url','file'] as const).map(m=>(
                  <button key={m} onClick={()=>setCoverMode(m)}
                    style={{ padding:'4px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,background:coverMode===m?C.accent:'transparent',color:coverMode===m?C.onAccent:C.ink3 }}>
                    {m==='url'?'🔗 URL':'📁 Archivo'}
                  </button>
                ))}
              </div>
              {coverMode==='url'
                ? <input value={form.cover} onChange={e=>set('cover',e.target.value)} placeholder="https://..."
                    style={{ width:'100%',padding:'9px 12px',borderRadius:10,fontSize:12,background:C.bgSurface,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
                : <label style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,border:`1px dashed ${C.border}`,cursor:'pointer',background:C.bgSurface }}>
                    <input type="file" accept="image/*" onChange={handleCoverFile} style={{ display:'none' }}/>
                    {uploading ? <span style={{fontSize:13,color:C.ink3}}>Subiendo...</span>
                      : <><span style={{fontSize:20}}>📷</span><span style={{fontSize:13,color:C.ink2}}>{form.cover?'Cambiar imagen':'Seleccionar imagen'}</span></>}
                  </label>
              }
              {form.cover && <div style={{ display:'flex',gap:8,alignItems:'center',marginTop:8 }}><img src={form.cover} alt="" style={{ width:32,height:48,objectFit:'cover',borderRadius:4 }} onError={e=>(e.currentTarget.style.display='none')}/><span style={{fontSize:11,color:C.ink3}}>Portada actual</span></div>}
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <span style={{ display:'block',fontSize:11,fontWeight:500,color:C.ink3,marginBottom:4,letterSpacing:'0.04em' }}>Tags</span>
              <TagInput value={form.tags} onChange={v=>set('tags',v)}/>
            </div>
          </div>
          <div>
            <span style={{ fontSize:11,fontWeight:500,color:C.ink3,letterSpacing:'0.04em' }}>
              {isAudio ? 'Valoración del audio' : 'Rating'}
            </span>
            <div style={{ marginTop:6 }}>
              <Stars rating={form.rating} size={22} interactive onChange={v=>set('rating',v)}/>
            </div>
          </div>
          {!isAudio && (
            <div>
              <span style={{ fontSize:11,fontWeight:500,color:C.ink3,letterSpacing:'0.04em' }}>
                Dificultad: {form.difficulty}/5
              </span>
              <input type="range" min={1} max={5} value={form.difficulty}
                onChange={e=>set('difficulty',Number(e.target.value))}
                style={{ width:'100%',marginTop:6,accentColor:C.accent }}/>
            </div>
          )}
          <label style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer' }}>
            <input type="checkbox" checked={form.recommended}
              onChange={e=>set('recommended',e.target.checked)}
              style={{ accentColor:C.accent,width:16,height:16 }}/>
            <span style={{ fontSize:13,color:C.ink2 }}>Recomendado</span>
          </label>
        </div>
      )}

      {tab === 'content' && (
        <div style={{ display:'grid', gap:14 }}>
          <Textarea label={isAudio ? 'Descripción / Sinopsis' : 'Resumen'} value={form.summary} onChange={v=>set('summary',v)} rows={4}/>
          <QuoteEditor value={form.quotes} onChange={v=>set('quotes',v)} />
          {!isAudio && (
            <div>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                <span style={{ fontSize:11,fontWeight:500,color:C.ink3,letterSpacing:'0.04em' }}>PERSONAJES</span>
                {!form.characters && <button onClick={()=>set('characters','**Protagonista** — descripción\n\n**Antagonista** — descripción\n\n**Personaje secundario** — descripción')}
                  style={{ fontSize:11,color:C.accent,background:'none',border:'none',cursor:'pointer',padding:0 }}>
                  + Usar plantilla
                </button>}
              </div>
              <textarea value={form.characters} onChange={e=>set('characters',e.target.value)} rows={4}
                placeholder="**Nombre** — descripción"
                style={{ width:'100%',padding:'10px 12px',borderRadius:10,fontSize:13,lineHeight:1.6,background:C.bgSurface,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',resize:'vertical',fontFamily:"monospace",boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
          )}
          <Textarea label="Notas personales" value={form.notes} onChange={v=>set('notes',v)} rows={4}/>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    marginTop:24, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="danger" onClick={()=>{ if(confirm('¿Eliminar?')) { deleteBook(book.id).then(() => onClose()); } }}>
            Eliminar
          </Btn>
          <Btn variant="ghost" onClick={handleDuplicate}>
            📋 Duplicar
          </Btn>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={save}>Guardar cambios</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Quote renderer ───────────────────────────────────────────
// Parse raw markdown quotes into structured blocks
function parseRawQuotes(raw: string): {text:string;page:string}[] {
  if (!raw) return [];
  const lines = raw.split('\n');
  const blocks: {text:string;page:string}[] = [];
  let cur = {text:'',page:''};
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('> \"') || t.startsWith("> '")) {
      cur.text = t.replace(/^> ["']/, '').replace(/["']$/, '');
    } else if (t.startsWith('> —')) {
      cur.page = t.replace('> —','').trim();
      if (cur.text) { blocks.push({...cur}); cur={text:'',page:''}; }
    } else if (t.startsWith('>') && t.length > 1) {
      const txt = t.replace(/^> /,'').replace(/^["']/,'').replace(/["']$/,'');
      if (txt) cur.text = txt;
    }
  }
  if (cur.text) blocks.push(cur);
  return blocks;
}

function quoteBlocksToRaw(blocks: {text:string;page:string}[]): string {
  return blocks.map(b => `> "${b.text}"${b.page ? `\n> — ${b.page}` : ''}`).join('\n\n');
}

// ── Structured quote editor ──────────────────────────────────
function QuoteEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [blocks, setBlocks] = useState<{text:string;page:string}[]>(() => {
    const parsed = parseRawQuotes(value);
    return parsed.length > 0 ? parsed : [];
  });
  const [showRaw, setShowRaw] = useState(false);

  function update(newBlocks: {text:string;page:string}[]) {
    setBlocks(newBlocks);
    onChange(quoteBlocksToRaw(newBlocks));
  }

  function addQuote() {
    update([...blocks, {text:'', page:''}]);
  }

  function removeQuote(i: number) {
    update(blocks.filter((_,j) => j !== i));
  }

  function updateQuote(i: number, field: 'text'|'page', val: string) {
    const nb = blocks.map((b,j) => j===i ? {...b,[field]:val} : b);
    update(nb);
  }

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
        <span style={{ fontSize:11,fontWeight:500,color:C.ink3,letterSpacing:'0.04em' }}>
          CITAS ({blocks.length})
        </span>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={() => setShowRaw(r=>!r)}
            style={{ fontSize:11,color:C.ink4,background:'none',border:'none',cursor:'pointer',padding:0 }}>
            {showRaw ? 'Vista editor' : 'Ver markdown'}
          </button>
          <button onClick={addQuote}
            style={{ fontSize:11,color:C.accent,background:'none',border:'none',cursor:'pointer',padding:0,fontWeight:600 }}>
            + Agregar cita
          </button>
        </div>
      </div>

      {showRaw ? (
        <textarea value={value} onChange={e => { onChange(e.target.value); setBlocks(parseRawQuotes(e.target.value)); }} rows={8}
          style={{ width:'100%',padding:'10px 12px',borderRadius:10,fontSize:12,lineHeight:1.6,background:C.bgSurface,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',resize:'vertical',fontFamily:C.fontMono,boxSizing:'border-box' as any }}/>
      ) : blocks.length === 0 ? (
        <div style={{ padding:'20px',borderRadius:10,border:`1px dashed ${C.border}`,textAlign:'center' }}>
          <p style={{ fontSize:13,color:C.ink4,marginBottom:10 }}>Sin citas. Agregá la primera.</p>
          <button onClick={addQuote}
            style={{ padding:'7px 16px',borderRadius:8,background:C.accent,border:'none',color:C.onAccent,fontSize:12,cursor:'pointer' }}>
            + Agregar cita
          </button>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {blocks.map((b,i) => (
            <div key={i} style={{ padding:'14px 16px',borderRadius:10,background:C.bgSurface,border:`1px solid ${C.border}`,position:'relative' }}>
              <button onClick={() => removeQuote(i)}
                style={{ position:'absolute',top:8,right:10,background:'none',border:'none',cursor:'pointer',color:C.ink4,fontSize:16,lineHeight:1 }}
                title="Eliminar cita">×</button>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                <div>
                  <span style={{ fontSize:10,color:C.ink4,letterSpacing:'0.04em',display:'block',marginBottom:4 }}>TEXTO DE LA CITA *</span>
                  <textarea
                    value={b.text}
                    onChange={e => updateQuote(i,'text',e.target.value)}
                    rows={3}
                    placeholder="Escribí la cita aquí..."
                    style={{ width:'100%',padding:'8px 10px',borderRadius:8,fontSize:13,lineHeight:1.6,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',resize:'vertical',fontFamily:C.fontSerif,fontStyle:'italic',boxSizing:'border-box' as any }}
                    onFocus={e=>e.target.style.borderColor=C.accent}
                    onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div>
                  <span style={{ fontSize:10,color:C.ink4,letterSpacing:'0.04em',display:'block',marginBottom:4 }}>REFERENCIA (página, capítulo…)</span>
                  <input
                    value={b.page}
                    onChange={e => updateQuote(i,'page',e.target.value)}
                    placeholder="Ej: Capítulo 3 · p. 47"
                    style={{ width:'100%',padding:'7px 10px',borderRadius:8,fontSize:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink2,outline:'none',boxSizing:'border-box' as any }}
                    onFocus={e=>e.target.style.borderColor=C.accent}
                    onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteBlock({ raw }: { raw: string }) {
  const blocks = parseRawQuotes(raw);
  if (blocks.length === 0) return <p style={{color:C.ink3,fontStyle:'italic',fontSize:13}}>Sin citas todavía. Editá el libro para agregar.</p>;
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      {blocks.map((b,i)=>(
        <div key={i} style={{
          padding:'18px 20px', borderRadius:14,
          background:'linear-gradient(135deg,rgba(139,92,246,0.06),rgba(139,92,246,0.02))',
          border:`1px solid rgba(139,92,246,0.15)`,
          position:'relative', overflow:'hidden'
        }}>
          <span style={{ position:'absolute',top:10,right:16,fontSize:48,color:C.accent,opacity:0.07,fontFamily:'Georgia',lineHeight:1 }}>"</span>
          <p style={{ fontFamily:C.fontSerif,fontSize:16,color:C.ink1,fontStyle:'italic',lineHeight:1.7,position:'relative' }}>
            "{b.text}"
          </p>
          {b.page && (
            <p style={{ fontSize:11,color:C.accent,marginTop:10,fontFamily:C.fontMono,opacity:0.8 }}>— {b.page}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Characters renderer ──────────────────────────────────────
function CharBlock({ raw }: { raw: string }) {
  if (!raw || raw.toLowerCase().includes('no aplica'))
    return <p style={{color:C.ink3,fontStyle:'italic',fontSize:13}}>No aplica.</p>;
  const chars: {name:string;desc:string}[] = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/\*\*(.+?)\*\*\s*[—–-]+\s*(.+)/);
    if (m) chars.push({ name:m[1].trim(), desc:m[2].trim() });
  }
  if (chars.length===0) return <p style={{color:C.ink3,fontStyle:'italic',fontSize:13}}>Sin personajes.</p>;
  return (
    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10 }}>
      {chars.map((c,i)=>(
        <div key={i} style={{ padding:14,borderRadius:14,background:C.bgSurface,border:`1px solid ${C.border}` }}>
          <p style={{ fontSize:13,fontWeight:600,color:C.ink1 }}>{c.name}</p>
          <p style={{ fontSize:12,color:C.ink2,marginTop:6,lineHeight:1.6 }}>{c.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ── Audio status labels ──────────────────────────────────────
const AUDIO_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  finished:  { label:'Escuchado',          color:'var(--rx-success)', bg:'rgba(34,197,94,0.1)'  },
  reading:   { label:'Escuchando',         color:'var(--rx-info)',    bg:'var(--rx-info-mid)' },
  planned:   { label:'Pendiente escuchar', color:'var(--rx-ink3)',    bg:'rgba(90,90,114,0.1)'  },
  abandoned: { label:'Abandonado',         color:'var(--rx-danger)',  bg:'rgba(239,68,68,0.1)'  },
};

// ── Main page ────────────────────────────────────────────────
export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const books = useStore(s => s.books);
  const book  = books.find(b => b.id === id);
  useDocumentTitle(book?.title ?? 'Libro no encontrado');

  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState('quotes');
  const sessions   = useStore(s => s.sessions);
  const addSession = useStore(s => s.addSession);
  const updateBook = useStore(s => s.updateBook);
  const [showQuickSession, setShowQuickSession] = useState(false);
  const [quickPages, setQuickPages] = useState('');
  const [showQuickQuote, setShowQuickQuote] = useState(false);
  const [quickQuoteText, setQuickQuoteText] = useState('');
  const [quickQuotePage, setQuickQuotePage] = useState('');

  if (!book) return (
    <div style={{ textAlign:'center',padding:80 }}>
      <p style={{ color:C.ink3 }}>No encontrado.</p>
      <Btn onClick={()=>navigate('/')} style={{ marginTop:16 }}>Volver</Btn>
    </div>
  );

  const isAudio  = book.format === 'audio';
  const author   = book.author.includes(',') ? book.author.split(',').reverse().join(' ').trim() : book.author;
  const mainTag  = book.tags[0];
  const genreColor = mainTag
    ? CATEGORY_COLORS[Math.abs([...mainTag].reduce((a,c)=>a+c.charCodeAt(0),0)) % CATEGORY_COLORS.length]
    : C.accent;
  const xp       = bookXP(book);

  // Audio: use duration/minutesListened; books: pages/pagesRead
  const totalUnit    = isAudio ? (book.duration || book.pages || 0) : book.pages;
  const currentUnit  = isAudio ? (book.minutesListened || book.pagesRead || 0) : book.pagesRead;
  const unitLabel    = isAudio ? 'min.' : 'págs.';
  const progress     = totalUnit > 0 ? Math.min(Math.round((currentUnit/totalUnit)*100),100) : 0;

  // Duration display
  const durH = Math.floor(totalUnit/60);
  const durM = totalUnit % 60;
  const durDisplay = isAudio
    ? (durH > 0 ? `${durH}h ${durM}m` : `${durM}m`)
    : `${totalUnit.toLocaleString('es')} págs.`;

  const fmtDate = (s:string) => {
    if (!s) return null;
    const [y,m,d] = s.split('-');
    return `${parseInt(d)} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][parseInt(m)-1]} ${y}`;
  };
  const readDays = book.start && book.end
    ? Math.round((new Date(book.end).getTime()-new Date(book.start).getTime())/86400000) : null;

  // Status display
  const statusCfg = isAudio
    ? (AUDIO_STATUS[book.status] || AUDIO_STATUS.planned)
    : null;

  // Tabs — audio doesn't have "characters"
  const TABS = isAudio
    ? [{ id:'quotes', label:'Citas' }, { id:'notes', label:'Notas' }, { id:'sessions', label:'Sesiones' }]
    : [{ id:'quotes', label:'Citas' }, { id:'characters', label:'Personajes' }, { id:'notes', label:'Notas' }, { id:'sessions', label:'Sesiones' }];

  // Related books
  // ── Contextual data: pace, ETA, constancy heatmap, featured quote ──
  const bookSessions = sessions.filter((s:any)=>s.bookId===book.id).sort((a:any,b:any)=>String(a.date).localeCompare(String(b.date)));
  const now = new Date();
  const isoDay = (d:Date) => d.toISOString().slice(0,10);
  const cutoff21 = new Date(now.getTime()-21*86400000);
  const recentSessions = bookSessions.filter((s:any)=>new Date(s.date) >= cutoff21);
  const recentDaySet = new Set(recentSessions.map((s:any)=>s.date));
  const pace = recentSessions.length ? Math.round(recentSessions.reduce((a:number,s:any)=>a+Number(s.pages||0),0)/Math.max(recentDaySet.size,1)) : 0;
  const overallDaySet = new Set(sessions.map((s:any)=>s.date));
  const overallPace = sessions.length ? Math.round(sessions.reduce((a:number,s:any)=>a+Number(s.pages||0),0)/Math.max(overallDaySet.size,1)) : 0;
  const paceDiffPct = overallPace>0 && pace>0 ? Math.round(((pace-overallPace)/overallPace)*100) : null;
  const remainingUnit = Math.max(totalUnit-currentUnit,0);
  const etaDate = pace>0 && remainingUnit>0 ? new Date(now.getTime()+Math.ceil(remainingUnit/pace)*86400000) : null;
  const etaLabel = etaDate ? fmtDate(isoDay(etaDate)) : null;

  const heatDays = Array.from({length:14},(_,i)=>{
    const key = isoDay(new Date(now.getTime()-(13-i)*86400000));
    return bookSessions.filter((s:any)=>s.date===key).reduce((a:number,s:any)=>a+Number(s.pages||0),0);
  });
  const maxHeat = Math.max(...heatDays, 1);
  const heatLevel = (v:number) => v<=0 ? 0 : (v/maxHeat>0.66 ? 3 : v/maxHeat>0.33 ? 2 : 1);
  let streakDays = 0;
  for (let i=heatDays.length-1;i>=0;i--) { if (heatDays[i]>0) streakDays++; else break; }

  const quoteList = parseRawQuotes(book.quotes);
  const featuredQuote = quoteList[quoteList.length-1];

  const daysInQueue = book.createdAt
    ? Math.max(Math.round((now.getTime()-new Date(book.createdAt).getTime())/86400000),0)
    : null;

  async function saveQuickSession() {
    if (!quickPages || Number(quickPages)<=0) return;
    await addSession({ bookId: book.id, date: isoDay(now), pages: Number(quickPages) });
    const field = isAudio ? 'minutesListened' : 'pagesRead';
    const newVal = Math.min(currentUnit + Number(quickPages), totalUnit || currentUnit + Number(quickPages));
    await updateBook(book.id, { [field]: newVal });
    setQuickPages(''); setShowQuickSession(false);
  }

  async function saveQuickQuote() {
    if (!quickQuoteText.trim()) return;
    const block = `\n> "${quickQuoteText.trim()}"\n> — pág. ${quickQuotePage.trim()||'?'}\n`;
    await updateBook(book.id, { quotes: (book.quotes||'') + block });
    setQuickQuoteText(''); setQuickQuotePage(''); setShowQuickQuote(false);
  }

  async function startReading() {
    await updateBook(book.id, { status:'reading', start: isoDay(now) });
  }
  async function toggleReread() {
    await updateBook(book.id, { status:'reading', pagesRead:0, minutesListened:0, start: isoDay(now), end:null });
  }

  const related = books.filter(b=>b.id!==book.id && b.tags.some(t=>book.tags.includes(t)))
    .sort((a,b)=>b.tags.filter(t=>book.tags.includes(t)).length-a.tags.filter(t=>book.tags.includes(t)).length)
    .slice(0,4);

  return (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:'20px 28px 60px' }}>

      {/* Back */}
      <button onClick={()=>navigate(-1)}
        style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:'none',
                  cursor:'pointer',color:C.ink3,fontSize:13,marginBottom:20,padding:0 }}
        onMouseEnter={e=>(e.currentTarget.style.color=C.ink1)}
        onMouseLeave={e=>(e.currentTarget.style.color=C.ink3)}>
        ← Biblioteca
      </button>

      {/* ── Identity row — cover with a soft glow anchored to it ── */}
      <div style={{ display:'flex', gap:28, alignItems:'center', marginBottom:20, flexWrap:'wrap', position:'relative' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{ position:'absolute', inset:'-24px -24px -8px -24px', borderRadius:22, filter:'blur(28px)', opacity:0.5,
                        background:`radial-gradient(circle, ${genreColor}, transparent 70%)`, zIndex:0 }}/>
          <div style={{ position:'relative', zIndex:1, width:160, aspectRatio:'2/3', borderRadius:14, overflow:'hidden',
                         border:`3px solid ${C.bgCard}`, outline:`1px solid ${C.border}`,
                         boxShadow:'var(--rx-cover-shadow)' }}>
            <BookCover book={book}/>
          </div>
        </div>

        <div style={{ minWidth:0, flex:1 }}>
          {mainTag && (
            <p style={{ fontSize:10,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',
                        color:genreColor,marginBottom:8,display:'flex',alignItems:'center',gap:7 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:genreColor,
                             boxShadow:`0 0 8px 1px ${genreColor}`,display:'inline-block' }}/>
              {mainTag}{isAudio ? ' · Audiolibro' : ''}
            </p>
          )}
          <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
            <h1 style={{ fontFamily:C.fontSerif,fontSize:32,color:C.ink1,lineHeight:1.15 }}>
              {book.title}
            </h1>
            <p style={{ fontSize:15,color:C.ink3,whiteSpace:'nowrap' }}>
              <a onClick={e=>{e.preventDefault();navigate(`/author/${encodeURIComponent(book.author)}`);}}
                 href={`/author/${encodeURIComponent(book.author)}`}
                 style={{ color:'inherit',textDecoration:'none',cursor:'pointer',borderBottom:`1px dashed ${C.border}` }}
                 onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color=C.accent;(e.currentTarget as HTMLElement).style.borderBottomColor=C.accent;}}
                 onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='inherit';(e.currentTarget as HTMLElement).style.borderBottomColor=C.border;}}>
                {author}
              </a>
              {book.year && book.year > 0 ? ` · ${book.year}` : ''}
            </p>
          </div>

          {/* Resumen — siempre visible, ya no es una pestaña */}
          <p style={{ fontSize:14,color:C.ink2,lineHeight:1.7,marginTop:12,maxWidth:640 }}>
            {book.summary || (isAudio ? 'Sin descripción todavía.' : 'Sin resumen todavía.')}
          </p>
        </div>
      </div>

      {/* ── Quick actions — quiet, don't compete with the content ── */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
        {book.status==='reading' && (
          <Btn variant="ghost" size="sm" onClick={()=>setShowQuickSession(v=>!v)}>{isAudio?'🎧':'📖'} Registrar sesión de hoy</Btn>
        )}
        {book.status==='planned' && (
          <Btn variant="ghost" size="sm" onClick={startReading}>▶ Empezar a leer ahora</Btn>
        )}
        {book.status==='finished' && (
          <Btn variant="ghost" size="sm" onClick={toggleReread}>🔁 Marcar para releer</Btn>
        )}
        {book.status==='abandoned' && (
          <Btn variant="ghost" size="sm" onClick={startReading}>▶ Retomar lectura</Btn>
        )}
        {book.status!=='planned' && (
          <Btn variant="ghost" size="sm" onClick={()=>setShowQuickQuote(v=>!v)}>✎ Agregar cita</Btn>
        )}
        <Btn variant="ghost" size="sm" onClick={()=>setShowEdit(true)}>✏️ Editar</Btn>
      </div>

      {/* Inline quick-add: session */}
      {showQuickSession && (
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:18, padding:'12px 16px',
                      background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14 }}>
          <input type="number" autoFocus placeholder={isAudio?'Minutos escuchados hoy':'Páginas leídas hoy'}
            value={quickPages} onChange={e=>setQuickPages(e.target.value)}
            style={{ flex:1, padding:'8px 12px', borderRadius:8, background:C.bgSurface, border:`1px solid ${C.border}`, color:C.ink1, fontSize:13, outline:'none' }}/>
          <Btn size="sm" onClick={saveQuickSession}>Guardar</Btn>
          <Btn size="sm" variant="ghost" onClick={()=>{setShowQuickSession(false);setQuickPages('');}}>Cancelar</Btn>
        </div>
      )}
      {/* Inline quick-add: quote */}
      {showQuickQuote && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18, padding:'14px 16px',
                      background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14 }}>
          <textarea autoFocus rows={2} placeholder="Pegá o escribí la cita..."
            value={quickQuoteText} onChange={e=>setQuickQuoteText(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, background:C.bgSurface, border:`1px solid ${C.border}`, color:C.ink1, fontSize:13, outline:'none', fontFamily:'inherit', resize:'vertical' }}/>
          <div style={{ display:'flex', gap:10 }}>
            <input placeholder="Página (opcional)" value={quickQuotePage} onChange={e=>setQuickQuotePage(e.target.value)}
              style={{ width:140, padding:'8px 12px', borderRadius:8, background:C.bgSurface, border:`1px solid ${C.border}`, color:C.ink1, fontSize:13, outline:'none' }}/>
            <Btn size="sm" onClick={saveQuickQuote}>Guardar cita</Btn>
            <Btn size="sm" variant="ghost" onClick={()=>{setShowQuickQuote(false);setQuickQuoteText('');setQuickQuotePage('');}}>Cancelar</Btn>
          </div>
        </div>
      )}

      {/* ── Datos contextuales — una sola línea quieta, no 3 cajas ── */}
      {book.status==='reading' && (
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'8px 20px',
                      marginBottom:20, paddingBottom:18, borderBottom:`1px solid ${C.border}`, fontSize:13, color:C.ink2 }}>
          <span style={{ fontFamily:C.fontMono, color:C.ink1 }}>{currentUnit}/{totalUnit} {unitLabel} <span style={{color:C.ink3}}>· {progress}%</span></span>
          <span style={{ width:120 }}><ProgressBar value={progress} color={isAudio?'#14B8A6':C.accent}/></span>
          {etaLabel && <span>Termina el <b style={{ color:C.xp, fontWeight:600 }}>{etaLabel}</b></span>}
          {pace>0 && <span>{pace} {isAudio?'min':'pág'}/día{paceDiffPct!==null && <span style={{color:paceDiffPct>=0?C.success:C.danger}}> ({paceDiffPct>=0?'+':''}{paceDiffPct}%)</span>}</span>}
          <span style={{ display:'inline-flex', gap:3, marginLeft:'auto' }}>
            {heatDays.map((v,i)=>{
              const lvl = heatLevel(v);
              const bg = lvl===0?C.border:lvl===1?'rgba(139,92,246,0.3)':lvl===2?'rgba(139,92,246,0.6)':'rgba(139,92,246,0.95)';
              return <span key={i} style={{ width:7, height:7, borderRadius:2, background:bg, display:'inline-block' }}/>;
            })}
          </span>
        </div>
      )}

      {book.status==='finished' && (
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'8px 20px',
                      marginBottom:20, paddingBottom:18, borderBottom:`1px solid ${C.border}`, fontSize:13, color:C.ink2 }}>
          {book.rating > 0 ? <Stars rating={book.rating} size={14}/> : <span style={{ color:C.ink4, fontStyle:'italic' }}>Sin calificar</span>}
          {book.end && <span>Terminado el {fmtDate(book.end)}</span>}
          {readDays && <span>en <b style={{ color:C.success, fontFamily:C.fontMono, fontWeight:600 }}>{readDays} días</b></span>}
          {xp>0 && <span style={{ color:C.xp }}>+{xp} XP</span>}
          {mainTag && <span>{books.filter(b=>b.status==='finished'&&b.tags.includes(mainTag)).length}º de {mainTag} este año</span>}
        </div>
      )}

      {(book.status==='planned' || book.status==='abandoned') && (
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'8px 20px',
                      marginBottom:20, paddingBottom:18, borderBottom:`1px solid ${C.border}`, fontSize:13, color:C.ink2 }}>
          {book.status==='planned' && daysInQueue!==null && <span>En tu lista hace {daysInQueue} días</span>}
          {book.status==='abandoned' && (
            <>
              <span style={{ fontFamily:C.fontMono }}>{currentUnit}/{totalUnit} {unitLabel} <span style={{color:C.ink3}}>· {progress}%</span></span>
              <span style={{ width:120 }}><ProgressBar value={progress} color={C.danger}/></span>
            </>
          )}
        </div>
      )}

      {/* ── Featured quote — elevated, not buried in a tab ── */}
      {featuredQuote && (
        <div style={{ borderRadius:14, padding:'20px 22px', marginBottom:20,
                       background:'linear-gradient(135deg, rgba(198,64,154,0.08), rgba(139,92,246,0.04))',
                       border:'1px solid rgba(198,64,154,0.25)' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
            <span style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',color:C.magenta,fontWeight:600 }}>✦ Última cita guardada</span>
            <a onClick={()=>setTab('quotes')} style={{ fontSize:11,color:C.ink3,cursor:'pointer' }}>Ver las {quoteList.length} citas →</a>
          </div>
          <p style={{ fontFamily:C.fontSerif,fontStyle:'italic',fontSize:17,color:C.ink1,lineHeight:1.5,marginBottom:8 }}>
            "{featuredQuote.text}"
          </p>
          {featuredQuote.page && <p style={{ fontSize:11,color:C.ink3,fontFamily:C.fontMono }}>{featuredQuote.page}</p>}
        </div>
      )}

      {/* ── Tags ── */}
      {book.tags.length > 0 && (
        <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:20 }}>
          {book.tags.map(tag=>(
            <a key={tag} href={`/themes#${tag}`}
              style={{ padding:'3px 10px',borderRadius:999,fontSize:11,
                        background:'var(--rx-accent-mid)',border:`1px solid color-mix(in srgb, ${C.accent} 30%, transparent)`,color:C.accent }}>
              {tag}
            </a>

          ))}
        </div>
      )}

      {/* ── Content — full width, no sidebar ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      <div className="fade-in" key={tab}
        style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:'22px 24px' }}>
        {tab==='quotes' && <QuoteBlock raw={book.quotes}/>}
        {tab==='characters' && <CharBlock raw={book.characters}/>}
        {tab==='notes' && (
          book.notes
            ? <p style={{ fontSize:14,color:C.ink2,lineHeight:1.8,whiteSpace:'pre-wrap' }}>{book.notes}</p>
            : <p style={{ color:C.ink3,fontStyle:'italic',fontSize:13 }}>Sin notas todavía.</p>
        )}
        {tab==='sessions' && <BookSessionLog bookId={book.id} totalPages={book.pages}/>}
      </div>

      {/* ── Related — horizontal shelf ── */}
      {related.length > 0 && (
        <div style={{ marginTop:36,paddingTop:20,borderTop:`1px solid ${C.border}` }}>
          <SectionTitle>Otros títulos</SectionTitle>
          <div style={{ display:'flex', overflowX:'auto', gap:16, paddingBottom:8 }}>
            {related.map(rel=>{
              const shared = rel.tags.filter(t=>book.tags.includes(t));
              return (
                <div key={rel.id} onClick={()=>navigate(`/books/${rel.id}`)} style={{ cursor:'pointer', width:120, flexShrink:0 }}>
                  <div style={{ aspectRatio:'2/3',borderRadius:14,overflow:'hidden',background:C.bgCard,
                                border:`1px solid ${C.border}`,
                                transition:'transform 0.2s,box-shadow 0.2s,border-color 0.2s' }}
                    onMouseEnter={e=>{
                      (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 16px rgba(0,0,0,0.3)';
                      (e.currentTarget as HTMLDivElement).style.borderColor=C.accent;
                    }}
                    onMouseLeave={e=>{
                      (e.currentTarget as HTMLDivElement).style.transform='none';
                      (e.currentTarget as HTMLDivElement).style.boxShadow='none';
                      (e.currentTarget as HTMLDivElement).style.borderColor=C.border;
                    }}>
                    <BookCover book={rel}/>
                  </div>
                  <p style={{ fontSize:11,fontWeight:500,color:C.ink2,marginTop:6,lineHeight:1.4,
                               overflow:'hidden',display:'-webkit-box',
                               WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>{rel.title}</p>
                  <p style={{ fontSize:10,color:C.ink4,marginTop:2 }}>{shared.slice(0,2).join(', ')}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EditModal book={book} open={showEdit} onClose={()=>setShowEdit(false)}/>
    </div>
  );
}
