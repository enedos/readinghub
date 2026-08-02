import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { calcAchievements, RARITY_CONFIG, CATEGORY_COLOR, inferUnlockDate, type Rarity } from '../lib/achievements';
import { AchievementBadge } from '../components/AchievementBadge';
import { C, Card, SectionTitle, ProgressBar } from '../components/ui';
import { useFixedTooltip, FixedTooltip } from '../components/Tooltip';

const RARITY_ORDER: Rarity[] = ['legendary','platinum','gold','silver','bronze'];

const PATHS = [
  { id:'volumen', label:'Volumen', color:'#3B82F6', icon:'📚',
    ids:['books_5','books_10','books_25','books_50','books_100','books_200','pages_1000','pages_5000','pages_10000','pages_50000'] },
  { id:'constancia', label:'Constancia', color:'#22C55E', icon:'🔄',
    ids:['first_finish','two_month','streak_3','five_month','streak_6','streak_12'] },
  { id:'calidad', label:'Calidad', color:'#FFB84D', icon:'⭐',
    ids:['first_quote','notes_5','five_stars_1','all_ratings','five_stars_5','high_difficulty','five_stars_10','quotes_10'] },
  { id:'diversidad', label:'Diversidad', color:'#14B8A6', icon:'🌐',
    ids:['genres_5','authors_5','two_languages','genres_10','authors_20','genres_20','authors_50'] },
  { id:'maestria', label:'Maestría', color:'#C6409A', icon:'👑',
    ids:['goal_12','goal_24','all_formats','all_categories','library_size','true_master'] },
];

