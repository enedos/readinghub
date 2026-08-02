import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { totalXP, levelInfo, topTags, ratingDist, streakMonths, activeChallenges } from '../lib/xp';
import { calcAchievements, inferUnlockDate } from '../lib/achievements';
import { PIE_COLORS, CATEGORY_COLORS } from '../lib/colors';
import { C, Card, SectionTitle, XPBar, ProgressBar } from '../components/ui';
import { Mascot } from '../components/Mascot';
import { ReadingHeatmap } from '../components/SessionTracker';


// ── Quick session inline button ───────────────────────────────
function QuickSessionBtn({ bookId }: { bookId: string }) {
  const addSession = useStore((s: any) => s.addSession);
  const [pages, setPages] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    const n = parseInt(pages);
    if (!n || n < 1) return;
    setSaving(true);
    try {
      await addSession({ bookId, date: new Date().toISOString().slice(0,10), pages: n, notes: '' });
      setPages(''); setOpen(false);
    } finally { setSaving(false); }
  }

  if (open) return (
    <div style={{ display:'flex', gap:6, marginTop:8, alignItems:'center' }}>
      <input type="number" min={1} value={pages} onChange={e=>setPages(e.target.value)}
        placeholder="páginas" autoFocus
        onKeyDown={e=>{ if(e.key==='Enter') save(); if(e.key==='Escape') setOpen(false); }}
        style={{ width:80, padding:'4px 8px', borderRadius:7, fontSize:12, border:`1px solid color-mix(in srgb, var(--rx-info) 50%, transparent)`, background:'var(--rx-bg-surface)', color:'var(--rx-ink1)', outline:'none' }}/>
      <button onClick={save} disabled={saving||!pages}
        style={{ padding:'4px 10px', borderRadius:7, background:'var(--rx-info)', border:'none', color:C.onAccent, fontSize:11, cursor:'pointer', opacity:!pages||saving?0.5:1 }}>
        {saving?'…':'✓'}
      </button>
      <button onClick={()=>setOpen(false)}
        style={{ padding:'4px 8px', borderRadius:7, background:'transparent', border:`1px solid var(--rx-border)`, color:'var(--rx-ink3)', fontSize:11, cursor:'pointer' }}>✕</button>
    </div>
  );

  return (
    <button onClick={()=>setOpen(true)}
      style={{ marginTop:8, padding:'4px 10px', borderRadius:7, border:`1px solid color-mix(in srgb, var(--rx-info) 50%, transparent)`, background:'transparent', color:'var(--rx-info)', fontSize:11, cursor:'pointer', transition:'all 0.15s', width:'fit-content' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--rx-info-mid)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';}}>
      + Registrar sesión
    </button>
  );
}

