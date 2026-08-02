import { useState } from 'react';
import { useStore } from '../store';
import { C, Card, SectionTitle } from './ui';
import { usePersistedState } from '../lib/usePersistedState';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`,
                   borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: C.ink3, marginBottom: 4 }}>{label}</p>
      <p style={{ color: C.accent, fontFamily:C.fontMono }}>
        {payload[0].value.toLocaleString('es')} páginas
      </p>
    </div>
  );
};

export function MonthlyPagesTracker({ year }: { year: number }) {
  const monthlyPages    = useStore(s => s.monthlyPages);
  const setMonthlyPages = useStore(s => s.setMonthlyPages);
  const isHistoric      = year === 0;

  const [editing, setEditing] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [noteDismissed, setNoteDismissed] = usePersistedState('monthly-pages-note-dismissed', false);

  // Build chart data
  const chartData = isHistoric
    ? // Historic: show all months across all years sorted
      [...monthlyPages].filter(m => m && m.yearMonth).sort((a,b)=>a.yearMonth.localeCompare(b.yearMonth)).map(m=>({
        month: m.yearMonth,
        páginas: m.pages,
        key: m.yearMonth,
      }))
    : MONTHS.map((month, i) => {
        const key = `${year}-${String(i + 1).padStart(2, '0')}`;
        const entry = monthlyPages.find(m => m.yearMonth === key);
        return { month, páginas: entry?.pages || 0, key };
      });

  const maxPages = Math.max(...chartData.map(d => d.páginas), 1);
  const totalManual = chartData.reduce((a, d) => a + d.páginas, 0);

  function startEdit(key: string) {
    const entry = monthlyPages.find(m => m.yearMonth === key);
    setInputVal(entry ? String(entry.pages) : '');
    setInputNote(entry?.notes || '');
    setEditing(key);
  }

  function saveEdit(key: string) {
    const pages = Number(inputVal);
    if (pages >= 0) setMonthlyPages(key, pages, inputNote);
    setEditing(null);
  }

  const now = new Date();
  const currentKey = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionTitle>Páginas por mes · {year}</SectionTitle>
        {totalManual > 0 && (
          <span style={{ fontSize: 11, color: C.ink3, fontFamily:C.fontMono }}>
            {totalManual.toLocaleString('es')} págs. totales
          </span>
        )}
      </div>

      {/* Info note — manual entry isn't obvious, especially compared to every
          other stat on this page which is calculated automatically. Dismissible,
          stays dismissed (localStorage) once closed. */}
      {!noteDismissed && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px',
                      borderRadius:10, background:'var(--rx-accent-mid)',
                      border:`1px solid color-mix(in srgb, ${C.accent} 25%, transparent)`,
                      marginBottom:14 }}>
          <span style={{ fontSize:14, lineHeight:1, flexShrink:0, marginTop:1 }}>ℹ️</span>
          <p style={{ fontSize:11.5, color:C.ink2, lineHeight:1.5, flex:1 }}>
            Este bloque se carga de forma manual — a diferencia del resto de las estadísticas,
            no se calcula solo a partir de tus sesiones de lectura. Hacé click en un mes para cargar las páginas leídas.
          </p>
          <button onClick={()=>setNoteDismissed(true)} title="Cerrar"
            style={{ background:'none', border:'none', cursor:'pointer', color:C.ink3, fontSize:14,
                      lineHeight:1, padding:2, flexShrink:0 }}>✕</button>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} barSize={20} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.ink3 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.ink3 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
          <Bar dataKey="páginas" radius={[4, 4, 0, 0]}>
            {chartData.map((d, i) => {
              const isCurrent = d.key === currentKey;
              let fill = C.bgHover;
              if (d.páginas > 0) {
                // Scale intensity 40%–100% by relative volume so low (but real)
                // months stay clearly visible instead of blending into the background.
                const ratio = maxPages > 0 ? d.páginas / maxPages : 0;
                const pct = Math.round(40 + ratio * 60);
                fill = `color-mix(in srgb, ${C.accent} ${pct}%, ${C.bgSurface})`;
              }
              return (
                <Cell key={i} fill={fill}
                  stroke={isCurrent ? C.accent : 'none'}
                  strokeWidth={isCurrent ? 1.5 : 0} />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Monthly grid editor — only in year view */}
      {!isHistoric && (
        <>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {chartData.map(d => {
              const isEditing = editing === d.key;
              const isCurrentMonth = d.key === currentKey;
              const hasData = d.páginas > 0;
              return (
                <div key={d.key}
                  style={{
                    padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${isCurrentMonth ? `color-mix(in srgb, ${C.accent} 25%, transparent)` : hasData ? `color-mix(in srgb, ${C.accent} 13%, transparent)` : C.border}`,
                    background: isCurrentMonth ? 'var(--rx-accent-mid)' : C.bgSurface,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onClick={() => !isEditing && startEdit(d.key)}>
                  <p style={{ fontSize: 10, color: C.ink3, fontWeight: 500,
                               textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d.month.length > 7 ? d.month : d.month}
                  </p>
                  {isEditing ? (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: 4 }}>
                      <input autoFocus type="number" min={0} value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') saveEdit(d.key); if (e.key==='Escape') setEditing(null); }}
                        placeholder="0"
                        style={{ width:'100%', padding:'3px 6px', borderRadius:4, fontSize:12,
                                  background:C.bgCard, border:`1px solid ${C.accent}`,
                                  color:C.ink1, outline:'none', fontFamily:C.fontMono }}/>
                      <div style={{ display:'flex', gap:4, marginTop:4 }}>
                        <button onClick={() => saveEdit(d.key)}
                          style={{ flex:1, padding:'3px 0', borderRadius:4, fontSize:10,
                                    background:C.accent, border:'none', color:C.onAccent, cursor:'pointer' }}>✓</button>
                        <button onClick={() => setEditing(null)}
                          style={{ flex:1, padding:'3px 0', borderRadius:4, fontSize:10,
                                    background:C.bgHover, border:'none', color:C.ink3, cursor:'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize:15, fontWeight:600, fontFamily:C.fontMono,
                                 color:hasData?C.ink1:C.ink4, marginTop:2 }}>
                      {hasData ? d.páginas.toLocaleString('es') : '—'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: C.ink4, marginTop: 10 }}>
            Click en cualquier mes para editar las páginas leídas ese mes
          </p>
        </>
      )}
      {isHistoric && monthlyPages.length === 0 && (
        <p style={{ fontSize: 12, color: C.ink3, marginTop: 8 }}>
          Registrá páginas en la vista anual para ver el histórico aquí.
        </p>
      )}
    </Card>
  );
}