// ── Paths view ────────────────────────────────────────────────
function PathsView({ achievements }: { achievements: any[] }) {
  const achMap = Object.fromEntries(achievements.map(a => [a.id, a]));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
      {PATHS.map(path => {
        const pathAchs = path.ids.map(id => achMap[id]).filter(Boolean);
        const doneCount = pathAchs.filter(a => a.unlocked).length;
        const nextIdx = pathAchs.findIndex(a => !a.unlocked);
        const nextAch = nextIdx >= 0 ? pathAchs[nextIdx] : null;
        return (
          <div key={path.id}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <span style={{ fontSize:20 }}>{path.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:path.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>{path.label}</h3>
                  <span style={{ fontSize:11, color:path.color, fontFamily:C.fontMono }}>{doneCount}/{pathAchs.length}</span>
                </div>
                <div style={{ marginTop:6 }}><ProgressBar value={Math.round((doneCount/pathAchs.length)*100)} color={path.color} height={4}/></div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto', paddingBottom:8 }}>
              {pathAchs.map((ach, i) => {
                const isNext = ach.id === nextAch?.id;
                const isDone = ach.unlocked;
                const isFuture = !isDone && !isNext;
                const cfg = RARITY_CONFIG[ach.rarity as Rarity];
                return (
                  <div key={ach.id} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                    <div title={`${ach.title}: ${isDone?ach.description:ach.hint}`}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity:isFuture?0.4:1, transition:'all 0.2s' }}>
                      <div style={{ position:'relative', width:52, height:52, display:'flex', alignItems:'center', justifyContent:'center',
                                    filter:isNext?`drop-shadow(0 0 10px ${path.color}80)`:'none' }}>
                        <AchievementBadge rarity={ach.rarity} category={ach.category} unlocked={isDone} size={isDone||isNext?48:40}/>
                        {isNext && <div style={{ position:'absolute', top:-2, right:-2, width:16, height:16, borderRadius:'50%', background:path.color, border:`2px solid ${C.bgBase}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:C.onAccent, fontWeight:700 }}>→</div>}
                      </div>
                      <div style={{ textAlign:'center', maxWidth:80 }}>
                        <p style={{ fontSize:10, fontWeight:isDone||isNext?600:400, color:isDone?cfg.color:isNext?path.color:C.ink4, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:80 }}>{ach.title}</p>
                        {ach.progress !== undefined && !isDone && <p style={{ fontSize:9, color:C.ink4, fontFamily:C.fontMono, marginTop:2 }}>{ach.progressLabel}</p>}
                      </div>
                    </div>
                    {i < pathAchs.length - 1 && <div style={{ width:24, height:2, flexShrink:0, background:pathAchs[i].unlocked?path.color:C.border, opacity:0.4 }}/>}
                  </div>
                );
              })}
            </div>
            {nextAch && (
              <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8, background:`${path.color}08`, border:`1px solid ${path.color}20`, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:path.color }}>→</span>
                <p style={{ fontSize:12, color:C.ink2 }}><strong style={{ color:path.color }}>{nextAch.title}:</strong> {nextAch.hint}</p>
                {nextAch.progress !== undefined && <span style={{ fontSize:11, color:path.color, fontFamily:C.fontMono, marginLeft:'auto', flexShrink:0 }}>{nextAch.progressLabel}</span>}
              </div>
            )}
            {!nextAch && pathAchs.length > 0 && (
              <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8, background:`color-mix(in srgb, ${C.success} 3%, transparent)`, border:`1px solid color-mix(in srgb, ${C.success} 15%, transparent)` }}>
                <p style={{ fontSize:12, color:C.success, fontWeight:500 }}>✓ Camino completo</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Timeline view — with unlock dates ────────────────────────
function TimelineView({ achievements, achievementOverrides, books }: { achievements: any[]; achievementOverrides: any[]; books: any[] }) {
  const updateAchievementOverride = useStore(s => s.setAchievementOverride);
  const notifications             = useStore(s => s.notifications);
  const markNotificationRead      = useStore(s => s.markNotificationRead);  // reuse api channel
  const [editingDate, setEditingDate] = useState<string|null>(null);
  const [dateVal, setDateVal] = useState('');

  // Also sync updated date to the matching notification's createdAt
  async function saveDate(achievementId: string, date: string) {
    // 1. Save override
    const ov = achievementOverrides.find(o => o.id === achievementId) || {};
    await updateAchievementOverride(achievementId, { ...ov, unlockDate: date });
    // 2. Update matching notification via API directly
    const notif = notifications.find(n => n.achievementId === achievementId);
    if (notif) {
      await fetch(`/api/notifications/${notif.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...notif, createdAt: date }),
      });
      // Force reload notifications by triggering a page refresh of the store would be complex,
      // so we update via window.location only if the user navigates away.
      // For now the notif date updates on next load.
    }
    setEditingDate(null);
  }

  const unlocked = achievements.filter(a => a.unlocked);
  if (unlocked.length === 0) return (
    <div style={{ textAlign:'center', padding:60, color:C.ink3 }}>
      <p style={{ fontSize:14 }}>Todavía no desbloqueaste logros. ¡Seguí leyendo!</p>
    </div>
  );

  function getUnlockDate(id: string) {
    const ov = achievementOverrides.find(o => o.id === id);
    return ov?.unlockDate || inferUnlockDate(id, books) || null;
  }

  function fmtDate(s: string) {
    if (!s) return '';
    const d = new Date(s);
    return `${d.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]} ${d.getFullYear()}`;
  }

  const sorted = [...unlocked].sort((a, b) => {
    const da = getUnlockDate(a.id) || '';
    const db = getUnlockDate(b.id) || '';
    if (da && db) return db.localeCompare(da);
    if (da) return -1; if (db) return 1;
    return b.xp - a.xp;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {sorted.map((a, i) => {
        const cfg = RARITY_CONFIG[a.rarity];
        const catColor = CATEGORY_COLOR[a.category] || cfg.color;
        const isLast = i === sorted.length - 1;
        const unlockDate = getUnlockDate(a.id);
        const isEditing = editingDate === a.id;
        return (
          <div key={a.id} style={{ display:'flex', gap:16, paddingBottom:isLast?0:24, position:'relative' }}>
            {!isLast && <div style={{ position:'absolute', left:20, top:44, bottom:0, width:2, background:C.border }}/>}
            <div style={{ flexShrink:0, zIndex:1 }}>
              <AchievementBadge rarity={a.rarity} category={a.category} unlocked size={40}/>
            </div>
            <div style={{ flex:1, paddingTop:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                <span style={{ fontSize:9, fontWeight:600, color:cfg.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>{cfg.label}</span>
                <span style={{ fontSize:9, color:C.ink4 }}>·</span>
                <span style={{ fontSize:9, color:catColor, textTransform:'uppercase', letterSpacing:'0.06em' }}>{a.category}</span>
              </div>
              <p style={{ fontSize:14, fontWeight:600, color:C.ink1, marginBottom:3 }}>{a.title}</p>
              <p style={{ fontSize:12, color:C.ink3, lineHeight:1.5, marginBottom:4 }}>{a.description}</p>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:C.xp, fontFamily:C.fontMono }}>+{a.xp} XP</span>
                {isEditing ? (
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)}
                      style={{ padding:'3px 8px', borderRadius:6, fontSize:11, background:C.bgSurface, border:`1px solid ${C.accent}`, color:C.ink1, outline:'none' }}/>
                    <button onClick={() => saveDate(a.id, dateVal)}
                      style={{ padding:'3px 8px', borderRadius:6, background:C.accent, border:'none', color:C.onAccent, fontSize:11, cursor:'pointer' }}>✓</button>
                    <button onClick={() => setEditingDate(null)}
                      style={{ padding:'3px 8px', borderRadius:6, background:'transparent', border:`1px solid ${C.border}`, color:C.ink3, fontSize:11, cursor:'pointer' }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingDate(a.id); setDateVal(unlockDate || new Date().toISOString().slice(0,10)); }}
                    style={{ fontSize:10, color:unlockDate?C.ink3:C.ink4, background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    📅 {unlockDate ? fmtDate(unlockDate) : 'Agregar fecha'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Rarity filtered view ──────────────────────────────────────
function RarityView({ achievements, rarity, onBack }: { achievements: any[]; rarity: Rarity; onBack: () => void }) {
  const cfg = RARITY_CONFIG[rarity];
  const filtered = achievements.filter(a => a.rarity === rarity);
  const done = filtered.filter(a => a.unlocked);
  return (
    <div>
      <button onClick={onBack}
        style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:C.ink3, fontSize:13, marginBottom:20, padding:0 }}>
        ← Volver a logros
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:'16px 20px', borderRadius:14, background:`${cfg.color}08`, border:`1px solid ${cfg.color}30` }}>
        <div style={{ width:48, height:48, borderRadius:12, background:`${cfg.color}20`, border:`1px solid ${cfg.color}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:20, fontWeight:700, color:cfg.color, fontFamily:C.fontMono }}>{done.length}</span>
        </div>
        <div>
          <p style={{ fontSize:18, fontWeight:700, color:cfg.color }}>{cfg.label}</p>
          <p style={{ fontSize:12, color:C.ink3 }}>{done.length} de {filtered.length} desbloqueados</p>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <ProgressBar value={filtered.length > 0 ? Math.round((done.length/filtered.length)*100) : 0} color={cfg.color} height={6}/>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
        {filtered.map(a => {
          const catColor = CATEGORY_COLOR[a.category] || cfg.color;
          return (
            <div key={a.id} style={{ display:'flex', gap:14, padding:'14px 16px', borderRadius:14, border:`1px solid ${a.unlocked?`${cfg.color}40`:C.border}`, background:a.unlocked?`${cfg.color}06`:C.bgCard, opacity:a.unlocked?1:0.55, position:'relative', overflow:'hidden' }}>
              {a.unlocked && <div style={{ position:'absolute',top:0,left:0,right:0,height:2, background:`linear-gradient(90deg,transparent,${cfg.color},transparent)`,opacity:0.5 }}/>}
              <AchievementBadge rarity={a.rarity} category={a.category} unlocked={a.unlocked} size={48}/>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontSize:9,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:catColor,opacity:0.8 }}>{a.category}</span>
                <p style={{ fontSize:13,fontWeight:600,color:a.unlocked?C.ink1:C.ink3,marginTop:2,marginBottom:3 }}>
                  {a.title}{a.unlocked&&<span style={{marginLeft:6,fontSize:11,color:cfg.color}}>✓</span>}
                </p>
                <p style={{ fontSize:11,color:C.ink4,lineHeight:1.4,marginBottom:6 }}>{a.unlocked?a.description:a.hint||a.description}</p>
                {!a.unlocked&&a.progress!==undefined&&(
                  <div style={{marginBottom:5}}><ProgressBar value={a.progress} color={catColor} height={3}/>{a.progressLabel&&<p style={{fontSize:10,color:C.ink4,marginTop:2,fontFamily:C.fontMono}}>{a.progressLabel}</p>}</div>
                )}
                <span style={{fontSize:11,fontFamily:C.fontMono,color:a.unlocked?C.xp:C.ink4}}>{a.unlocked?'+':''}{a.xp} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Map view — includes custom achievements ───────────────────
function MapView({ achievements, customAchievements, categoryOverrides }: any) {
  const { tooltipProps, showTip, hideTip } = useFixedTooltip();
  const allAchs = [...achievements, ...customAchievements.map((a:any) => ({...a, isCustom:true}))];

  const categoryGroups = Object.fromEntries(
    [...new Set(allAchs.map(a=>a.category))].map(cat => [cat, allAchs.filter(a=>a.category===cat)])
  );
  const categories = Object.keys(categoryGroups);

  return (
    <div style={{ overflowX:'auto' }}>
      <FixedTooltip {...tooltipProps} />
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${categories.length},1fr)`, gap:16, minWidth:800, padding:'8px 0' }}>
        {categories.map(cat => {
          const catAchs = categoryGroups[cat];
          const catColor = categoryOverrides[cat]?.color || CATEGORY_COLOR[cat] || C.accent;
          const catLabel = categoryOverrides[cat]?.label || cat;
          const doneCount = catAchs.filter(a=>a.unlocked).length;
          return (
            <div key={cat} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:10, fontWeight:600, color:catColor, textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'center', marginBottom:4 }}>
                {catLabel}
                <div style={{ fontSize:9, color:C.ink4, fontWeight:400, marginTop:2 }}>{doneCount}/{catAchs.length}</div>
              </div>
              {catAchs.map(a => {
                const cfg = RARITY_CONFIG[a.rarity];
                return (
                  <div key={a.id}
                    onMouseEnter={e => showTip(e, <>
                      <p style={{ fontWeight:600, color:a.unlocked?cfg.color:C.ink1, marginBottom:4 }}>{a.title} {a.unlocked?'✓':'🔒'}</p>
                      <p style={{ lineHeight:1.5, maxWidth:200, whiteSpace:'normal' }}>{a.unlocked?a.description:a.hint}</p>
                      {a.progress!==undefined&&!a.unlocked&&<p style={{fontSize:10,marginTop:4,fontFamily:C.fontMono,color:C.ink4}}>{a.progressLabel}</p>}
                      <p style={{ fontSize:10, color:C.xp, marginTop:4, fontFamily:C.fontMono }}>+{a.xp} XP</p>
                    </>)}
                    onMouseLeave={hideTip}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'default', transition:'transform 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.transform='scale(1.1)')}
                    onMouseOut={e => (e.currentTarget.style.transform='scale(1)')}>
                    <div style={{ position:'relative' }}>
                      <AchievementBadge rarity={a.rarity} category={cat} unlocked={a.unlocked} size={40}/>
                      {(a as any).isCustom && <div style={{ position:'absolute',top:-4,right:-4,fontSize:9,background:C.accent,color:C.onAccent,borderRadius:3,padding:'0 3px' }}>★</div>}
                    </div>
                    <p style={{ fontSize:9, textAlign:'center', maxWidth:64, lineHeight:1.3, color:a.unlocked?cfg.color:C.ink4, fontWeight:a.unlocked?600:400 }}>{a.title}</p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Categories view — collapsible ────────────────────────────
function CategoriesView({ achievements, customAchievements, categoryOverrides }: any) {
  const allAchievements = [...achievements, ...customAchievements.map((a:any) => ({...a, isCustom:true}))];
  const allCategories = [...new Set(allAchievements.map(a=>a.category))];
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCat(cat: string) {
    setCollapsed(s => {
      const n = new Set(s);
      if (n.has(cat)) n.delete(cat); else n.add(cat);
      return n;
    });
  }

  return (
    <div>
      {allCategories.map(category => {
        const catAchs  = allAchievements.filter(a => a.category === category);
        const catDone  = catAchs.filter(a => a.unlocked).length;
        const catColor = categoryOverrides[category]?.color || CATEGORY_COLOR[category] || C.accent;
        const catLabel = categoryOverrides[category]?.label || category;
        const isCollapsed = collapsed.has(category);
        return (
          <div key={category} style={{ marginBottom:16, borderRadius:12, border:`1px solid ${C.border}`, overflow:'hidden' }}>
            <button onClick={() => toggleCat(category)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:C.bgSurface, border:'none', cursor:'pointer', textAlign:'left' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, background:catColor }}/>
              <h2 style={{ fontSize:13, fontWeight:600, color:catColor, letterSpacing:'0.06em', textTransform:'uppercase', flex:1 }}>{catLabel}</h2>
              <span style={{ fontSize:11, color:catColor, fontFamily:C.fontMono, opacity:0.7 }}>{catDone}/{catAchs.length}</span>
              <div style={{ width:80, flexShrink:0 }}><ProgressBar value={catAchs.length>0?Math.round((catDone/catAchs.length)*100):0} color={catColor} height={3}/></div>
              <span style={{ color:C.ink4, fontSize:12, transition:'transform 0.2s', transform:isCollapsed?'none':'rotate(180deg)', marginLeft:4 }}>▾</span>
            </button>
            {!isCollapsed && (
              <div style={{ padding:'12px 16px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
                {catAchs.map(a => {
                  const cfg = RARITY_CONFIG[a.rarity];
                  return (
                    <div key={a.id} style={{ display:'flex', gap:14, padding:'14px 16px', borderRadius:14, border:`1px solid ${a.unlocked?`${catColor}30`:C.border}`, background:a.unlocked?`${catColor}06`:C.bgCard, opacity:a.unlocked?1:0.5, position:'relative', overflow:'hidden' }}>
                      {a.unlocked && <div style={{ position:'absolute',top:0,left:0,right:0,height:2, background:`linear-gradient(90deg,transparent,${catColor},transparent)`,opacity:0.5 }}/>}
                      {(a as any).isCustom && <div style={{ position:'absolute',top:8,right:8,fontSize:9,color:C.ink4,fontFamily:C.fontMono,background:C.bgHover,padding:'1px 5px',borderRadius:4 }}>custom</div>}
                      <AchievementBadge rarity={a.rarity} category={category} unlocked={a.unlocked} size={48}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:9,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:cfg.color,opacity:0.8 }}>{cfg.label}</span>
                        <p style={{ fontSize:13,fontWeight:600,color:a.unlocked?C.ink1:C.ink3,marginTop:2,marginBottom:3 }}>
                          {a.title}{a.unlocked&&<span style={{marginLeft:6,fontSize:11,color:catColor}}>✓</span>}
                        </p>
                        <p style={{ fontSize:11,color:C.ink4,lineHeight:1.4,marginBottom:6 }}>{a.unlocked?a.description:a.hint||a.description}</p>
                        {!a.unlocked&&a.progress!==undefined&&(<div style={{marginBottom:5}}><ProgressBar value={a.progress} color={catColor} height={3}/>{a.progressLabel&&<p style={{fontSize:10,color:C.ink4,marginTop:2,fontFamily:C.fontMono}}>{a.progressLabel}</p>}</div>)}
                        <span style={{fontSize:11,fontFamily:C.fontMono,color:a.unlocked?C.xp:C.ink4}}>{a.unlocked?'+':''}{a.xp} XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AchievementsPage() {
  const books               = useStore(s => s.books);
  const customAchievements  = useStore(s => s.customAchievements);
  const achievementOverrides = useStore(s => s.achievementOverrides);
  const categoryOverrides   = useStore(s => (s as any).categoryOverrides) || {};

  const achievements = useMemo(() => {
    const base = calcAchievements(books);
    return base.map(a => {
      const ov = achievementOverrides.find(o => o.id === a.id);
      if (!ov) return a;
      return { ...a, title:ov.title??a.title, description:ov.description??a.description, unlocked:ov.manualUnlock?true:a.unlocked };
    });
  }, [books, achievementOverrides]);

  const allAchievements = useMemo(() => [
    ...achievements,
    ...customAchievements.map((a:any) => ({...a, progress:undefined, progressLabel:undefined})),
  ], [achievements, customAchievements]);

  const unlocked   = allAchievements.filter(a => a.unlocked);
  const xpEarned   = unlocked.reduce((acc, a) => acc + a.xp, 0);
  const totalCount = allAchievements.length;
  const pct        = Math.round((unlocked.length / Math.max(totalCount,1)) * 100);

  const [tab, setTab] = useState<'paths'|'timeline'|'map'|'categories'>('paths');
  const [rarityFilter, setRarityFilter] = useState<Rarity|null>(null);

  const TABS = [
    { id:'paths',      label:'Caminos'     },
    { id:'timeline',   label:'Cronológico' },
    { id:'map',        label:'Mapa'        },
    { id:'categories', label:'Categorías'  },
  ] as const;

  // If a rarity is selected, show filtered view
  if (rarityFilter) {
    return (
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 80px' }}>
        <RarityView achievements={allAchievements} rarity={rarityFilter} onBack={() => setRarityFilter(null)} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 80px' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}><span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>GAMIFICACIÓN</p>
          <h1 style={{ fontFamily:C.fontSans, fontSize:30, fontWeight:700, color:C.ink1, position:'relative', display:'inline-block', marginBottom:16 }}>
            Logros
            <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                           background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
          </h1>
          <p style={{ color:C.ink3, fontSize:13, marginTop:4 }}>{unlocked.length} de {totalCount} desbloqueados · {xpEarned.toLocaleString('es')} XP ganados</p>
        </div>
        <a href="/settings" style={{ fontSize:12, color:C.ink3, textDecoration:'none', padding:'6px 14px', borderRadius:8, border:`1px solid ${C.border}`, transition:'all 0.2s' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.accent;(e.currentTarget as HTMLElement).style.color=C.accent;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.color=C.ink3;}}>
          Gestionar logros →
        </a>
      </div>

      {/* Rarity summary — clickable */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
        {RARITY_ORDER.map(r => {
          const cfg  = RARITY_CONFIG[r];
          const all  = allAchievements.filter(a => a.rarity === r);
          const done = all.filter(a => a.unlocked).length;
          return (
            <button key={r} onClick={() => setRarityFilter(r)}
              style={{ padding:'10px 8px', borderRadius:12, textAlign:'center', border:`1px solid ${done>0?cfg.color+'40':C.border}`, background:done>0?`${cfg.color}08`:C.bgCard, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=cfg.color;(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=done>0?`${cfg.color}40`:C.border;(e.currentTarget as HTMLElement).style.transform='none';}}>
              <p style={{ fontSize:9, fontWeight:600, color:cfg.color, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>{cfg.label}</p>
              <p style={{ fontSize:20, fontWeight:600, color:cfg.color, fontFamily:C.fontMono }}>{done}/{all.length}</p>
              <div style={{ marginTop:6 }}><ProgressBar value={all.length>0?Math.round((done/all.length)*100):0} color={cfg.color} height={3}/></div>
              <p style={{ fontSize:9, color:C.ink4, marginTop:4 }}>Ver todos →</p>
            </button>
          );
        })}
      </div>

      <Card style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <SectionTitle>Progreso total</SectionTitle>
          <span style={{ fontSize:12, fontFamily:C.fontMono, color:C.ink3 }}>{pct}%</span>
        </div>
        <ProgressBar value={pct} color={C.accent} height={8}/>
      </Card>

      <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${C.border}`, marginBottom:28 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'9px 18px', border:'none', cursor:'pointer', fontSize:13, fontWeight:tab===t.id?600:400, color:tab===t.id?C.ink1:C.ink3, background:'transparent', borderBottom:tab===t.id?`2px solid ${C.accent}`:'2px solid transparent', marginBottom:-1, transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="fade-in" key={tab}>
        {tab==='paths'      && <PathsView achievements={achievements}/>}
        {tab==='timeline'   && <TimelineView achievements={allAchievements} achievementOverrides={achievementOverrides} books={books}/>}
        {tab==='map'        && <MapView achievements={achievements} customAchievements={customAchievements} categoryOverrides={categoryOverrides}/>}
        {tab==='categories' && <CategoriesView achievements={achievements} customAchievements={customAchievements} categoryOverrides={categoryOverrides}/>}
      </div>
    </div>
  );
}