export default function DashboardPage() {
  const books             = useStore(s => s.books);
  const sessions          = useStore((s: any) => s.sessions || []);
  const customChallenges    = useStore(s => s.customChallenges) || [];
  const challengeOverrides  = useStore(s => s.challengeOverrides) || [];
  const settings   = useStore(s => s.settings);
  const customLevels = useStore(s => s.customLevels);
  const navigate   = useNavigate();
  const year       = new Date().getFullYear();
  const monthKey   = `${year}-${String(new Date().getMonth()+1).padStart(2,'0')}`;

  const finished   = books.filter(b => b.status === 'finished');
  const reading    = books.filter(b => b.status === 'reading');
  const xp         = totalXP(books);
  const lv         = levelInfo(xp, customLevels);
  const streak     = streakMonths(books);
  const topGenreLabel = topTags(reading.length ? reading : books, 1)[0]?.[0];
  const topGenreColor = topGenreLabel
    ? CATEGORY_COLORS[Math.abs([...topGenreLabel].reduce((a,c)=>a+c.charCodeAt(0),0)) % CATEGORY_COLORS.length]
    : undefined;
  const achiev     = calcAchievements(books);
  const challenges = activeChallenges(books, settings.yearlyGoal).map(ch => {
    const ov = challengeOverrides.find((o: any) => o.id === ch.id);
    if (!ov) return ch;
    if (ov.enabled === false) return null;
    return { ...ch, target: ov.target ?? ch.target, title: ov.title ?? ch.title };
  }).filter(Boolean);
  const thisYear   = finished.filter(b => b.end?.startsWith(String(year)));
  const yearGoal   = settings.yearlyGoal;
  const yearPct    = Math.min(Math.round((thisYear.length / yearGoal) * 100), 100);

  const tags       = topTags(books, 6);
  const maxTag     = tags[0]?.[1] || 1;
  const ratings    = ratingDist(books);
  const ratedBooks = finished.filter(b=>b.rating>0);
  const avgRating  = ratedBooks.length ? (ratedBooks.reduce((a,b)=>a+b.rating,0)/ratedBooks.length).toFixed(1) : '—';
  const genrePie   = tags.map(([name, value]) => ({ name, value }));

  function fmt(s: string) {
    if (!s) return '';
    const [,m,d] = s.split('-');
    return `${parseInt(d)} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][parseInt(m)-1]}`;
  }

  const recentBooks = [...finished].filter(b=>b.end).sort((a,b)=>(b.end||'').localeCompare(a.end||'')).slice(0,5);

  type FeedItem = { date:string; type:'finished'|'achievement'|'started'; title:string; sub?:string };
  const achievementFeed: FeedItem[] = [];
  achiev.filter(a => a.unlocked).forEach(a => {
    const d = inferUnlockDate(a.id, books);
    if (d) achievementFeed.push({ date:d, type:'achievement', title:a.title });
  });
  const feedItems: FeedItem[] = [
    ...recentBooks.map(b=>({ date:b.end as string, type:'finished' as const, title:b.title, sub: b.rating>0?`${b.rating} ★`:undefined })),
    ...achievementFeed,
    ...books.filter(b=>b.status==='reading' && b.start).map(b=>({ date:b.start as string, type:'started' as const, title:b.title })),
  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);

  const FEED_ICON = { finished:'✓', achievement:'🏆', started:'📖' };
  const FEED_BG    = { finished:'rgba(34,197,94,0.12)', achievement:'rgba(255,184,77,0.12)', started:'var(--rx-accent-mid)' };
  const FEED_VERB  = { finished:'Terminaste', achievement:'Desbloqueaste', started:'Empezaste' };

  // Merge system challenges + custom challenges into one list
  const allChallenges = [
    ...challenges.map(ch => ({ ...ch, custom:false })),
    ...customChallenges.map((ch: any) => ({ ...ch, current: ch.current ?? 0, completed: (ch.current ?? 0) >= ch.target, custom:true })),
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink3, marginBottom: 6 }}>INICIO</p>
        <h1 style={{ fontFamily: C.fontSerif, fontSize: 30, color: C.ink1 }}>
          Hola, {settings.ownerName} 👋
        </h1>
        <p style={{ color: C.ink3, fontSize: 13, marginTop: 4 }}>
          {reading.length > 0 ? `${reading.length} libro${reading.length > 1 ? 's' : ''} en curso · ` : ''}
          {thisYear.length} de {yearGoal} libros este año
        </p>
      </div>

      {/* Hero — el núcleo, XP y racha */}
      <div style={{
        display:'grid', gridTemplateColumns:'auto 1fr', gap:28,
        alignItems:'center', padding:'26px 30px', marginBottom:14,
        background:'linear-gradient(135deg,rgba(139,92,246,0.10),rgba(34,211,238,0.05))',
        border:`1px solid ${C.border}`, borderRadius:20,
        position:'relative', overflow:'hidden',
      }}>
        <Mascot size={92} animate genreColor={topGenreColor} streak={streak}/>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase',
                      color:C.info, marginBottom:6 }}>
            {topGenreLabel ? `Núcleo activo · ${topGenreLabel}` : 'Núcleo activo'}
          </p>
          <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap', marginBottom:10 }}>
            <span style={{ fontFamily:C.fontMono, fontSize:13, color:C.xp, background:'rgba(255,184,77,0.12)',
                           padding:'3px 10px', borderRadius:7, fontWeight:600 }}>NIVEL {lv.level}</span>
            <span style={{ fontFamily:C.fontSerif, fontSize:19, color:C.ink1 }}>{lv.title}</span>
          </div>
          <XPBar value={lv.progressPercent} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:11, color:C.ink3, fontFamily:C.fontMono }}>{xp.toLocaleString('es')} XP</span>
            {!lv.isMax && (
              <span style={{ fontSize:11, color:C.ink3, fontFamily:C.fontMono }}>
                {(lv.xpForNext-xp).toLocaleString('es')} XP para nv.{lv.level+1}
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
            <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 14px' }}>
              <p style={{ fontFamily:C.fontMono, fontSize:17, color:C.ink1, lineHeight:1 }}>{thisYear.length}</p>
              <p style={{ fontSize:10, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:3 }}>Libros / año</p>
            </div>
            <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 14px' }}>
              <p style={{ fontFamily:C.fontMono, fontSize:17, color:C.info, lineHeight:1 }}>{reading.length}</p>
              <p style={{ fontSize:10, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:3 }}>En curso</p>
            </div>
            {streak > 0 && (
              <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 14px' }}>
                <p style={{ fontFamily:C.fontMono, fontSize:17, color:C.xp, lineHeight:1 }}>{streak}</p>
                <p style={{ fontSize:10, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:3 }}>Meses seguidos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <a href="/journey" style={{ textDecoration:'none', display:'block', marginBottom:14 }}>
        <div style={{ padding:'14px 20px', borderRadius:14, boxSizing:'border-box',
                       background:'linear-gradient(135deg,var(--rx-accent-mid),rgba(255,184,77,0.06))',
                       border:`1px solid ${C.border}`, display:'flex', alignItems:'center',
                       justifyContent:'space-between', gap:16, transition:'all 0.2s', cursor:'pointer' }}
          onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.accent; (e.currentTarget as HTMLElement).style.boxShadow='0 0 20px rgba(139,92,246,0.2)'; }}
          onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.border; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize:28 }}>🗺️</span>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:C.ink1, marginBottom:2 }}>Mi Recorrido</p>
              <p style={{ fontSize:12, color:C.ink3 }}>Tu historia lectora, año a año</p>
            </div>
          </div>
          <span style={{ fontSize:16, color:C.accent }}>→</span>
        </div>
      </a>

      {/* ── Seguí leyendo — sección principal, no una lista perdida ── */}
      {reading.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ width:3, height:11, borderRadius:2, background:C.accent, boxShadow:'0 0 6px var(--rx-accent)', display:'inline-block' }}/>
            <p style={{ fontSize:11, fontWeight:600, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.1em' }}>Seguí leyendo</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {reading.slice(0,3).map(book => {
              const pct = book.pages > 0 ? Math.min(Math.round((book.pagesRead/book.pages)*100),100) : 0;
              const auth = book.author.includes(',') ? book.author.split(',').reverse().join(' ').trim() : book.author;
              return (
                <div key={book.id} style={{ padding:'14px 18px', borderRadius:14, background:C.bgCard, border:`1px solid ${C.border}`, display:'flex', gap:16, alignItems:'center' }}>
                  {book.cover
                    ? <img src={book.cover} alt={book.title} style={{ width:44, height:66, objectFit:'cover', borderRadius:6, flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.4)' }} onError={e=>(e.currentTarget.style.display='none')}/>
                    : <div style={{ width:44, height:66, borderRadius:6, flexShrink:0, background:'linear-gradient(135deg,#1a1035,#0f0f1a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:C.accent }}>{book.format==='audio'?'🎧':'📖'}</div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <p onClick={()=>navigate(`/books/${book.id}`)} style={{ cursor:'pointer', fontFamily:C.fontSerif, fontStyle:'italic', fontSize:15, color:C.ink1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                      onMouseEnter={e=>(e.currentTarget.style.color=C.accent)} onMouseLeave={e=>(e.currentTarget.style.color=C.ink1)}>
                      {book.title}
                    </p>
                    <p style={{ fontSize:11, color:C.ink3, marginTop:2, fontFamily:C.fontMono }}>
                      {book.format==='audio' ? `${book.minutesListened||0}/${book.duration||0} min` : `${book.pagesRead||0} / ${book.pages} pág.`}
                    </p>
                  </div>
                  <div style={{ width:110, flexShrink:0 }}>
                    <div style={{ height:6, background:C.border, borderRadius:999, overflow:'hidden', marginBottom:4 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${C.accent},#c4b5fd)`, borderRadius:999 }}/>
                    </div>
                    <p style={{ fontSize:10, color:C.ink3, fontFamily:C.fontMono, textAlign:'right' }}>{pct}%</p>
                  </div>
                  <QuickSessionBtn bookId={book.id}/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tu año — panel consolidado (reemplaza Meta + 4 métricas + Lo más leído + gráfico mensual) ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ width:3, height:11, borderRadius:2, background:C.accent, boxShadow:'0 0 6px var(--rx-accent)', display:'inline-block' }}/>
        <p style={{ fontSize:11, fontWeight:600, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.1em', flex:1 }}>Tu año</p>
        <a href="/stats" style={{ fontSize:11, color:C.ink3, textDecoration:'none' }}>Ver estadísticas completas →</a>
      </div>
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18, flexWrap:'wrap', gap:12 }}>
          <div>
            <p style={{ fontSize:12, color:C.ink3, marginBottom:4 }}>Meta anual</p>
            <p style={{ fontFamily:C.fontSerif, fontStyle:'italic', fontSize:22, color:C.ink1 }}>
              <b style={{ color:C.accent, fontStyle:'normal', fontFamily:C.fontMono }}>{thisYear.length}</b> / {yearGoal} libros
            </p>
          </div>
          <div style={{ width:220, maxWidth:'100%' }}>
            <ProgressBar value={yearPct} color={yearPct>=100?C.success:C.accent}/>
            <p style={{ fontSize:11, color:yearPct>=100?C.success:C.ink3, fontFamily:C.fontMono, marginTop:5, textAlign:'right' }}>
              {yearPct>=100?'🎉 ¡Meta alcanzada!':`${yearPct}% · ${yearGoal-thisYear.length} para la meta`}
            </p>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:4, marginBottom:20 }}>
          {Array.from({ length:12 }, (_, mi) => {
            const mKey = `${year}-${String(mi+1).padStart(2,'0')}`;
            const count = thisYear.filter(b => b.end?.startsWith(mKey)).length;
            const isPast = mi < new Date().getMonth();
            const isCurrent = mi === new Date().getMonth();
            const label = ['E','F','M','A','M','J','J','A','S','O','N','D'][mi];
            return (
              <div key={mi} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:0 }}>
                <div style={{
                  width:'100%', height:26, borderRadius:4,
                  background: count>0 ? (count>=3?C.accent:count>=2?`color-mix(in srgb, ${C.accent} 60%, transparent)`:`color-mix(in srgb, ${C.accent} 33%, transparent)`) : isPast?`color-mix(in srgb, ${C.danger} 13%, transparent)`:isCurrent?`color-mix(in srgb, ${C.accent} 9%, transparent)`:C.bgSurface,
                  border:`1px solid ${isCurrent?C.accent:count>0?`color-mix(in srgb, ${C.accent} 25%, transparent)`:C.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:9, fontWeight:700, color:count>0?C.onAccent:C.ink4, fontFamily:C.fontMono,
                  boxShadow:isCurrent?`0 0 6px color-mix(in srgb, ${C.accent} 25%, transparent)`:'none',
                  boxSizing:'border-box',
                }} title={`${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][mi]}: ${count} libros`}>
                  {count>0?count:''}
                </div>
                <span style={{ fontSize:8, color:isCurrent?C.accent:C.ink4, fontFamily:C.fontMono }}>{label}</span>
              </div>
            );
          })}
        </div>

        <div className="rx-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:genrePie.length?18:0 }}>
          {[
            { label:'Libros',      value:finished.length,                                          color:C.accent  },
            { label:'Páginas',     value:finished.reduce((a,b)=>a+b.pages,0).toLocaleString('es'),  color:C.success },
            { label:'Rating medio',value:avgRating,                                                 color:C.xp      },
            { label:'Racha',       value:`${streak}m`,                                              color:C.info    },
          ].map(m => (
            <div key={m.label} style={{ borderTop:`2px solid ${m.color}`, paddingTop:8 }}>
              <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em', color:C.ink3, marginBottom:4 }}>{m.label}</p>
              <p style={{ fontFamily:C.fontMono, fontSize:19, fontWeight:600, color:m.color }}>{m.value}</p>
            </div>
          ))}
        </div>

        {genrePie.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:C.ink2, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[0], flexShrink:0 }}/>
            <span>
              Leíste mayormente <b style={{ color:C.ink1, fontWeight:600 }}>{genrePie[0].name}</b> este año ({genrePie[0].value})
              {genrePie[1] && ` — le siguen ${genrePie.slice(1,3).map(g=>`${g.name} (${g.value})`).join(', ')}`}
            </span>
          </div>
        )}
      </Card>

      {/* ── Desafíos — automáticos + personalizados, una sola grilla ── */}
      {allChallenges.length > 0 && (
        <>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ width:3, height:11, borderRadius:2, background:C.xp, boxShadow:'0 0 6px var(--rx-xp)', display:'inline-block' }}/>
            <p style={{ fontSize:11, fontWeight:600, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.1em', flex:1 }}>Desafíos</p>
            {customChallenges.length > 0 && <a href="/settings" style={{ fontSize:11, color:C.ink3, textDecoration:'none' }}>Editar →</a>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10, marginBottom:28 }}>
            {allChallenges.map((ch: any) => (
              <div key={`${ch.custom?'c':'a'}-${ch.id}`} style={{
                padding:12, borderRadius:12, background:C.bgCard,
                border:`1px solid ${ch.completed ? 'rgba(34,197,94,0.3)' : C.border}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>{ch.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:ch.completed?C.success:C.ink1 }}>{ch.title}</p>
                    {ch.description && <p style={{ fontSize:11, color:C.ink3 }}>{ch.description}</p>}
                  </div>
                  {ch.completed && <span>✅</span>}
                </div>
                <ProgressBar value={Math.min(Math.round((ch.current/ch.target)*100),100)} color={ch.completed?C.success:C.xp} height={4}/>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:10, color:C.ink3, fontFamily:C.fontMono }}>{ch.current}/{ch.target} {ch.unit}</span>
                  <span style={{ fontSize:10, color:C.xp, fontFamily:C.fontMono }}>+{ch.xpReward} XP</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Actividad reciente — fusiona lecturas terminadas + logros + inicios ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ width:3, height:11, borderRadius:2, background:C.magenta, boxShadow:'0 0 6px var(--rx-magenta)', display:'inline-block' }}/>
        <p style={{ fontSize:11, fontWeight:600, color:C.ink3, textTransform:'uppercase', letterSpacing:'0.1em' }}>Actividad reciente</p>
      </div>
      <Card style={{ marginBottom:28, padding:'6px 20px' }}>
        {feedItems.length === 0
          ? <p style={{ color:C.ink3, fontSize:12, padding:'14px 0' }}>Sin actividad todavía.</p>
          : feedItems.map((it,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 4px',
                                     borderBottom: i<feedItems.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:FEED_BG[it.type],
                              display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
                  {FEED_ICON[it.type]}
                </div>
                <p style={{ flex:1, fontSize:13, color:C.ink2 }}>
                  {FEED_VERB[it.type]} <b style={{ color:C.ink1, fontWeight:500 }}>{it.title}</b>
                  {it.sub ? ` — ${it.sub}` : ''}
                </p>
                <span style={{ fontSize:11, color:C.ink3, fontFamily:C.fontMono, flexShrink:0 }}>{fmt(it.date)}</span>
              </div>
            ))
        }
      </Card>

      {/* Heatmap */}
      <Card>
        <SectionTitle>Actividad lectora</SectionTitle>
        <p style={{ fontSize:12, color:C.ink4, marginBottom:14 }}>Registrá sesiones en cada libro para visualizar tu actividad diaria.</p>
        <ReadingHeatmap sessions={sessions}/>
      </Card>
    </div>
  );
}
