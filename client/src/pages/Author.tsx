import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { C, Card, SectionTitle, Stars } from '../components/ui';
import { bookXP } from '../lib/xp';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { PIE_COLORS, CATEGORY_COLORS } from '../lib/colors';

// Generic default avatar — shown until the user uploads a custom photo/art for this author
function DefaultAuthorIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display:'block' }}>
      <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.12)"/>
      <circle cx="12" cy="9.5" r="3.6" fill="rgba(255,255,255,0.75)"/>
      <path d="M4.5 20c1.1-3.6 4.2-5.6 7.5-5.6s6.4 2 7.5 5.6" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function MiniCover({ book, size=52 }: { book: any; size?: number }) {
  const COLORS  = ['#1a1035','#0f1f1a','#1a0f0f','#0f1a2e','#1a150a','#150f1a','#0f1a1a'];
  const ACCENTS = CATEGORY_COLORS;
  const idx = Math.abs([...book.title].reduce((a:number,c:string)=>a+c.charCodeAt(0),0))%COLORS.length;
  if (book.cover) return <img src={book.cover} alt={book.title} style={{ width:size, height:size*1.5, objectFit:'cover', borderRadius:6, display:'block', boxShadow:'0 2px 8px rgba(0,0,0,0.3)' }} onError={e=>(e.currentTarget.style.display='none')}/>;
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 40 60" style={{ borderRadius:6, display:'block', boxShadow:'0 2px 8px rgba(0,0,0,0.3)', flexShrink:0 }}>
      <rect width="40" height="60" fill={COLORS[idx]}/>
      <text x="20" y="36" fill={ACCENTS[idx]} fontFamily="Georgia" fontSize="20" textAnchor="middle" opacity="0.7">{book.title[0]}</text>
    </svg>
  );
}

