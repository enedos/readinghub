import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { usePersistedState } from '../lib/usePersistedState';
import { C, Card } from '../components/ui';
import { calcAchievements, RARITY_CONFIG, inferUnlockDate } from '../lib/achievements';
import { AchievementBadge } from '../components/AchievementBadge';
import { PIE_COLORS, CATEGORY_COLORS } from '../lib/colors';

// ── Helpers ───────────────────────────────────────────────────
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];


function fmtDate(s: string) {
  if (!s) return '';
  const [y,m,d] = s.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`;
}

// ── Book cover mini ───────────────────────────────────────────
function MiniCover({ book, size=56 }: { book: any; size?: number }) {
  const [err, setErr] = useState(false);
  const COLORS  = ['#1a1035','#0f1f1a','#1a0f0f','#0f1a2e','#1a150a','#150f1a','#0f1a1a'];
  const ACCENTS = CATEGORY_COLORS;
  const idx = Math.abs([...book.title].reduce((a:number,c:string)=>a+c.charCodeAt(0),0)) % COLORS.length;

  if (book.cover && !err) {
    return <img src={book.cover} alt={book.title} onError={()=>setErr(true)}
      style={{ width:size, height:size*1.5, objectFit:'cover', borderRadius:6, display:'block' }}/>;
  }
  return (
    <svg width={size} height={size*1.5} viewBox="0 0 40 60" style={{ borderRadius:6, display:'block' }}>
      <rect width="40" height="60" fill={COLORS[idx]}/>
      <text x="20" y="36" fill={ACCENTS[idx]} fontFamily="Georgia" fontSize="20" textAnchor="middle" opacity="0.7">
        {book.title[0]}
      </text>
    </svg>
  );
}

// ── Per-year data computation ─────────────────────────────────
function useYearlyData(books: any[]) {
  return useMemo(() => {
    const finished = books.filter(b => b.status === 'finished' && b.end);
    if (finished.length === 0) return [];

    const byYear: Record<string, any[]> = {};
    finished.forEach(b => {
      const y = b.end.slice(0,4);
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(b);
    });

    const years = Object.keys(byYear).sort();
    const allYearsBooks = finished.length;

    return years.map((year, yi) => {
      const yBooks = byYear[year];
      const pages  = yBooks.reduce((a,b) => a + b.pages, 0);
      const rated  = yBooks.filter(b => b.rating > 0);
      const avgRat = rated.length ? (rated.reduce((a,b)=>a+b.rating,0)/rated.length) : 0;

      // Best book: highest rating, then most pages
      const best = [...yBooks].sort((a,b) => (b.rating-a.rating)||((b.pages||0)-(a.pages||0)))[0];

      // Top genre
      const genreCounts: Record<string,number> = {};
      yBooks.forEach(b => b.tags?.forEach((t:string) => { genreCounts[t]=(genreCounts[t]||0)+1; }));
      const topGenre = Object.entries(genreCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';
      const genreColor = topGenre
        ? PIE_COLORS[Math.abs([...topGenre].reduce((a,c)=>a+c.charCodeAt(0),0)) % PIE_COLORS.length]
        : '#8B5CF6';

      // Monthly heatmap
      const monthCounts = Array(12).fill(0);
      yBooks.forEach(b => { const m = parseInt(b.end.slice(5,7))-1; monthCounts[m]++; });
      const maxMonth = Math.max(...monthCounts, 1);

      // Narrative sentence
      const prevYear = yi > 0 ? byYear[years[yi-1]] : null;
      let narrative = '';
      if (yi === 0) {
        narrative = `Así comenzó todo. ${yBooks.length} libro${yBooks.length>1?'s':''} en tu primer año.`;
      } else if (prevYear && yBooks.length > prevYear.length) {
        narrative = `Tu año más activo hasta ese momento. ${yBooks.length} libros, superando los ${prevYear.length} del año anterior.`;
      } else if (prevYear && yBooks.length < prevYear.length) {
        narrative = `Un año más pausado, pero con ${yBooks.length} libro${yBooks.length>1?'s':''} que dejaron huella.`;
      } else {
        narrative = `Constante y dedicado. ${yBooks.length} libro${yBooks.length>1?'s':''}, ${pages.toLocaleString('es')} páginas.`;
      }

      // First book ever
      const firstEver = yi === 0
        ? finished.sort((a,b) => (a.end||'').localeCompare(b.end||''))[0]
        : null;

      return { year, books: yBooks, pages, avgRat, best, topGenre, genreColor,
               monthCounts, maxMonth, narrative, firstEver, isFirst: yi===0,
               isLast: yi === years.length-1 };
    }).reverse(); // newest first
  }, [books]);
}

// ── Timeline view ─────────────────────────────────────────────
function TimelineView({ data, achsByYear = {} }: { data: any[]; achsByYear?: Record<string, any[]> }) {
  const navigate = useNavigate();
  if (data.length === 0) return (
    <div style={{ textAlign:'center', padding:'60px 24px', color:C.ink3 }}>
      <p style={{ fontSize:40, marginBottom:16 }}>📖</p>
      <p style={{ fontSize:16, color:C.ink2 }}>Tu historia lectora está por empezar.</p>
      <p style={{ fontSize:13, marginTop:8 }}>Terminá tu primer libro para ver tu recorrido aquí.</p>
    </div>
  );

  return (
    <div style={{ position:'relative', paddingLeft:48 }}>
      {/* Vertical line */}
      <div style={{ position:'absolute', left:16, top:0, bottom:0, width:2,
                     background:`linear-gradient(to bottom, ${C.accent}, ${C.border})`,
                     borderRadius:999 }}/>

      {data.map((d, i) => (
        <div key={d.year} className="fade-in" style={{ position:'relative', marginBottom:48 }}>
          {/* Year node */}
          <div style={{
            position:'absolute', left:-40, top:4,
            width:28, height:28, borderRadius:'50%',
            background: d.isFirst ? C.accent : d.isLast ? C.xp : C.bgCard,
            border:`2px solid ${d.isFirst||d.isLast ? C.accent : C.border}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:10, fontWeight:700, color: d.isFirst||d.isLast ? C.onAccent : C.ink3,
            fontFamily:C.fontMono, zIndex:1,
          }}>
            {d.isFirst ? '★' : d.isLast ? '◉' : d.year.slice(2)}
          </div>

          {/* Card */}
          <Card style={{ borderColor: d.isFirst ? `color-mix(in srgb, ${C.accent} 25%, transparent)` : undefined }}>
            {/* Special first book banner */}
            {d.firstEver && (
              <div style={{ marginBottom:16, padding:'12px 14px', borderRadius:10,
                             background:`rgba(139,92,246,0.08)`, border:`1px solid color-mix(in srgb, ${C.accent} 19%, transparent)`,
                             display:'flex', alignItems:'center', gap:14 }}>
                <MiniCover book={d.firstEver} size={44}/>
                <div>
                  <p style={{ fontSize:10, fontWeight:600, color:C.accent,
                               textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>
                    El libro que empezó todo
                  </p>
                  <p style={{ fontSize:14, fontWeight:600, color:C.ink1 }}>{d.firstEver.title}</p>
                  <p style={{ fontSize:12, color:C.ink3 }}>
                    {d.firstEver.author} · {fmtDate(d.firstEver.end)}
                  </p>
                </div>
              </div>
            )}

            {/* Year header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                           marginBottom:14, gap:12, flexWrap:'wrap' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <h2 style={{ fontFamily:C.fontSerif, fontSize:28, color:C.ink1 }}>
                    {d.year}
                  </h2>
                  {d.isLast && (
                    <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:999,
                                    background:`color-mix(in srgb, ${C.success} 8%, transparent)`, color:C.success, border:`1px solid color-mix(in srgb, ${C.success} 19%, transparent)` }}>
                      En curso
                    </span>
                  )}
                </div>
                <p style={{ fontSize:13, color:C.ink3, fontStyle:'italic' }}>{d.narrative}</p>
              </div>
              {/* Stats row */}
              <div style={{ display:'flex', gap:16, flexShrink:0 }}>
                {[
                  { label:'libros', value:d.books.length, color:C.accent },
                  { label:'páginas', value:d.pages.toLocaleString('es'), color:C.success },
                  { label:'rating', value:d.avgRat>0?d.avgRat.toFixed(1):'—', color:C.xp },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center' }}>
                    <p style={{ fontSize:22, fontWeight:600, color:s.color, fontFamily:C.fontMono, lineHeight:1 }}>
                      {s.value}
                    </p>
                    <p style={{ fontSize:10, color:C.ink4, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rx-journey-triple" style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:16, alignItems:'start' }}>
              {/* Best book */}
              {d.best && (
                <div onClick={() => navigate(`/books/${d.best.id}`)}
                  style={{ cursor:'pointer', flexShrink:0 }}
                  title={d.best.title}>
                  <MiniCover book={d.best} size={48}/>
                  <p style={{ fontSize:9, color:C.ink4, marginTop:4, textAlign:'center', maxWidth:48,
                               overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    destacado
                  </p>
                </div>
              )}

              {/* Heatmap + genre */}
              <div>
                {/* Monthly heatmap */}
                <div style={{ display:'flex', gap:4, marginBottom:10, alignItems:'flex-end' }}>
                  {d.monthCounts.map((count: number, mi: number) => (
                    <div key={mi} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <div style={{
                        width:16, height:Math.max(4, (count/d.maxMonth)*40),
                        borderRadius:3,
                        background: count>0 ? C.accent : C.border,
                        opacity: count>0 ? (0.4 + (count/d.maxMonth)*0.6) : 1,
                        transition:'all 0.3s',
                      }} title={`${MONTHS[mi]}: ${count} libro${count!==1?'s':''}`}/>
                      <span style={{ fontSize:8, color:C.ink4 }}>{MONTHS[mi][0]}</span>
                    </div>
                  ))}
                </div>

                {/* Top genre */}
                {d.topGenre && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:d.genreColor, flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:C.ink3 }}>
                      Género dominante: <strong style={{ color:C.ink2 }}>{d.topGenre}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Books mini shelf */}
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', maxWidth:140, justifyContent:'flex-end' }}>
                {d.books.slice(0,6).map((b: any) => (
                  <div key={b.id} onClick={() => navigate(`/books/${b.id}`)}
                    style={{ cursor:'pointer', opacity:0.85, transition:'opacity 0.2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                    onMouseLeave={e=>(e.currentTarget.style.opacity='0.85')}>
                    <MiniCover book={b} size={32}/>
                  </div>
                ))}
                {d.books.length > 6 && (
                  <div style={{ width:32, height:48, borderRadius:6, background:C.bgSurface,
                                 border:`1px solid ${C.border}`, display:'flex', alignItems:'center',
                                 justifyContent:'center', fontSize:11, color:C.ink3 }}>
                    +{d.books.length-6}
                  </div>
                )}
              </div>
            </div>
            {/* Badges earned this year */}
            {achsByYear[d.year] && achsByYear[d.year].length > 0 && (
              <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                <p style={{ fontSize:10, fontWeight:600, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Logros desbloqueados</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {achsByYear[d.year].map((a: any) => {
                    const cfg = RARITY_CONFIG[a.rarity];
                    return (
                      <div key={a.id} title={a.title}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:8, background:`${cfg.color}10`, border:`1px solid ${cfg.color}30` }}>
                        <AchievementBadge rarity={a.rarity} category={a.category} unlocked size={20}/>
                        <span style={{ fontSize:10, color:cfg.color, fontWeight:600, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}

// ── Magazine view ─────────────────────────────────────────────
function MagazineView({ data }: { data: any[] }) {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  if (data.length === 0) return null;

  const d = data[idx];
  const hasCover = d.best?.cover;

  return (
    <div style={{ position:'relative' }}>
      {/* Magazine card */}
      <div style={{
        borderRadius:20, overflow:'hidden',
        minHeight:480, position:'relative',
        background: '#0D0D1F',
        boxShadow:'0 24px 64px rgba(0,0,0,0.5), 0 0 50px rgba(139,92,246,0.15)',
      }}>
        {/* Background — only blur if it's a real photo cover (not SVG placeholder) */}
        {hasCover && (
          <img src={d.best.cover} alt="" style={{
            position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', filter:'blur(3px) brightness(0.28) saturate(0.8)',
          }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }}/>
        )}
        {/* Decorative gradient overlay — always shown on top of photo or instead of it */}
        <div style={{
          position:'absolute', inset:0,
          background: hasCover
            ? 'linear-gradient(135deg, rgba(10,8,28,0.7) 0%, rgba(5,5,18,0.85) 100%)'
            : `linear-gradient(135deg, #0D0820 0%, #0A1525 40%, #0D1A10 100%)`,
        }}/>
        {/* Decorative geometric accent */}
        <div style={{
          position:'absolute', top:-80, right:-80, width:320, height:320,
          borderRadius:'50%',
          background: `radial-gradient(circle, ${d.genreColor || '#8B5CF6'}18 0%, transparent 70%)`,
          pointerEvents:'none',
        }}/>
        <div style={{
          position:'absolute', bottom:-40, left:-40, width:200, height:200,
          borderRadius:'50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          pointerEvents:'none',
        }}/>

        {/* Content overlay */}
        <div className="rx-journey-row rx-journey-hero-pad" style={{ position:'relative', zIndex:1, padding:'48px 40px', display:'grid',
                       gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'center', minHeight:480 }}>
          {/* Left */}
          <div>
            <p style={{ fontSize:11, fontWeight:600, color:C.accent, letterSpacing:'0.14em',
                         textTransform:'uppercase', marginBottom:12 }}>
              {d.isFirst ? 'El comienzo' : d.isLast ? 'En curso' : 'Capítulo'}
            </p>
            <h2 style={{ fontFamily:C.fontSerif, fontSize:'clamp(40px, 14vw, 72px)', fontWeight:700,
                          color:C.onAccent, lineHeight:1, marginBottom:16 }}>
              {d.year}
            </h2>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.7)', fontStyle:'italic',
                         lineHeight:1.6, marginBottom:24, maxWidth:320 }}>
              {d.narrative}
            </p>

            {/* Stats */}
            <div style={{ display:'flex', gap:24, marginBottom:24 }}>
              {[
                { n:d.books.length, l:'libros', c:C.accent },
                { n:d.pages.toLocaleString('es'), l:'páginas', c:C.success },
                { n:d.avgRat>0?d.avgRat.toFixed(1):'—', l:'rating', c:C.xp },
              ].map(s=>(
                <div key={s.l}>
                  <p style={{ fontSize:28, fontWeight:700, color:s.c, fontFamily:C.fontMono, lineHeight:1 }}>{s.n}</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Heatmap */}
            <div style={{ display:'flex', gap:3, alignItems:'flex-end' }}>
              {d.monthCounts.map((count: number, mi: number) => (
                <div key={mi} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{
                    width:14, height:Math.max(3, (count/d.maxMonth)*32), borderRadius:2,
                    background:count>0?C.accent:'rgba(255,255,255,0.1)',
                    opacity:count>0?(0.4+(count/d.maxMonth)*0.6):1,
                  }}/>
                  <span style={{ fontSize:7, color:'rgba(255,255,255,0.3)' }}>{MONTHS[mi][0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: book covers */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:16 }}>
            {/* Featured book */}
            {d.best && (
              <div onClick={() => navigate(`/books/${d.best.id}`)}
                style={{ cursor:'pointer', textAlign:'right' }}>
                <div style={{ marginBottom:8 }}>
                  <MiniCover book={d.best} size={90}/>
                </div>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase',
                             letterSpacing:'0.08em', marginBottom:3 }}>Destacado</p>
                <p style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.9)',
                             maxWidth:160, textAlign:'right', lineHeight:1.3 }}>{d.best.title}</p>
              </div>
            )}

            {/* Rest of books */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'flex-end', maxWidth:200 }}>
              {d.books.filter((b:any)=>b.id!==d.best?.id).slice(0,8).map((b:any) => (
                <div key={b.id} onClick={() => navigate(`/books/${b.id}`)}
                  style={{ cursor:'pointer', opacity:0.7, transition:'opacity 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                  onMouseLeave={e=>(e.currentTarget.style.opacity='0.7')}>
                  <MiniCover book={b} size={36}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginTop:20 }}>
        <button onClick={() => setIdx(i => Math.min(i+1, data.length-1))} disabled={idx >= data.length-1}
          style={{ width:40, height:40, borderRadius:'50%', border:`1px solid ${C.border}`,
                    background:'transparent', color:idx>=data.length-1?C.ink4:C.ink1,
                    cursor:idx>=data.length-1?'default':'pointer', fontSize:18 }}>
          ←
        </button>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {data.map((_,i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width:i===idx?24:8, height:8, borderRadius:999, border:'none', cursor:'pointer',
                        background:i===idx?C.accent:C.border, transition:'all 0.2s', padding:0 }}/>
          ))}
        </div>
        <button onClick={() => setIdx(i => Math.max(i-1, 0))} disabled={idx <= 0}
          style={{ width:40, height:40, borderRadius:'50%', border:`1px solid ${C.border}`,
                    background:'transparent', color:idx<=0?C.ink4:C.ink1,
                    cursor:idx<=0?'default':'pointer', fontSize:18 }}>
          →
        </button>
      </div>

      {/* Year indicator */}
      <p style={{ textAlign:'center', fontSize:12, color:C.ink4, marginTop:8, fontFamily:C.fontMono }}>
        {d.year} · {idx+1} de {data.length}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function JourneyPage() {
  const books   = useStore(s => s.books);
  const settings = useStore(s => s.settings);
  const customAchievements = useStore(s => s.customAchievements);
  const achievementOverrides = useStore(s => s.achievementOverrides);
  const [view, setView] = usePersistedState<'timeline'|'magazine'>('journey-view', 'timeline');
  const data = useYearlyData(books);

  // Compute unlocked achievements with overrides
  const allAchievements = useMemo(() => {
    const base = calcAchievements(books).map(a => {
      const ov = achievementOverrides.find(o => o.id === a.id);
      return ov ? { ...a, unlocked: ov.manualUnlock ? true : a.unlocked } : a;
    });
    return [
      ...base.filter(a => a.unlocked),
      ...customAchievements.filter((a: any) => a.unlocked),
    ];
  }, [books, customAchievements, achievementOverrides]);

  // Group achievements by unlock year (manual override date takes priority,
  // otherwise infer it from the books that earned it — same helper used on
  // the Dashboard feed. Without this fallback, almost nothing ever showed up
  // here since most achievements never get a manual override date.)
  const achsByYear = useMemo(() => {
    const map: Record<string, any[]> = {};
    allAchievements.forEach(a => {
      const ov = achievementOverrides.find(o => o.id === a.id);
      const year = ov?.unlockDate ? ov.unlockDate.slice(0,4) : inferUnlockDate(a.id, books)?.slice(0,4);
      if (year) { if (!map[year]) map[year] = []; map[year].push(a); }
    });
    return map;
  }, [allAchievements, achievementOverrides, books]);

  const finished = books.filter(b => b.status==='finished');
  const totalPages = finished.reduce((a,b)=>a+b.pages,0);
  const firstBook  = finished.length > 0
    ? finished.sort((a,b)=>(a.end||'').localeCompare(b.end||''))[0]
    : null;
  const yearsActive = data.length;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 28px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase',
                     color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>
          NARRATIVA
        </p>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:C.fontSans, fontSize:32, fontWeight:700, color:C.ink1, marginBottom:16, position:'relative', display:'inline-block' }}>
              Mi Recorrido
              <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                             background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
            </h1>
            <p style={{ fontSize:14, color:C.ink3 }}>
              {yearsActive > 0
                ? `${yearsActive} ${yearsActive===1?'año':'años'} leyendo · ${finished.length} libros · ${totalPages.toLocaleString('es')} páginas`
                : 'Tu historia lectora, año a año'}
            </p>
          </div>

          {/* View toggle */}
          <div style={{ display:'flex', gap:3, background:C.bgCard, borderRadius:10,
                         padding:3, border:`1px solid ${C.border}` }}>
            {[
              { v:'timeline' as const, label:'Línea de tiempo', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> },
              { v:'magazine' as const, label:'Revista', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></svg> },
            ].map(({v,label,icon}) => (
              <button key={v} onClick={() => setView(v)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', cursor:'pointer',
                          fontSize:12, fontWeight:500, transition:'all 0.2s',
                          background:view===v?C.accent:'transparent',
                          color:view===v?C.onAccent:C.ink3 }}>
                <span style={{ width:14, height:14, display:'block' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global summary */}
      {firstBook && (
        <div style={{ marginBottom:32, padding:'16px 20px', borderRadius:14,
                       background:`rgba(139,92,246,0.06)`, border:`1px solid color-mix(in srgb, ${C.accent} 15%, transparent)`,
                       display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <MiniCover book={firstBook} size={48}/>
          <div style={{ flex:1, minWidth:200 }}>
            <p style={{ fontSize:11, fontWeight:600, color:C.accent, letterSpacing:'0.08em',
                         textTransform:'uppercase', marginBottom:3 }}>
              Tu primer libro
            </p>
            <p style={{ fontSize:15, fontWeight:600, color:C.ink1 }}>{firstBook.title}</p>
            <p style={{ fontSize:12, color:C.ink3 }}>{firstBook.author} · {fmtDate(firstBook.end)}</p>
          </div>
          <div style={{ display:'flex', gap:24 }}>
            {[
              { n:finished.length, l:'libros totales' },
              { n:yearsActive,     l:`año${yearsActive!==1?'s':''} leyendo` },
            ].map(s=>(
              <div key={s.l} style={{ textAlign:'center' }}>
                <p style={{ fontSize:24, fontWeight:600, color:C.ink1, fontFamily:C.fontMono }}>{s.n}</p>
                <p style={{ fontSize:11, color:C.ink4 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Views */}
      {view === 'timeline'  && <TimelineView  data={data} achsByYear={achsByYear}/>}
      {view === 'magazine'  && <MagazineView  data={data}/>}
    </div>
  );
}
