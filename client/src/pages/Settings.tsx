import { useState, useRef } from 'react';
import { useStore } from '../store';
import { totalXP, levelInfo } from '../lib/xp';
import { calcAchievements, RARITY_CONFIG, CATEGORY_COLOR, type Rarity } from '../lib/achievements';
import { C, Card, SectionTitle, Input, Btn } from '../components/ui';
import { LevelEditor } from '../components/LevelEditor';
import type { CustomChallenge, ChallengeOverride, CustomAchievement } from '../types';

// ── Tab system ────────────────────────────────────────────────
const TABS = [
  { id: 'profile',  label: 'Perfil'           },
  { id: 'levels',   label: 'Niveles'          },
  { id: 'gamif',    label: 'Logros & Desafíos' },
  { id: 'data',     label: 'Datos'             },
];

function TabBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${C.border}`, marginBottom:28, paddingBottom:2 }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{
            padding:'8px 16px', border:'none', cursor:'pointer', fontSize:13, borderRadius:'8px 8px 0 0',
            fontWeight: active===t.id ? 600 : 400,
            color: active===t.id ? C.accent : C.ink3,
            background: active===t.id ? 'var(--rx-accent-mid)' : 'transparent',
            boxShadow: active===t.id ? '0 -2px 12px rgba(139,92,246,0.15)' : 'none',
            transition:'all 0.2s',
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Section header with collapse ──────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:16 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  background:'none', border:'none', cursor:'pointer', padding:'12px 0',
                  borderBottom:`1px solid ${C.border}`, marginBottom: open ? 14 : 0 }}>
        <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em',
                        textTransform:'uppercase', color:C.ink3 }}>{title}</span>
        <span style={{ color:C.ink4, fontSize:13, transition:'transform 0.2s',
                        transform:open?'rotate(180deg)':'none' }}>▾</span>
      </button>
      {open && children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const settings             = useStore(s => s.settings);
  const books                = useStore(s => s.books);
  const customLevels         = useStore(s => s.customLevels);
  const updateSettings       = useStore(s => s.updateSettings);
  const importBooks          = useStore(s => s.importBooks);
  const exportData           = useStore(s => s.exportData);
  const importData           = useStore(s => s.importData);

  const [tab,   setTab]   = useState('profile');
  const [name,  setName]  = useState(settings.ownerName);
  const [goal,  setGoal]  = useState(String(settings.yearlyGoal));
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const importRef     = useRef<HTMLInputElement>(null);

  const xp  = totalXP(books);
  const lv  = levelInfo(xp, customLevels);
  const fin = books.filter(b => b.status === 'finished');

  function save() {
    updateSettings({ ownerName: name, yearlyGoal: Number(goal) || 12 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const uploadAvatar = useStore(s => s.uploadAvatar);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try { await uploadAvatar(file); }
    catch { alert('Error al subir la imagen'); }
  }

  async function handleExport() {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `readinghub-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function handleExportConfig() {
    const data = await fetch('/api/backup/config').then(r => r.json());
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `readinghub-config-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.books && Array.isArray(data.books)) {
          importData(data);
          setImportError('');
          alert(`Importados ${data.books.length} libros. Recargá la página.`);
          setTimeout(() => window.location.reload(), 800);
        } else setImportError('Formato inválido: falta el campo "books".');
      } catch { setImportError('Error al leer el archivo.'); }
    };
    reader.readAsText(file);
  }

  function handleImportConfig(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        fetch('/api/restore/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then(() => {
          alert('Ajustes importados. Recargá la página.');
          setTimeout(() => window.location.reload(), 800);
        });
      } catch { alert('Error al leer el archivo.'); }
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 28px 80px' }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}><span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>CONFIGURACIÓN</p>
        <h1 style={{ fontFamily:C.fontSans, fontSize:32, fontWeight:700, color:C.ink1, position:'relative', display:'inline-block', marginBottom:16 }}>
          Ajustes
          <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                         background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
        </h1>
      </div>

      <TabBar active={tab} onChange={setTab}/>

      {/* ── TAB: Perfil ── */}
      {tab === 'profile' && (
        <>
          {/* Profile + avatar */}
          <Card style={{ marginBottom:16 }}>
            <SectionTitle>Perfil</SectionTitle>
            <div style={{ display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' }}>
              {/* Avatar */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, flexShrink:0 }}>
                <div onClick={() => fileInputRef.current?.click()}
                  style={{ width:88, height:88, borderRadius:'50%', cursor:'pointer',
                            background: settings.avatarUrl ? 'transparent' : 'linear-gradient(135deg,var(--rx-accent),#4C3A99)',
                            border:`2px solid ${C.border}`, display:'flex', alignItems:'center',
                            justifyContent:'center', overflow:'hidden', position:'relative', transition:'border-color 0.2s' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = C.accent;
                    const ov = e.currentTarget.querySelector('.av-ov') as HTMLElement;
                    if (ov) ov.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = C.border;
                    const ov = e.currentTarget.querySelector('.av-ov') as HTMLElement;
                    if (ov) ov.style.opacity = '0';
                  }}>
                  {settings.avatarUrl
                    ? <img src={settings.avatarUrl} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                    : <span style={{ fontSize:32,fontWeight:700,color:C.onAccent,fontFamily:C.fontMono }}>{name[0]?.toUpperCase()||'L'}</span>
                  }
                  <div className="av-ov" style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',
                                                    display:'flex',flexDirection:'column',alignItems:'center',
                                                    justifyContent:'center',opacity:0,transition:'opacity 0.2s' }}>
                    <span style={{ fontSize:18 }}>📷</span>
                    <span style={{ fontSize:10,color:C.onAccent,marginTop:3 }}>Cambiar</span>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:'none' }}/>
                {settings.avatarUrl && (
                  <button onClick={() => updateSettings({ avatarUrl:'' })}
                    style={{ fontSize:11,color:C.danger,background:'none',border:'none',cursor:'pointer',padding:0 }}>
                    Eliminar foto
                  </button>
                )}
                <p style={{ fontSize:11,color:C.ink4,textAlign:'center',maxWidth:90 }}>Click para subir foto</p>
              </div>
              {/* Fields */}
              <div style={{ flex:1,minWidth:200,display:'grid',gap:14 }}>
                <Input label="Tu nombre" value={name} onChange={setName} placeholder="Tu nombre"/>
                <Input label="Meta anual de libros" value={goal} onChange={setGoal} type="number" min={1} max={365}/>
                <Btn onClick={save} style={{ alignSelf:'flex-start' }}>{saved?'✅ Guardado':'Guardar cambios'}</Btn>
              </div>
            </div>
          </Card>

          {/* XP */}
          <Card style={{ marginBottom:16 }}>
            <SectionTitle>Tu progreso</SectionTitle>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 }}>
              {[
                { label:'Nivel',   value:`${lv.level}`,                   sub:lv.title },
                { label:'XP',      value:xp.toLocaleString('es'),          sub:'puntos'  },
                { label:'Leídos',  value:String(fin.length),               sub:'libros'  },
                { label:'Páginas', value:fin.reduce((a,b)=>a+b.pages,0).toLocaleString('es'), sub:'total' },
              ].map(m=>(
                <div key={m.label} style={{ textAlign:'center',padding:'10px 8px',
                                             background:C.bgSurface,borderRadius:10,border:`1px solid ${C.border}` }}>
                  <p style={{ fontSize:10,color:C.ink3,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>{m.label}</p>
                  <p style={{ fontSize:20,fontWeight:600,color:C.ink1,fontFamily:C.fontMono }}>{m.value}</p>
                  <p style={{ fontSize:10,color:C.ink4,marginTop:2 }}>{m.sub}</p>
                </div>
              ))}
            </div>
          </Card>


        </>
      )}

      {/* ── TAB: Niveles ── */}
      {tab === 'levels' && (
        <div>
          <Card style={{ marginBottom:16 }}>
            <SectionTitle>Escala de niveles</SectionTitle>
            <p style={{ fontSize:12, color:C.ink3, marginBottom:16 }}>
              Personalizá los títulos, íconos y XP requerido para cada nivel.
            </p>
            <LevelEditor/>
          </Card>
        </div>
      )}

      {/* ── TAB: Logros & Desafíos ── */}
      {tab === 'gamif' && <GamificationTab/>}

      {/* ── TAB: Datos ── */}
      {tab === 'data' && (
        <>
          {/* ── Biblioteca ── */}
          <Card style={{ marginBottom:16 }}>
            <SectionTitle>Biblioteca</SectionTitle>
            <p style={{ fontSize:12, color:C.ink4, marginBottom:14 }}>Tus libros, citas, documentos y colecciones.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}` }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:500, color:C.ink1 }}>Exportar biblioteca</p>
                  <p style={{ fontSize:11, color:C.ink3, marginTop:2 }}>JSON con todos tus libros, citas y colecciones</p>
                </div>
                <Btn onClick={handleExport} variant="ghost">↓ Exportar</Btn>
              </div>
              <div style={{ padding:'12px 14px', borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:500, color:C.ink1 }}>Importar biblioteca</p>
                    <p style={{ fontSize:11, color:C.ink3, marginTop:2 }}>Carga un archivo JSON exportado previamente</p>
                  </div>
                  <label style={{ cursor:'pointer' }}>
                    <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display:'none' }}/>
                    <span style={{ padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:500, border:`1px solid ${C.border}`, color:C.ink2, cursor:'pointer', background:'transparent' }}>
                      ↑ Importar
                    </span>
                  </label>
                </div>
                {importError && <p style={{ fontSize:12, color:C.danger, marginTop:6 }}>{importError}</p>}
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, background:'var(--rx-accent-mid)', border:`1px solid color-mix(in srgb, ${C.accent} 20%, transparent)` }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:500, color:C.ink1 }}>Biblioteca de ejemplo</p>
                  <p style={{ fontSize:11, color:C.ink3, marginTop:2 }}>10 libros con citas, personajes y progreso, para ver la app en uso.</p>
                </div>
                <Btn variant="ghost" onClick={async () => {
                  const res = await fetch('/demo-data.json');
                  const data = await res.json();
                  await importData(data);
                }}>✨ Cargar</Btn>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, background:'rgba(239,68,68,0.05)', border:`1px solid rgba(239,68,68,0.15)` }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:500, color:C.danger }}>Borrar todos los libros</p>
                  <p style={{ fontSize:11, color:C.ink3, marginTop:2 }}>Elimina la biblioteca. No se puede deshacer.</p>
                </div>
                <Btn variant="danger" onClick={() => { if(confirm('¿Eliminar todos los libros?')) importBooks([]); }}>Borrar</Btn>
              </div>
            </div>
          </Card>

          {/* ── Ajustes personalizados ── */}
          <Card style={{ marginBottom:16 }}>
            <SectionTitle>Ajustes personalizados</SectionTitle>
            <p style={{ fontSize:12, color:C.ink4, marginBottom:14 }}>Perfil, logros, desafíos, niveles, categorías, avatar, notificaciones.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}` }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:500, color:C.ink1 }}>Exportar ajustes</p>
                  <p style={{ fontSize:11, color:C.ink3, marginTop:2 }}>Exporta tu configuración sin libros ni documentos</p>
                </div>
                <Btn onClick={handleExportConfig} variant="ghost">↓ Exportar config</Btn>
              </div>
              <div style={{ padding:'12px 14px', borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:500, color:C.ink1 }}>Importar ajustes</p>
                    <p style={{ fontSize:11, color:C.ink3, marginTop:2 }}>Restaura logros, desafíos, niveles y perfil</p>
                  </div>
                  <label style={{ cursor:'pointer' }}>
                    <input type="file" accept=".json" onChange={handleImportConfig} style={{ display:'none' }}/>
                    <span style={{ padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:500, border:`1px solid ${C.border}`, color:C.ink2, cursor:'pointer', background:'transparent' }}>
                      ↑ Importar config
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Estadísticas generales</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {[
                ['Total libros',      books.length],
                ['Libros leídos',     fin.length],
                ['En progreso',       books.filter(b=>b.status==='reading').length],
                ['Pendientes',        books.filter(b=>b.status==='planned').length],
                ['Abandonados',       books.filter(b=>b.status==='abandoned').length],
                ['Páginas totales',   fin.reduce((a,b)=>a+b.pages,0).toLocaleString('es')],
                ['Tags distintos',    new Set(books.flatMap(b=>b.tags)).size],
                ['Autores distintos', new Set(books.map(b=>b.author)).size],
              ].map(([label,value])=>(
                <div key={String(label)} style={{ padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                  <p style={{ fontSize:11, color:C.ink3, marginBottom:4 }}>{label}</p>
                  <p style={{ fontSize:20, fontWeight:600, color:C.ink1, fontFamily:C.fontMono }}>{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Gamification tab ──────────────────────────────────────────
function GamificationTab() {
  const books               = useStore(s => s.books);
  const settings            = useStore(s => s.settings);
  const customAchievements  = useStore(s => s.customAchievements);
  const achievementOverrides= useStore(s => s.achievementOverrides);
  const setAchievementOverride = useStore(s => s.setAchievementOverride);
  const addCustomAchievement   = useStore(s => s.addCustomAchievement);
  const updateCustomAchievement = useStore(s => s.updateCustomAchievement);
  const deleteCustomAchievement = useStore(s => s.deleteCustomAchievement);
  const challengeOverrides  = useStore(s => s.challengeOverrides) || [];
  const setChallengeOverride = useStore(s => s.setChallengeOverride);
  const customChallenges    = useStore(s => s.customChallenges) || [];
  const setCustomChallenges = useStore(s => s.setCustomChallenges);
  const categoryOverrides   = useStore(s => (s as any).categoryOverrides) || {};
  const setCategoryOverride = useStore(s => (s as any).setCategoryOverride);

  const autoAchievements = calcAchievements(books).map(a => {
    const ov = achievementOverrides.find(o => o.id === a.id);
    return ov ? { ...a, title: ov.title??a.title, description: ov.description??a.description, unlocked: ov.manualUnlock?true:a.unlocked } : a;
  });

  const allCategories = [...new Set([...autoAchievements.map(a=>a.category), ...customAchievements.map((a:any)=>a.category)])];

  // Local edit state
  const [editingAch, setEditingAch]     = useState<string|null>(null);
  const [editingCustAch, setEditingCustAch] = useState<string|null>(null);
  const [achForm, setAchForm]           = useState({ title:'', description:'', manualUnlock:false });
  const [newCustAch, setNewCustAch]     = useState(false);
  const [custAchForm, setCustAchForm]   = useState({ title:'', description:'', hint:'', category:'Metas', rarity:'bronze' as Rarity, xp:100, unlocked:false });
  const [editCat, setEditCat]           = useState<string|null>(null);
  const [catForm, setCatForm]           = useState({ label:'', color:'' });
  const RARITY_OPTIONS: Rarity[]        = ['bronze','silver','gold','platinum','legendary'];
  const ICONS = ['🎯','📚','📖','⚡','🔥','🏆','🌟','💡','🗺️','🧠','📜','🎧'];
  const UNITS = ['libros','páginas','géneros','autores','meses'];
  const [newChallForm, setNewChallForm] = useState({ title:'', description:'', icon:'🎯', target:1, unit:'libros', deadline:'', xpReward:100 });
  const [newChall, setNewChall]         = useState(false);
  const [editChallId, setEditChallId]   = useState<string|null>(null);

  const DEFAULT_CHALLENGES = [
    { id:'year_goal',    icon:'📅', label:'Meta anual',           unit:'libros',  defaultTarget: settings.yearlyGoal },
    { id:'month_book',   icon:'📖', label:'Libro del mes',        unit:'libros',  defaultTarget: 1 },
    { id:'pages_month',  icon:'📜', label:'Desafío de páginas',   unit:'páginas', defaultTarget: 1000 },
    { id:'genres_month', icon:'🗺️', label:'Diversidad de géneros',unit:'géneros', defaultTarget: 3 },
  ];

  function getChallOv(id: string) { return (challengeOverrides as any[]).find(o=>o.id===id); }

  function saveCustomAch() {
    if (!custAchForm.title) return;
    if (editingCustAch) {
      updateCustomAchievement(editingCustAch, custAchForm);
      setEditingCustAch(null);
    } else {
      addCustomAchievement(custAchForm);
      setNewCustAch(false);
    }
    setCustAchForm({ title:'',description:'',hint:'',category:'Metas',rarity:'bronze',xp:100,unlocked:false });
  }

  function saveChallenge() {
    if (!newChallForm.title || newChallForm.target < 1) return;
    if (editChallId) {
      setCustomChallenges((customChallenges as any[]).map(ch => ch.id===editChallId?{...ch,...newChallForm}:ch));
      setEditChallId(null);
    } else {
      const nc: CustomChallenge = { ...newChallForm, id:Date.now().toString(36), current:0, type:'custom' };
      setCustomChallenges([...(customChallenges as any[]), nc]);
      setNewChall(false);
    }
    setNewChallForm({ title:'',description:'',icon:'🎯',target:1,unit:'libros',deadline:'',xpReward:100 });
  }

  const row = (label: string, children: React.ReactNode) => (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,
                   padding:'10px 14px',borderRadius:10,background:C.bgSurface,border:`1px solid ${C.border}`,marginBottom:6 }}>
      <span style={{ fontSize:13,color:C.ink2 }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div>
      {/* ── Default challenges ── */}
      <Section title="Desafíos predefinidos">
        <p style={{ fontSize:12,color:C.ink4,marginBottom:12 }}>
          Editá la meta y activá/desactivá los desafíos automáticos del Dashboard.
        </p>
        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
          {DEFAULT_CHALLENGES.map(ch => {
            const ov      = getChallOv(ch.id);
            const target  = ov?.target ?? ch.defaultTarget;
            const enabled = ov?.enabled !== false;
            return (
              <div key={ch.id} style={{ display:'flex',alignItems:'center',gap:12,
                                         padding:'10px 14px',borderRadius:9,background:C.bgSurface,
                                         border:`1px solid ${enabled?C.border:'rgba(239,68,68,0.2)'}`,
                                         opacity:enabled?1:0.55 }}>
                <span style={{ fontSize:18,flexShrink:0 }}>{ch.icon}</span>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:13,fontWeight:500,color:C.ink1 }}>{ch.label}</p>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
                  <input type="number" min={1} value={target}
                    onChange={e=>setChallengeOverride(ch.id,{ target:Number(e.target.value),enabled })}
                    style={{ width:60,padding:'4px 8px',borderRadius:6,fontSize:12,
                              background:C.bgCard,border:`1px solid ${C.border}`,
                              color:C.ink1,outline:'none',fontFamily:C.fontMono,textAlign:'right' }}/>
                  <span style={{ fontSize:11,color:C.ink3,width:48 }}>{ch.unit}</span>
                  <button onClick={()=>setChallengeOverride(ch.id,{ enabled:!enabled })}
                    style={{ padding:'4px 10px',borderRadius:6,fontSize:11,cursor:'pointer',border:'none',
                              background:enabled?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.1)',
                              color:enabled?C.success:C.danger,fontWeight:500 }}>
                    {enabled?'Activo':'Inactivo'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Custom challenges ── */}
      <Section title="Mis desafíos personalizados">
        <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:10 }}>
          <button onClick={()=>setNewChall(true)}
            style={{ padding:'6px 14px',borderRadius:8,background:C.accent,border:'none',color:C.onAccent,fontSize:12,fontWeight:500,cursor:'pointer' }}>
            + Nuevo desafío
          </button>
        </div>
        {(newChall||!!editChallId) && (
          <div style={{ padding:16,borderRadius:12,background:C.bgSurface,border:`1px solid color-mix(in srgb, ${C.accent} 19%, transparent)`,marginBottom:12 }}>
            <div style={{ display:'grid',gap:10 }}>
              <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginBottom:4 }}>
                {ICONS.map(ic=>(
                  <button key={ic} onClick={()=>setNewChallForm(f=>({...f,icon:ic}))}
                    style={{ width:34,height:34,borderRadius:7,fontSize:17,
                              border:`2px solid ${newChallForm.icon===ic?C.accent:C.border}`,
                              background:newChallForm.icon===ic?`rgba(139,92,246,0.15)`:'transparent',
                              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    {ic}
                  </button>
                ))}
              </div>
              <input value={newChallForm.title} onChange={e=>setNewChallForm(f=>({...f,title:e.target.value}))}
                placeholder="Título del desafío *"
                style={{ padding:'7px 12px',borderRadius:8,fontSize:13,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none' }}/>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                <div style={{ display:'flex',gap:6 }}>
                  <input type="number" min={1} value={newChallForm.target}
                    onChange={e=>setNewChallForm(f=>({...f,target:Number(e.target.value)}))}
                    style={{ flex:1,padding:'7px 10px',borderRadius:8,fontSize:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',textAlign:'right' }}/>
                  <select value={newChallForm.unit} onChange={e=>setNewChallForm(f=>({...f,unit:e.target.value}))}
                    style={{ flex:1,padding:'7px 8px',borderRadius:8,fontSize:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',cursor:'pointer' }}>
                    {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex',gap:6 }}>
                  <input type="date" value={newChallForm.deadline} onChange={e=>setNewChallForm(f=>({...f,deadline:e.target.value}))}
                    style={{ flex:2,padding:'7px 10px',borderRadius:8,fontSize:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none' }}/>
                  <input type="number" min={0} value={newChallForm.xpReward}
                    onChange={e=>setNewChallForm(f=>({...f,xpReward:Number(e.target.value)}))}
                    placeholder="XP"
                    style={{ flex:1,padding:'7px 8px',borderRadius:8,fontSize:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',textAlign:'right' }}/>
                </div>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={saveChallenge} disabled={!newChallForm.title||newChallForm.target<1}
                  style={{ padding:'6px 14px',borderRadius:8,background:C.accent,border:'none',color:C.onAccent,cursor:'pointer',fontSize:13,fontWeight:500,opacity:newChallForm.title&&newChallForm.target>=1?1:0.5 }}>
                  {editChallId?'Guardar cambios':'Crear desafío'}
                </button>
                <button onClick={()=>{ setNewChall(false); setEditChallId(null); }}
                  style={{ padding:'6px 14px',borderRadius:8,background:'transparent',border:`1px solid ${C.border}`,color:C.ink3,cursor:'pointer',fontSize:13 }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {(customChallenges as any[]).length === 0 && !newChall ? (
          <div style={{ textAlign:'center',padding:'20px',background:C.bgSurface,borderRadius:10,border:`1px dashed ${C.border}`,color:C.ink4 }}>
            <p style={{ fontSize:13,color:C.ink3 }}>No hay desafíos personalizados todavía</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            {(customChallenges as any[]).map((ch:any) => (
              <div key={ch.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
                                         borderRadius:9,background:C.bgSurface,border:`1px solid ${C.border}` }}>
                <span style={{ fontSize:18,flexShrink:0 }}>{ch.icon}</span>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:13,fontWeight:500,color:C.ink1 }}>{ch.title}</p>
                  <p style={{ fontSize:11,color:C.ink3,fontFamily:C.fontMono }}>Meta: {ch.target} {ch.unit} · +{ch.xpReward} XP</p>
                </div>
                <button onClick={()=>{ setEditChallId(ch.id); setNewChallForm({...ch}); setNewChall(false); }}
                  style={{ padding:'3px 8px',borderRadius:6,background:'transparent',border:`1px solid ${C.border}`,color:C.ink3,cursor:'pointer',fontSize:11,flexShrink:0 }}>
                  ✏️
                </button>
                <button onClick={()=>{ if(confirm('¿Eliminar?')) setCustomChallenges((customChallenges as any[]).filter(c=>c.id!==ch.id)); }}
                  style={{ padding:'3px 8px',borderRadius:6,background:'transparent',border:`1px solid rgba(239,68,68,0.2)`,color:C.danger,cursor:'pointer',fontSize:11,flexShrink:0 }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Categories ── */}
      <Section title="Categorías de logros">
        <p style={{ fontSize:12,color:C.ink4,marginBottom:12 }}>
          Personalizá el nombre y color de cada categoría.
        </p>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
          {allCategories.map(cat => {
            const ov      = categoryOverrides[cat] || {};
            const label   = ov.label || cat;
            const color   = ov.color || CATEGORY_COLOR[cat] || C.accent;
            const isEdit  = editCat === cat;
            return (
              <div key={cat} style={{ display:'flex',alignItems:'center',gap:10,
                                       padding:'8px 12px',borderRadius:9,background:C.bgSurface,
                                       border:`1px solid ${C.border}` }}>
                <div style={{ width:10,height:10,borderRadius:'50%',background:color,flexShrink:0 }}/>
                {isEdit ? (
                  <>
                    <input value={catForm.label} onChange={e=>setCatForm(f=>({...f,label:e.target.value}))}
                      placeholder={cat}
                      style={{ flex:1,padding:'4px 8px',borderRadius:6,fontSize:12,
                                background:C.bgCard,border:`1px solid ${C.accent}`,color:C.ink1,outline:'none' }}/>
                    <input type="color" value={catForm.color||color}
                      onChange={e=>setCatForm(f=>({...f,color:e.target.value}))}
                      style={{ width:28,height:28,borderRadius:6,border:`1px solid ${C.border}`,cursor:'pointer',background:'none' }}/>
                    <button onClick={()=>{ setCategoryOverride(cat,catForm); setEditCat(null); }}
                      style={{ padding:'3px 8px',borderRadius:6,background:C.accent,border:'none',color:C.onAccent,cursor:'pointer',fontSize:11 }}>✓</button>
                    <button onClick={()=>setEditCat(null)}
                      style={{ padding:'3px 8px',borderRadius:6,background:'transparent',border:`1px solid ${C.border}`,color:C.ink3,cursor:'pointer',fontSize:11 }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex:1,fontSize:13,color:C.ink2 }}>{label}</span>
                    <button onClick={()=>{ setEditCat(cat); setCatForm({label,color}); }}
                      style={{ padding:'3px 10px',borderRadius:6,background:'transparent',border:`1px solid ${C.border}`,color:C.ink3,cursor:'pointer',fontSize:11 }}>
                      ✏️ Editar
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Built-in achievements override ── */}
      <Section title="Logros predefinidos" defaultOpen={false}>
        <p style={{ fontSize:12,color:C.ink4,marginBottom:12 }}>
          Editá título, descripción o desbloqueá manualmente cualquier logro.
        </p>
        <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
          {autoAchievements.map(a => {
            const ov     = achievementOverrides.find(o=>o.id===a.id);
            const isEdit = editingAch === a.id;
            const cfg    = RARITY_CONFIG[a.rarity];
            return (
              <div key={a.id} style={{ padding:'10px 12px',borderRadius:9,background:C.bgSurface,
                                        border:`1px solid ${a.unlocked?cfg.color+'30':C.border}`,
                                        opacity:a.unlocked?1:0.65 }}>
                {isEdit ? (
                  <div style={{ display:'grid',gap:8 }}>
                    <input value={achForm.title} onChange={e=>setAchForm(f=>({...f,title:e.target.value}))}
                      style={{ width:'100%',padding:'6px 10px',borderRadius:7,fontSize:12,
                                background:C.bgCard,border:`1px solid ${C.accent}`,color:C.ink1,outline:'none' }}/>
                    <input value={achForm.description} onChange={e=>setAchForm(f=>({...f,description:e.target.value}))}
                      style={{ width:'100%',padding:'6px 10px',borderRadius:7,fontSize:12,
                                background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none' }}/>
                    <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}>
                      <input type="checkbox" checked={achForm.manualUnlock}
                        onChange={e=>setAchForm(f=>({...f,manualUnlock:e.target.checked}))}
                        style={{ accentColor:C.accent }}/>
                      <span style={{ fontSize:12,color:C.ink2 }}>Marcar como desbloqueado</span>
                    </label>
                    <div style={{ display:'flex',gap:6 }}>
                      <button onClick={()=>{ setAchievementOverride(a.id,achForm); setEditingAch(null); }}
                        style={{ padding:'4px 12px',borderRadius:7,background:C.accent,border:'none',color:C.onAccent,cursor:'pointer',fontSize:12 }}>
                        Guardar
                      </button>
                      <button onClick={()=>setEditingAch(null)}
                        style={{ padding:'4px 12px',borderRadius:7,background:'transparent',border:`1px solid ${C.border}`,color:C.ink3,cursor:'pointer',fontSize:12 }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <span style={{ fontSize:9,fontWeight:600,color:cfg.color,textTransform:'uppercase',
                                    letterSpacing:'0.06em',width:52,flexShrink:0 }}>{cfg.label}</span>
                    <div style={{ flex:1,minWidth:0 }}>
                      <p style={{ fontSize:12,fontWeight:500,color:C.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                        {a.title} {a.unlocked?'✓':''}
                      </p>
                    </div>
                    <button onClick={()=>{ setEditingAch(a.id); setAchForm({title:a.title,description:a.description,manualUnlock:ov?.manualUnlock||false}); }}
                      style={{ padding:'3px 10px',borderRadius:6,background:'transparent',border:`1px solid ${C.border}`,color:C.ink3,cursor:'pointer',fontSize:11,flexShrink:0 }}>
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Custom achievements ── */}
      <Section title="Mis logros personalizados">
        <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:10 }}>
          <button onClick={()=>setNewCustAch(true)}
            style={{ padding:'6px 14px',borderRadius:8,background:C.accent,border:'none',color:C.onAccent,fontSize:12,fontWeight:500,cursor:'pointer' }}>
            + Crear logro
          </button>
        </div>
        {(newCustAch||!!editingCustAch) && (
          <div style={{ padding:16,borderRadius:12,background:C.bgSurface,border:`1px solid color-mix(in srgb, ${C.accent} 19%, transparent)`,marginBottom:12 }}>
            <div style={{ display:'grid',gap:10 }}>
              <input value={custAchForm.title} onChange={e=>setCustAchForm(f=>({...f,title:e.target.value}))}
                placeholder="Título del logro *"
                style={{ padding:'7px 12px',borderRadius:8,fontSize:13,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none' }}/>
              <input value={custAchForm.description} onChange={e=>setCustAchForm(f=>({...f,description:e.target.value}))}
                placeholder="Descripción"
                style={{ padding:'7px 12px',borderRadius:8,fontSize:13,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none' }}/>
              <input value={custAchForm.hint} onChange={e=>setCustAchForm(f=>({...f,hint:e.target.value}))}
                placeholder="Pista (cómo desbloquearlo)"
                style={{ padding:'7px 12px',borderRadius:8,fontSize:13,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none' }}/>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:8 }}>
                <select value={custAchForm.category} onChange={e=>setCustAchForm(f=>({...f,category:e.target.value}))}
                  style={{ padding:'7px 10px',borderRadius:8,fontSize:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',cursor:'pointer' }}>
                  {allCategories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
                  <option value="Mis logros">Mis logros</option>
                </select>
                <select value={custAchForm.rarity} onChange={e=>setCustAchForm(f=>({...f,rarity:e.target.value as Rarity}))}
                  style={{ padding:'7px 10px',borderRadius:8,fontSize:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',cursor:'pointer' }}>
                  {RARITY_OPTIONS.map(r=><option key={r} value={r}>{RARITY_CONFIG[r].label}</option>)}
                </select>
                <input type="number" min={0} value={custAchForm.xp}
                  onChange={e=>setCustAchForm(f=>({...f,xp:Number(e.target.value)}))}
                  placeholder="XP"
                  style={{ padding:'7px 10px',borderRadius:8,fontSize:12,background:C.bgCard,border:`1px solid ${C.border}`,color:C.ink1,outline:'none',textAlign:'right' }}/>
              </div>
              <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}>
                <input type="checkbox" checked={custAchForm.unlocked}
                  onChange={e=>setCustAchForm(f=>({...f,unlocked:e.target.checked}))}
                  style={{ accentColor:C.accent }}/>
                <span style={{ fontSize:12,color:C.ink2 }}>Ya desbloqueado</span>
              </label>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={saveCustomAch} disabled={!custAchForm.title}
                  style={{ padding:'6px 14px',borderRadius:8,background:C.accent,border:'none',color:C.onAccent,cursor:'pointer',fontSize:13,fontWeight:500,opacity:custAchForm.title?1:0.5 }}>
                  {editingCustAch?'Guardar cambios':'Crear logro'}
                </button>
                <button onClick={()=>{ setNewCustAch(false); setEditingCustAch(null); }}
                  style={{ padding:'6px 14px',borderRadius:8,background:'transparent',border:`1px solid ${C.border}`,color:C.ink3,cursor:'pointer',fontSize:13 }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {(customAchievements as any[]).length === 0 && !newCustAch ? (
          <div style={{ textAlign:'center',padding:'20px',background:C.bgSurface,borderRadius:10,border:`1px dashed ${C.border}`,color:C.ink4 }}>
            <p style={{ fontSize:13,color:C.ink3 }}>No hay logros personalizados todavía</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            {(customAchievements as any[]).map((a:any) => (
              <div key={a.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
                                        borderRadius:9,background:C.bgSurface,
                                        border:`1px solid ${a.unlocked?RARITY_CONFIG[a.rarity as Rarity].color+'30':C.border}`,
                                        opacity:a.unlocked?1:0.7 }}>
                <span style={{ fontSize:9,fontWeight:600,color:RARITY_CONFIG[a.rarity as Rarity].color,
                                 textTransform:'uppercase',letterSpacing:'0.06em',width:52,flexShrink:0 }}>
                  {RARITY_CONFIG[a.rarity as Rarity].label}
                </span>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:12,fontWeight:500,color:C.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {a.title} {a.unlocked?'✓':''}
                  </p>
                  <p style={{ fontSize:10,color:C.ink4 }}>{a.category}</p>
                </div>
                <button onClick={()=>{ setEditingCustAch(a.id); setCustAchForm({...a}); }}
                  style={{ padding:'3px 8px',borderRadius:6,background:'transparent',border:`1px solid ${C.border}`,color:C.ink3,cursor:'pointer',fontSize:11,flexShrink:0 }}>
                  ✏️
                </button>
                <button onClick={()=>{ if(confirm('¿Eliminar?')) deleteCustomAchievement(a.id); }}
                  style={{ padding:'3px 8px',borderRadius:6,background:'transparent',border:`1px solid rgba(239,68,68,0.2)`,color:C.danger,cursor:'pointer',fontSize:11,flexShrink:0 }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
