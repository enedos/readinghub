import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { C } from './ui';

// ── Reading Heatmap ───────────────────────────────────────────
// Shows last 365 days like a GitHub contribution graph
export function ReadingHeatmap({ sessions }: { sessions: any[] }) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const dayMap = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => {
      const d = s.date?.slice(0, 10);
      if (d) map[d] = (map[d] || 0) + (s.pages || 0);
    });
    return map;
  }, [sessions]);

  const maxPages = Math.max(...Object.values(dayMap), 1);

  // Build last 364 days + today (52 weeks, starting from Sunday)
  const today = new Date();
  today.setHours(0,0,0,0);
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - 363);
  // Align to Sunday
  startDay.setDate(startDay.getDate() - startDay.getDay());

  const weeks: { date: Date; key: string }[][] = [];
  let week: { date: Date; key: string }[] = [];
  const cursor = new Date(startDay);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    week.push({ date: new Date(cursor), key });
    if (week.length === 7) { weeks.push(week); week = []; }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  function getColor(key: string) {
    const pages = dayMap[key] || 0;
    if (pages === 0) return C.bgSurface;
    const intensity = Math.min(pages / maxPages, 1);
    if (intensity < 0.25) return 'rgba(139,92,246,0.25)';
    if (intensity < 0.5)  return 'rgba(139,92,246,0.5)';
    if (intensity < 0.75) return 'rgba(139,92,246,0.75)';
    return '#8B5CF6';
  }

  const fmtDate = (d: Date) => `${d.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]} ${d.getFullYear()}`;
  const DAYS = ['D','L','M','X','J','V','S'];
  const activeDays = Object.keys(dayMap).length;
  const totalPages = Object.values(dayMap).reduce((a,b)=>a+b,0);

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    if (firstDay.date.getDate() <= 7) {
      monthLabels.push({
        label: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][firstDay.date.getMonth()],
        col: wi,
      });
    }
  });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', gap:20 }}>
          <div>
            <p style={{ fontSize:20, fontWeight:300, color:C.accent, fontFamily:C.fontMono }}>{activeDays}</p>
            <p style={{ fontSize:10, color:C.ink4, textTransform:'uppercase', letterSpacing:'0.06em' }}>días activos</p>
          </div>
          <div>
            <p style={{ fontSize:20, fontWeight:300, color:C.success, fontFamily:C.fontMono }}>{totalPages.toLocaleString('es')}</p>
            <p style={{ fontSize:10, color:C.ink4, textTransform:'uppercase', letterSpacing:'0.06em' }}>páginas registradas</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10, color:C.ink4 }}>Menos</span>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <div key={v} style={{ width:10, height:10, borderRadius:2, background:v===0?C.bgSurface:`rgba(139,92,246,${v})` }}/>
          ))}
          <span style={{ fontSize:10, color:C.ink4 }}>Más</span>
        </div>
      </div>

      <div style={{ overflowX:'auto', paddingBottom:4 }}>
        <div style={{ display:'flex', gap:0, position:'relative' }}>
          {/* Day labels */}
          <div style={{ display:'flex', flexDirection:'column', gap:2, paddingTop:16, marginRight:4 }}>
            {DAYS.map((d,i) => (
              <div key={d} style={{ height:11, fontSize:8, color:i%2===1?C.ink4:'transparent', lineHeight:'11px' }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {/* Month labels */}
            <div style={{ display:'flex', height:14, position:'relative', marginBottom:2 }}>
              {monthLabels.map(ml => (
                <div key={`${ml.label}-${ml.col}`}
                  style={{ position:'absolute', left: ml.col * 13, fontSize:9, color:C.ink4, whiteSpace:'nowrap' }}>
                  {ml.label}
                </div>
              ))}
            </div>
            {/* Week columns */}
            <div style={{ display:'flex', gap:2 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  {week.map(({ date, key }) => {
                    const pages = dayMap[key] || 0;
                    const isFuture = date > today;
                    const isHov = hoveredDay === key;
                    return (
                      <div key={key}
                        style={{
                          width:11, height:11, borderRadius:2,
                          background: isFuture ? 'transparent' : getColor(key),
                          border: isHov ? `1px solid ${C.accent}` : `1px solid transparent`,
                          cursor: pages > 0 ? 'pointer' : 'default',
                          transition:'border-color 0.1s',
                          position:'relative',
                          opacity: isFuture ? 0 : 1,
                        }}
                        onMouseEnter={() => setHoveredDay(key)}
                        onMouseLeave={() => setHoveredDay(null)}>
                        {isHov && pages > 0 && (
                          <div style={{
                            position:'absolute', bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)',
                            background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:7,
                            padding:'6px 10px', fontSize:11, color:C.ink2, whiteSpace:'nowrap',
                            zIndex:50, boxShadow:`0 4px 12px rgba(0,0,0,0.3)`,
                          }}>
                            <p style={{ fontWeight:600, color:C.ink1 }}>{fmtDate(date)}</p>
                            <p style={{ color:C.accent }}>{pages} páginas</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Session log for a specific book ──────────────────────────
export function BookSessionLog({ bookId, totalPages }: { bookId: string; totalPages: number }) {
  const sessions    = useStore(s => s.sessions).filter(s => s.bookId === bookId);
  const addSession  = useStore(s => s.addSession);
  const deleteSession = useStore(s => s.deleteSession);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), pages: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const sorted = [...sessions].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const totalLogged = sessions.reduce((a,s)=>a+Number(s.pages||0),0);
  const avgPages = sessions.length ? Math.round(totalLogged/sessions.length) : 0;

  function fmtDate(s: string) {
    if (!s) return '';
    const [y,m,d] = s.split('-');
    return `${parseInt(d)} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][parseInt(m)-1]} ${y}`;
  }

  async function handleAdd() {
    if (!form.date || !form.pages) return;
    setSaving(true);
    try {
      await addSession({ bookId, date: form.date, pages: Number(form.pages), notes: form.notes });
      setForm({ date: new Date().toISOString().slice(0,10), pages: '', notes: '' });
      setShowForm(false);
    } finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    padding:'7px 10px', borderRadius:8, fontSize:12,
    background:C.bgSurface, border:`1px solid ${C.border}`,
    color:C.ink1, outline:'none', boxSizing:'border-box',
  };

  return (
    <div>
      {/* Summary stats */}
      {sessions.length > 0 && (
        <div style={{ display:'flex', gap:20, marginBottom:16, padding:'12px 16px', borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}` }}>
          {[
            { label:'Sesiones', value: sessions.length },
            { label:'Páginas/sesión', value: avgPages },
            { label:'Total registradas', value: `${totalLogged} / ${totalPages}` },
          ].map(s=>(
            <div key={s.label}>
              <p style={{ fontSize:18, fontWeight:300, color:C.accent, fontFamily:C.fontMono }}>{s.value}</p>
              <p style={{ fontSize:10, color:C.ink4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add session form */}
      {showForm ? (
        <div style={{ padding:'14px 16px', borderRadius:12, background:C.bgSurface, border:`1px solid color-mix(in srgb, ${C.accent} 25%, transparent)`, marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:10, color:C.ink3, letterSpacing:'0.06em', display:'block', marginBottom:4 }}>FECHA</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                style={inputStyle} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div>
              <label style={{ fontSize:10, color:C.ink3, letterSpacing:'0.06em', display:'block', marginBottom:4 }}>PÁGINAS LEÍDAS</label>
              <input type="number" min={1} max={totalPages} value={form.pages} onChange={e=>setForm(f=>({...f,pages:e.target.value}))}
                placeholder="ej: 45" style={{...inputStyle, width:'100%'}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:10, color:C.ink3, letterSpacing:'0.06em', display:'block', marginBottom:4 }}>NOTA (opcional)</label>
              <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                placeholder="Reflexión sobre lo leído..." style={{...inputStyle, width:'100%'}}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={()=>setShowForm(false)}
              style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.ink3, fontSize:12, cursor:'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleAdd} disabled={!form.date||!form.pages||saving}
              style={{ padding:'6px 14px', borderRadius:8, border:'none', background:C.accent, color:C.onAccent, fontSize:12, cursor:'pointer', opacity:(!form.date||!form.pages||saving)?0.5:1 }}>
              {saving ? 'Guardando…' : '+ Registrar sesión'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowForm(true)}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10, border:`1px dashed ${C.border}`, background:'transparent', color:C.ink3, fontSize:12, cursor:'pointer', marginBottom:14, transition:'all 0.2s', width:'100%', justifyContent:'center' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.accent;(e.currentTarget as HTMLElement).style.color=C.accent;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.color=C.ink3;}}>
          + Registrar sesión de lectura
        </button>
      )}

      {/* Session list */}
      {sorted.length === 0 ? (
        <p style={{ fontSize:12, color:C.ink4, textAlign:'center', padding:'16px 0', fontStyle:'italic' }}>Sin sesiones registradas todavía.</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {sorted.map(s => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}`,  }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:C.accent, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:500, color:C.ink1, fontFamily:C.fontMono }}>{s.pages} páginas</span>
                  <span style={{ fontSize:11, color:C.ink3 }}>·</span>
                  <span style={{ fontSize:11, color:C.ink3 }}>{fmtDate(s.date)}</span>
                </div>
                {s.notes && <p style={{ fontSize:11, color:C.ink3, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.notes}</p>}
              </div>
              <button onClick={()=>{ if(confirm('¿Eliminar sesión?')) deleteSession(s.id); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:C.ink4, fontSize:16, opacity:0.5, flexShrink:0, padding:0 }}
                onMouseEnter={e=>(e.currentTarget.style.opacity='1')} onMouseLeave={e=>(e.currentTarget.style.opacity='0.5')}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