function StatBox({ label, value, color=C.accent }: { label:string; value:string|number; color?:string }) {
  return (
    <div style={{ textAlign:'center', padding:'14px 10px', borderRadius:12, background:C.bgSurface, border:`1px solid ${C.border}` }}>
      <p style={{ fontSize:24, fontWeight:600, color, fontFamily:C.fontMono, marginBottom:4 }}>{value}</p>
      <p style={{ fontSize:10, color:C.ink4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
    </div>
  );
}

// ── Parse best quote from book quotes field ───────────────────
function getBestQuote(book: any): string {
  if (!book.quotes) return '';
  const lines = book.quotes.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('> "') || t.startsWith("> '")) {
      const text = t.replace(/^> ["']/, '').replace(/["']$/, '');
      if (text.length > 10) return text;
    }
  }
  return '';
}

export default function AuthorPage() {
  const { authorSlug } = useParams<{ authorSlug: string }>();
  const books    = useStore(s => s.books);
  const authorAvatars       = useStore(s => s.authorAvatars);
  const uploadAuthorAvatar  = useStore(s => s.uploadAuthorAvatar);
  const deleteAuthorAvatar  = useStore(s => s.deleteAuthorAvatar);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Decode author name from URL slug
  const authorName = decodeURIComponent(authorSlug || '');

  const authorBooks = useMemo(() =>
    books.filter(b => b.author === authorName).sort((a,b)=>(b.end||b.createdAt||'').localeCompare(a.end||a.createdAt||'')),
  [books, authorName]);

  const finished   = authorBooks.filter(b => b.status === 'finished');
  const reading    = authorBooks.filter(b => b.status === 'reading');
  const planned    = authorBooks.filter(b => b.status === 'planned');
  const rated      = finished.filter(b => b.rating > 0);
  const avgRating  = rated.length ? (rated.reduce((a,b)=>a+b.rating,0)/rated.length) : 0;
  const totalPages = finished.reduce((a,b)=>a+b.pages,0);
  const totalXP    = authorBooks.reduce((a,b)=>a+bookXP(b),0);

  // Genre distribution
  const genreCounts: Record<string,number> = {};
  authorBooks.forEach(b => b.tags?.forEach((t:string) => { genreCounts[t]=(genreCounts[t]||0)+1; }));
  const topGenres = Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);

  // Best quotes across all books
  const quotes = authorBooks.flatMap(b => {
    const q = getBestQuote(b);
    return q ? [{ text:q, book:b }] : [];
  }).slice(0,4);

  // Display name (Apellido, Nombre → Nombre Apellido)
  const displayName = authorName.includes(',')
    ? authorName.split(',').reverse().join(' ').trim()
    : authorName;
  useDocumentTitle(displayName || 'Autor no encontrado');

  const avatarUrl = authorAvatars[authorName];

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await uploadAuthorAvatar(authorName, file);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setUploading(true);
    try {
      await deleteAuthorAvatar(authorName);
    } finally {
      setUploading(false);
    }
  }

  if (authorBooks.length === 0) {
    return (
      <div style={{ maxWidth:800, margin:'0 auto', padding:'32px 28px', textAlign:'center' }}>
        <p style={{ fontSize:16, color:C.ink3, marginBottom:12 }}>No encontré libros de "{authorName}"</p>
        <button onClick={()=>navigate(-1)} style={{ color:C.accent, background:'none', border:'none', cursor:'pointer', fontSize:13 }}>← Volver</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 28px 80px' }}>
      {/* Back */}
      <button onClick={()=>navigate(-1)}
        style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:C.ink3, fontSize:13, marginBottom:24, padding:0 }}>
        ← Volver
      </button>

      {/* Author header */}
      <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:28 }}>
        <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${C.accent},#4C3A99)`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', boxShadow:`0 0 24px color-mix(in srgb, ${C.accent} 25%, transparent)`, opacity:uploading?0.5:1, transition:'opacity 0.15s' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <DefaultAuthorIcon size={40}/>}
          </div>
          <button onClick={()=>fileInputRef.current?.click()} title={avatarUrl ? 'Cambiar foto' : 'Subir foto'}
            disabled={uploading}
            style={{ position:'absolute', bottom:-2, right:-2, width:26, height:26, borderRadius:'50%',
                      background:C.bgCard, border:`2px solid ${C.bgBase}`, cursor:uploading?'default':'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', color:C.ink2, boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFile} style={{ display:'none' }}/>
        </div>
        <div>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.ink3, marginBottom:4 }}>AUTOR</p>
          <h1 style={{ fontFamily:C.fontSerif, fontSize:32, color:C.ink1, marginBottom:4 }}>{displayName}</h1>
          <p style={{ fontSize:13, color:C.ink3 }}>
            {authorBooks.length} libro{authorBooks.length!==1?'s':''} en tu biblioteca
            {finished.length > 0 ? ` · ${finished.length} terminados` : ''}
          </p>
          {avatarUrl && (
            <button onClick={handleRemoveAvatar} disabled={uploading}
              style={{ fontSize:11, color:C.ink4, background:'none', border:'none', cursor:uploading?'default':'pointer', padding:0, marginTop:4, textDecoration:'underline' }}>
              Quitar foto personalizada
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        <StatBox label="Libros terminados" value={finished.length} color={C.success}/>
        <StatBox label="Páginas leídas" value={totalPages.toLocaleString('es')} color={C.accent}/>
        <StatBox label="Rating promedio" value={avgRating>0?`${avgRating.toFixed(1)} ★`:'—'} color={C.xp}/>
        <StatBox label="XP ganados" value={`+${totalXP.toLocaleString('es')}`} color='#FFB84D'/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        {/* Books list */}
        <div>
          {reading.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:11, fontWeight:600, color:'#3B82F6', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Leyendo ahora</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {reading.map(b=>(
                  <div key={b.id} onClick={()=>navigate(`/books/${b.id}`)}
                    style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 12px', borderRadius:10, background:C.bgSurface, border:`1px solid ${'#3B82F6'}30`, cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#3B82F6';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=`${'#3B82F6'}30`;}}>
                    <MiniCover book={b} size={36}/>
                    <div style={{ minWidth:0, flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:500, color:C.ink1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</p>
                      <p style={{ fontSize:11, color:C.ink3, marginTop:2, fontFamily:C.fontMono }}>{b.pagesRead}/{b.pages} pág.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finished.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:11, fontWeight:600, color:C.success, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Terminados</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {finished.map(b=>(
                  <div key={b.id} onClick={()=>navigate(`/books/${b.id}`)}
                    style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 12px', borderRadius:10, background:C.bgCard, border:`1px solid ${C.border}`, cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=C.bgHover;}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=C.bgCard;}}>
                    <MiniCover book={b} size={36}/>
                    <div style={{ minWidth:0, flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:500, color:C.ink1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</p>
                      {b.end && <p style={{ fontSize:11, color:C.ink3, marginTop:2 }}>{b.end.split('-').reverse().join('/')}</p>}
                    </div>
                    {b.rating>0 && <Stars rating={b.rating} size={10}/>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {planned.length > 0 && (
            <div>
              <p style={{ fontSize:11, fontWeight:600, color:C.ink4, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Pendientes</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {planned.map(b=>(
                  <div key={b.id} onClick={()=>navigate(`/books/${b.id}`)}
                    style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 10px', borderRadius:8, background:C.bgSurface, border:`1px solid ${C.border}`, cursor:'pointer' }}>
                    <MiniCover book={b} size={24}/>
                    <p style={{ fontSize:12, color:C.ink3, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: genres + quotes */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {topGenres.length > 0 && (
            <Card>
              <SectionTitle>Géneros</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:10 }}>
                {topGenres.map(([genre, count], i) => (
                  <div key={genre} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:C.ink2, flex:1 }}>{genre}</span>
                    <span style={{ fontSize:11, color:C.ink4, fontFamily:C.fontMono }}>{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Year timeline */}
          {finished.length > 0 && (() => {
            const byYear: Record<string,number> = {};
            finished.forEach(b => { if (b.end) { const y=b.end.slice(0,4); byYear[y]=(byYear[y]||0)+1; } });
            const years = Object.entries(byYear).sort((a,b)=>a[0].localeCompare(b[0]));
            if (years.length < 2) return null;
            return (
              <Card>
                <SectionTitle>Por año</SectionTitle>
                <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
                  {years.map(([year, count]) => (
                    <div key={year} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, color:C.ink4, fontFamily:C.fontMono, width:36 }}>{year}</span>
                      <div style={{ flex:1, height:6, borderRadius:3, background:C.bgSurface, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:3, background:C.accent, width:`${(count/Math.max(...years.map(([,c])=>c)))*100}%` }}/>
                      </div>
                      <span style={{ fontSize:11, color:C.ink3, fontFamily:C.fontMono, width:16, textAlign:'right' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* Quotes */}
      {quotes.length > 0 && (
        <Card>
          <SectionTitle>Citas destacadas</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12, marginTop:14 }}>
            {quotes.map((q, i)=>(
              <div key={i} onClick={()=>navigate(`/books/${q.book.id}`)}
                style={{ padding:'16px 18px', borderRadius:12, background:`linear-gradient(135deg,rgba(139,92,246,0.06),transparent)`, border:`1px solid rgba(139,92,246,0.15)`, cursor:'pointer', position:'relative', overflow:'hidden' }}>
                <span style={{ position:'absolute',top:8,right:12,fontSize:36,color:C.accent,opacity:0.06,fontFamily:'Georgia' }}>"</span>
                <p style={{ fontFamily:C.fontSerif, fontSize:13, color:C.ink1, fontStyle:'italic', lineHeight:1.6, marginBottom:10 }}>"{q.text.slice(0,140)}{q.text.length>140?'…':''}"</p>
                <p style={{ fontSize:11, color:C.ink3 }}>— {q.book.title}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
