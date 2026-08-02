import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid, PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { useStore } from '../store';
import { C, Card, SectionTitle } from '../components/ui';
import { MonthlyPagesTracker } from '../components/MonthlyPagesTracker';
import { ReadingHeatmap } from '../components/SessionTracker';
import { PIE_COLORS } from '../lib/colors';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];


// ── Shared Tooltip ────────────────────────────────────────────
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10,
                   padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:C.ink3, marginBottom:4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color:p.color||C.accent, fontFamily:C.fontMono }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('es') : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Chart type selector ───────────────────────────────────────
type ChartType = 'bar' | 'line' | 'area' | 'radar';

function ChartPicker({ value, onChange }: { value: ChartType; onChange: (t: ChartType) => void }) {
  return (
    <div style={{ display:'flex', gap:2, background:C.bgSurface, borderRadius:7,
                   padding:2, border:`1px solid ${C.border}` }}>
      {(['bar','line','area','radar'] as ChartType[]).map(t => (
        <button key={t} onClick={() => onChange(t)}
          style={{ padding:'3px 10px', borderRadius:5, border:'none', cursor:'pointer',
                    fontSize:11, fontWeight:500, transition:'all 0.15s',
                    background:value===t?C.accent:'transparent',
                    color:value===t?C.onAccent:C.ink3 }}>
          {t==='bar'?'Barras':t==='line'?'Línea':t==='area'?'Área':'Radar'}
        </button>
      ))}
    </div>
  );
}

// ── Reusable chart ────────────────────────────────────────────
function Chart({ data, dataKey, color, type, height=140, name }: {
  data: any[]; dataKey: string; color: string;
  type: ChartType; height?: number; name?: string;
}) {
  const m = { top:4, right:4, left:-28, bottom:0 };
  const ax = <>
    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
    <XAxis dataKey="month" tick={{ fontSize:10, fill:C.ink3 }} axisLine={false} tickLine={false}/>
    <YAxis allowDecimals={false} tick={{ fontSize:10, fill:C.ink3 }} axisLine={false} tickLine={false}/>
    <Tooltip content={<Tip/>} cursor={{ fill:'rgba(139,92,246,0.05)' }}/>
  </>;
  const maxVal = Math.max(...data.map(d => d[dataKey]||0), 1);

  if (type === 'bar') return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={16} margin={m}>
        {ax}
        <Bar dataKey={dataKey} name={name||dataKey} radius={[4,4,0,0]}>
          {data.map((e,i) => <Cell key={i} fill={e[dataKey]===maxVal&&e[dataKey]>0?color:`${color}30`}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  if (type === 'line') return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={m}>
        {ax}
        <Line type="monotone" dataKey={dataKey} name={name||dataKey}
          stroke={color} strokeWidth={2} dot={{ fill:color, r:3 }} activeDot={{ r:5 }}/>
      </LineChart>
    </ResponsiveContainer>
  );
  if (type === 'radar') {
    const radarData = data.map(d => ({ subject: d.month, value: d[dataKey] || 0 }));
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={radarData}>
          <PolarGrid stroke={C.border}/>
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: C.ink3 }}/>
          <PolarRadiusAxis tick={{ fontSize: 9, fill: C.ink4 }} axisLine={false} tickLine={false}/>
          <Radar dataKey="value" name={name||dataKey} stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2}/>
          <Tooltip content={<Tip/>}/>
        </RadarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={m}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.02}/>
          </linearGradient>
        </defs>
        {ax}
        <Area type="monotone" dataKey={dataKey} name={name||dataKey}
          stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Section card with chart type selector ─────────────────────
function StatCard({ title, children, chartType, onChartType, extra }: {
  title: string; children: React.ReactNode;
  chartType?: ChartType; onChartType?: (t: ChartType) => void;
  extra?: React.ReactNode;
}) {
  return (
    <Card style={{ marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <SectionTitle>{title}</SectionTitle>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {extra}
          {chartType && onChartType && <ChartPicker value={chartType} onChange={onChartType}/>}
        </div>
      </div>
      {children}
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function StatsPage() {
  const books    = useStore(s => s.books);
  const sessions  = useStore((s: any) => s.sessions || []);
  const navigate = useNavigate();

  // Year selector — 0 = Histórico
  const allYears = useMemo(() => {
    const ys = new Set<number>();
    books.forEach(b => { if (b.end) ys.add(Number(b.end.slice(0,4))); });
    const arr = [...ys].sort((a,b) => b-a);
    if (!arr.includes(new Date().getFullYear())) arr.unshift(new Date().getFullYear());
    return arr;
  }, [books]);

  const [year,        setYear]        = useState(new Date().getFullYear());
  const [chartBooks,  setChartBooks]  = useState<ChartType>('bar');
  const [chartCumul,  setChartCumul]  = useState<ChartType>('area');
  const [activeTab,   setActiveTab]   = useState<'year'|'compare'|'historic'|'analysis'>('year');

  const finished = useMemo(() => books.filter(b => b.status==='finished'), [books]);
  const prevYear = year - 1;

  // ── Year data ────────────────────────────────────────────────
  const yearBooks = useMemo(() =>
    finished.filter(b => b.end?.startsWith(String(year))), [finished, year]);
  const prevBooks = useMemo(() =>
    finished.filter(b => b.end?.startsWith(String(prevYear))), [finished, prevYear]);

  const yearPages = yearBooks.reduce((a,b) => a+b.pages, 0);
  const prevPages = prevBooks.reduce((a,b) => a+b.pages, 0);
  const avgRating = (() => {
    const rated = yearBooks.filter(b => b.rating>0);
    return rated.length ? (rated.reduce((a,b)=>a+b.rating,0)/rated.length).toFixed(1) : '—';
  })();

  // ── Monthly data ─────────────────────────────────────────────
  const monthlyBooks = useMemo(() => MONTHS_SHORT.map((month,i) => {
    const key  = `${year}-${String(i+1).padStart(2,'0')}`;
    const keyP = `${prevYear}-${String(i+1).padStart(2,'0')}`;
    return { month,
      [year]:     finished.filter(b=>b.end?.startsWith(key)).length,
      [prevYear]: finished.filter(b=>b.end?.startsWith(keyP)).length,
    };
  }), [finished, year, prevYear]);

  // ── Cumulative ───────────────────────────────────────────────
  const cumulativeData = useMemo(() => {
    let acc = 0;
    return MONTHS_SHORT.map((month,i) => {
      const key = `${year}-${String(i+1).padStart(2,'0')}`;
      acc += finished.filter(b=>b.end?.startsWith(key)).length;
      return { month, total: acc };
    });
  }, [finished, year]);

  // ── Historic: books per year ──────────────────────────────────
  const historicByYear = useMemo(() => {
    return [...allYears].reverse().map(y => ({
      month: String(y),
      libros: finished.filter(b=>b.end?.startsWith(String(y))).length,
      páginas: finished.filter(b=>b.end?.startsWith(String(y))).reduce((a,b)=>a+b.pages,0),
    }));
  }, [finished, allYears]);

  // ── Genre pie ────────────────────────────────────────────────
  const genreData = useMemo(() => {
    const scope = year === 0 ? finished : yearBooks;
    const counts: Record<string,number> = {};
    scope.forEach(b => b.tags.forEach(t => { counts[t]=(counts[t]||0)+1; }));
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=>({name,value}));
  }, [finished, yearBooks, year]);

  // ── Top authors ───────────────────────────────────────────────
  const topAuthors = useMemo(() => {
    const scope = year === 0 ? finished : yearBooks;
    const counts: Record<string,number> = {};
    scope.forEach(b => {
      const a = b.author.includes(',')?b.author.split(',').reverse().join(' ').trim():b.author;
      counts[a]=(counts[a]||0)+1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  }, [finished, yearBooks, year]);

  function fmt(s: string) {
    if (!s) return '';
    const [,m,d] = s.split('-');
    return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m)-1]}`;
  }

  function diff(curr: number, prev: number) {
    if (!prev) return null;
    const d = Math.round(((curr-prev)/prev)*100);
    return { label: d>=0?`+${d}%`:`${d}%`, up: d>=0 };
  }

  const TABS = [
    { id:'year',    label:`${year}` },
    { id:'compare', label:'Comparativa' },
    { id:'historic',label:'Histórico' },
    { id:'analysis',label:'Análisis' },
  ];

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 80px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between',
                     marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}><span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>ESTADÍSTICAS</p>
          <h1 style={{ fontFamily:C.fontSans, fontSize:30, fontWeight:700, color:C.ink1, position:'relative', display:'inline-block', marginBottom:16 }}>
            Análisis de lectura
            <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                           background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
          </h1>
        </div>

        {/* Year + tabs */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
          {/* Year picker */}
          <div style={{ display:'flex', gap:3, background:C.bgCard, borderRadius:10,
                         padding:3, border:`1px solid ${C.border}`, flexWrap:'wrap' }}>
            {allYears.map(y => (
              <button key={y} onClick={()=>setYear(y)}
                style={{ padding:'5px 11px', borderRadius:8, border:'none', cursor:'pointer',
                          fontSize:12, fontWeight:500, transition:'all 0.15s',
                          background:year===y?C.accent:'transparent',
                          color:year===y?C.onAccent:C.ink3 }}>
                {y}
              </button>
            ))}
          </div>
          {/* View tabs */}
          <div style={{ display:'flex', gap:2, background:C.bgCard, borderRadius:8,
                         padding:2, border:`1px solid ${C.border}` }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setActiveTab(t.id as any)}
                style={{ padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer',
                          fontSize:12, fontWeight:500, transition:'all 0.15s',
                          background:activeTab===t.id?C.success:'transparent',
                          color:activeTab===t.id?C.onAccent:C.ink3 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB: Year ── */}
      {activeTab === 'year' && (
        <>
          {/* Metrics */}
          <div className="rx-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                                               gap:10, marginBottom:14 }}>
            {[
              { label:`Libros ${year}`, value:yearBooks.length, d:diff(yearBooks.length,prevBooks.length), color:C.accent },
              { label:'Páginas',        value:yearPages.toLocaleString('es'), d:diff(yearPages,prevPages), color:C.success },
              { label:'Rating medio',   value:avgRating, d:null, color:C.xp },
              { label:'Total leídos',   value:finished.length, d:null, color:C.info },
            ].map(m => (
              <div key={m.label} style={{
                background:`linear-gradient(160deg, color-mix(in srgb, ${m.color} 8%, transparent), transparent 60%)`,
                border:`1px solid ${C.border}`, borderRadius:14, padding:'16px 18px 14px',
                borderTop:`2px solid ${m.color}`, transition:'transform 0.15s,border-color 0.15s',
              }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor=m.color; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.borderColor=C.border; }}>
                <SectionTitle>{m.label}</SectionTitle>
                <p style={{ fontSize:26, fontWeight:600, color:m.color, fontFamily:C.fontMono, lineHeight:1 }}>{m.value}</p>
                {m.d && <p style={{ fontSize:11, color:m.d.up?C.success:C.danger, fontFamily:C.fontMono, marginTop:5 }}>
                  {m.d.label} vs {prevYear}
                </p>}
              </div>
            ))}
          </div>

          {/* Books per month */}
          <StatCard title={`Libros por mes · ${year}`} chartType={chartBooks} onChartType={setChartBooks}>
            <Chart data={monthlyBooks} dataKey={String(year)} color={C.accent}
              type={chartBooks} height={150} name="Libros"/>
          </StatCard>

          {/* Cumulative */}
          <StatCard title={`Progreso acumulado · ${year}`} chartType={chartCumul} onChartType={setChartCumul}>
            <Chart data={cumulativeData} dataKey="total" color={C.accent}
              type={chartCumul} height={130} name="Libros"/>
          </StatCard>

          {/* Manual pages tracker */}
          <MonthlyPagesTracker year={year}/>

          {/* Genre + Authors */}
          <div className="rx-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
            <Card>
              <SectionTitle>Géneros · {year}</SectionTitle>
              {genreData.length===0
                ? <p style={{color:C.ink3,fontSize:12,padding:'20px 0'}}>Sin datos este año</p>
                : <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <PieChart width={110} height={110}>
                      <Pie data={genreData} cx={55} cy={55} innerRadius={30} outerRadius={50}
                        dataKey="value" strokeWidth={0}>
                        {genreData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/>
                    </PieChart>
                    <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
                      {genreData.slice(0,5).map((g,i)=>(
                        <div key={g.name} style={{display:'flex',alignItems:'center',gap:7}}>
                          <div style={{width:7,height:7,borderRadius:'50%',flexShrink:0,background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                          <span style={{fontSize:11,color:C.ink2,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name}</span>
                          <span style={{fontSize:10,color:C.ink3,fontFamily:C.fontMono}}>{g.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
              }
            </Card>
            <Card>
              <SectionTitle>Autores · {year}</SectionTitle>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {topAuthors.length===0
                  ? <p style={{color:C.ink3,fontSize:12,padding:'20px 0'}}>Sin datos este año</p>
                  : topAuthors.map(([author,n],i)=>(
                    <div key={author} style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:10,color:C.ink4,fontFamily:C.fontMono,width:14,textAlign:'right',flexShrink:0}}>{i+1}</span>
                      <span style={{fontSize:12,color:C.ink2,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{author}</span>
                      <span style={{fontSize:11,color:C.accent,fontFamily:C.fontMono,flexShrink:0}}>{n}</span>
                    </div>
                  ))
                }
              </div>
            </Card>
          </div>

          {/* Book list this year */}
          {yearBooks.length > 0 && (
            <Card style={{ marginTop:12 }}>
              <SectionTitle>Libros leídos en {year} ({yearBooks.length})</SectionTitle>
              <div style={{ borderTop:`1px solid ${C.border}`, marginTop:4 }}>
                {[...yearBooks].sort((a,b)=>(b.end||'').localeCompare(a.end||'')).map(book => {
                  const days = book.start&&book.end
                    ? Math.round((new Date(book.end).getTime()-new Date(book.start).getTime())/86400000) : null;
                  const author = book.author.includes(',')?book.author.split(',').reverse().join(' ').trim():book.author;
                  return (
                    <div key={book.id} onClick={()=>navigate(`/books/${book.id}`)}
                      style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px 60px 70px',
                                gap:12, padding:'9px 8px', borderRadius:8, cursor:'pointer',
                                transition:'background 0.15s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background=C.bgHover)}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <div style={{minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:500,color:C.ink1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{book.title}</p>
                        <p style={{fontSize:11,color:C.ink3}}>{author}</p>
                      </div>
                      <p style={{fontSize:12,color:C.ink2}}>{fmt(book.end||'')}</p>
                      <p style={{fontSize:12,color:C.ink2,fontFamily:C.fontMono}}>{book.pages.toLocaleString()}</p>
                      <p style={{fontSize:12,color:days&&days<=7?C.success:C.ink2,fontFamily:C.fontMono}}>{days!=null?`${days}d`:'—'}</p>
                      <div style={{display:'flex',gap:1,justifyContent:'flex-end'}}>
                        {book.rating>0&&[1,2,3,4,5].map(i=>(
                          <svg key={i} width="10" height="10" viewBox="0 0 20 20" fill={i<=book.rating?C.xp:C.border}>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── TAB: Comparativa ── */}
      {activeTab === 'compare' && (
        <>
          <Card style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <SectionTitle>{year} vs {prevYear}</SectionTitle>
              <ChartPicker value={chartBooks} onChange={setChartBooks}/>
            </div>
            {/* Dual chart — now actually respects the type picker (bar/line/area/radar) */}
            <ResponsiveContainer width="100%" height={200}>
              {chartBooks === 'bar' ? (
                <BarChart data={monthlyBooks} margin={{top:4,right:4,left:-28,bottom:0}} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:C.ink3}} axisLine={false} tickLine={false}/>
                  <YAxis allowDecimals={false} tick={{fontSize:10,fill:C.ink3}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey={String(year)} name={String(year)} fill={C.accent} radius={[3,3,0,0]} barSize={10}/>
                  <Bar dataKey={String(prevYear)} name={String(prevYear)} fill={C.ink4} radius={[3,3,0,0]} barSize={10} fillOpacity={0.5}/>
                </BarChart>
              ) : chartBooks === 'radar' ? (
                <RadarChart data={monthlyBooks.map(d=>({ subject:d.month, [String(year)]:d[String(year)]||0, [String(prevYear)]:d[String(prevYear)]||0 }))}>
                  <PolarGrid stroke={C.border}/>
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:C.ink3 }}/>
                  <PolarRadiusAxis tick={{ fontSize:9, fill:C.ink4 }} axisLine={false} tickLine={false}/>
                  <Radar dataKey={String(year)} name={String(year)} stroke={C.accent} fill={C.accent} fillOpacity={0.2} strokeWidth={2}/>
                  <Radar dataKey={String(prevYear)} name={String(prevYear)} stroke={C.ink4} fill={C.ink4} fillOpacity={0.08} strokeWidth={1.5}/>
                  <Tooltip content={<Tip/>}/>
                </RadarChart>
              ) : chartBooks === 'area' ? (
                <AreaChart data={monthlyBooks} margin={{top:4,right:4,left:-28,bottom:0}}>
                  <defs>
                    <linearGradient id="grad-compare-curr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.accent} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={C.accent} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:C.ink3}} axisLine={false} tickLine={false}/>
                  <YAxis allowDecimals={false} tick={{fontSize:10,fill:C.ink3}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Area type="monotone" dataKey={String(year)} name={String(year)} stroke={C.accent} strokeWidth={2} fill="url(#grad-compare-curr)"/>
                  <Area type="monotone" dataKey={String(prevYear)} name={String(prevYear)} stroke={C.ink4} strokeWidth={1.5} fill="transparent" strokeDasharray="5 4"/>
                </AreaChart>
              ) : (
                <LineChart data={monthlyBooks} margin={{top:4,right:4,left:-28,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:C.ink3}} axisLine={false} tickLine={false}/>
                  <YAxis allowDecimals={false} tick={{fontSize:10,fill:C.ink3}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Line type="monotone" dataKey={String(year)} name={String(year)}
                    stroke={C.accent} strokeWidth={2.5} dot={{fill:C.accent,r:4}} activeDot={{r:6}}/>
                  <Line type="monotone" dataKey={String(prevYear)} name={String(prevYear)}
                    stroke={C.ink4} strokeWidth={1.5} strokeDasharray="5 4" dot={false}/>
                </LineChart>
              )}
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:20, marginTop:10, justifyContent:'center' }}>
              <span style={{ fontSize:12, color:C.ink2, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:16, height:2, background:C.accent, display:'inline-block', borderRadius:2 }}/>
                {year}: {yearBooks.length} libros
              </span>
              <span style={{ fontSize:12, color:C.ink4, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:16, height:2, background:C.ink4, display:'inline-block', borderRadius:2, opacity:0.6 }}/>
                {prevYear}: {prevBooks.length} libros
              </span>
            </div>
          </Card>

          {/* Summary compare table */}
          <Card>
            <SectionTitle>Resumen comparativo</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0 }}>
              <div style={{ fontSize:11, color:C.ink3, fontWeight:600, letterSpacing:'0.06em',
                             textTransform:'uppercase', padding:'8px 12px',
                             borderBottom:`1px solid ${C.border}` }}>Métrica</div>
              <div style={{ fontSize:11, color:C.accent, fontWeight:600, padding:'8px 12px', textAlign:'center',
                             borderBottom:`1px solid ${C.border}` }}>{year}</div>
              <div style={{ fontSize:11, color:C.ink4, fontWeight:600, padding:'8px 12px', textAlign:'center',
                             borderBottom:`1px solid ${C.border}` }}>{prevYear}</div>
              {[
                ['Libros', yearBooks.length, prevBooks.length],
                ['Páginas', yearPages.toLocaleString('es'), prevPages.toLocaleString('es')],
                ['Rating medio', avgRating, (() => { const r=prevBooks.filter(b=>b.rating>0); return r.length?(r.reduce((a,b)=>a+b.rating,0)/r.length).toFixed(1):'—'; })()],
                ['Autores distintos',
                  new Set(yearBooks.map(b=>b.author)).size,
                  new Set(prevBooks.map(b=>b.author)).size],
              ].map(([label, curr, prev]) => (
                <>{[label,curr,prev].map((v,i)=>(
                  <div key={i} style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}`,
                                         fontSize:13, color:i===0?C.ink2:i===1?C.ink1:C.ink4,
                                         textAlign:i===0?'left':'center', fontFamily:i>0?'monospace':'inherit' }}>
                    {v}
                  </div>
                ))}</>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── TAB: Histórico ── */}
      {activeTab === 'historic' && (
        <>
          <div className="rx-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:12, marginBottom:14 }}>
            {[
              { label:'Total leídos',   value:finished.length,                    color:C.accent },
              { label:'Total páginas',  value:finished.reduce((a,b)=>a+b.pages,0).toLocaleString('es'), color:C.success },
              { label:'Años activos',   value:allYears.filter(y=>finished.some(b=>b.end?.startsWith(String(y)))).length, color:C.info },
              { label:'Autores únicos', value:new Set(finished.map(b=>b.author)).size, color:C.xp },
            ].map(m => (
              <Card key={m.label}>
                <SectionTitle>{m.label}</SectionTitle>
                <p style={{fontSize:26,fontWeight:600,color:m.color,fontFamily:C.fontMono,lineHeight:1}}>{m.value}</p>
              </Card>
            ))}
          </div>

          {/* Books per year */}
          <StatCard title="Libros por año · histórico" chartType={chartBooks} onChartType={setChartBooks}>
            {historicByYear.length < 2
              ? <p style={{color:C.ink3,fontSize:12,padding:'20px 0'}}>
                  Necesitás datos de al menos 2 años para ver el histórico.
                </p>
              : <Chart data={historicByYear} dataKey="libros" color={C.accent}
                  type={chartBooks} height={160} name="Libros"/>
            }
          </StatCard>

          {/* Manual pages historic */}
          <MonthlyPagesTracker year={0}/>

          {/* Total stats */}


          {/* Páginas vs Rating scatter */}
          <Card style={{ marginTop:12 }}>
            <SectionTitle>Páginas vs Rating</SectionTitle>
            <p style={{ fontSize:11, color:C.ink4, marginBottom:10 }}>Cada punto es un libro. Eje X = páginas, eje Y = rating.</p>
            {finished.filter(b=>b.rating>0).length < 3
              ? <p style={{color:C.ink3,fontSize:12,padding:'20px 0'}}>Necesitás al menos 3 libros calificados.</p>
              : <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart margin={{top:4,right:16,left:-28,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis type="number" dataKey="pages" name="Páginas" tick={{fontSize:10,fill:C.ink3}} axisLine={false} tickLine={false}/>
                    <YAxis type="number" dataKey="rating" name="Rating" domain={[1,5]} tick={{fontSize:10,fill:C.ink3}} axisLine={false} tickLine={false}/>
                    <ZAxis range={[40,40]}/>
                    <Tooltip cursor={{strokeDasharray:'3 3'}} content={({active,payload})=>{
                      if(!active||!payload?.length) return null;
                      const d=payload[0].payload;
                      return <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 12px',fontSize:11}}>
                        <p style={{color:C.ink1,fontWeight:600,marginBottom:2}}>{d.title}</p>
                        <p style={{color:C.ink3}}>{d.pages} páginas · {'⭐'.repeat(d.rating)}</p>
                      </div>;
                    }}/>
                    <Scatter
                      data={finished.filter(b=>b.rating>0).map(b=>({pages:b.pages,rating:b.rating,title:b.title}))}
                      fill={C.accent} fillOpacity={0.7}/>
                  </ScatterChart>
                </ResponsiveContainer>
            }
          </Card>

          {/* Genre + authors all time */}
          <div className="rx-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
            <Card>
              <SectionTitle>Géneros · todo el tiempo</SectionTitle>
              {genreData.length===0
                ? <p style={{color:C.ink3,fontSize:12}}>Sin datos</p>
                : <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <PieChart width={110} height={110}>
                      <Pie data={genreData} cx={55} cy={55} innerRadius={30} outerRadius={50}
                        dataKey="value" strokeWidth={0}>
                        {genreData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}/>
                    </PieChart>
                    <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>
                      {genreData.map((g,i)=>(
                        <div key={g.name} style={{display:'flex',alignItems:'center',gap:7}}>
                          <div style={{width:7,height:7,borderRadius:'50%',flexShrink:0,background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                          <span style={{fontSize:11,color:C.ink2,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name}</span>
                          <span style={{fontSize:10,color:C.ink3,fontFamily:C.fontMono}}>{g.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
              }
            </Card>
            <Card>
              <SectionTitle>Autores más leídos</SectionTitle>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {topAuthors.map(([author,n],i)=>(
                  <div key={author} style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:10,color:C.ink4,fontFamily:C.fontMono,width:14,textAlign:'right',flexShrink:0}}>{i+1}</span>
                    <span style={{fontSize:12,color:C.ink2,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{author}</span>
                    <span style={{fontSize:11,color:C.accent,fontFamily:C.fontMono,flexShrink:0}}>{n}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ── TAB: Análisis ── */}
      {activeTab === 'analysis' && (() => {
        const finRating = finished.filter(b=>b.rating>0);
        const avgDiff   = finished.length ? (finished.reduce((a,b)=>a+(b.difficulty||3),0)/finished.length) : 0;
        const finishRate = books.length ? Math.round((finished.length/books.length)*100) : 0;
        const avgLen    = finished.length ? Math.round(finished.reduce((a,b)=>a+b.pages,0)/finished.length) : 0;
        const topGenre  = (Object.entries(
          finished.flatMap(b=>b.tags).reduce((acc:Record<string,number>,t)=>({...acc,[t]:(acc[t]||0)+1}),{})
        ) as [string,number][]).sort((a,b)=>b[1]-a[1])[0];
        const mostRead  = (Object.entries(
          finished.reduce((acc:Record<string,number>,b)=>({...acc,[b.author]:(acc[b.author]||0)+1}),{})
        ) as [string,number][]).sort((a,b)=>b[1]-a[1])[0];
        const monthCounts = Array(12).fill(0);
        finished.forEach(b=>{ if(b.end){ const m=parseInt(b.end.slice(5,7))-1; monthCounts[m]++; } });
        const bestMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
        const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        const thisYearN  = finished.filter(b=>b.end?.startsWith(String(year))).length;
        const prevYearN  = finished.filter(b=>b.end?.startsWith(String(year-1))).length;
        const trend      = thisYearN > prevYearN ? 'más' : thisYearN < prevYearN ? 'menos' : 'igual';
        const allAuthors = [...new Set(finished.map(b=>b.author))].sort();
        const pendingGenres: Record<string,number> = {};
        books.filter(b=>b.status==='planned').forEach(b=>b.tags?.forEach((t:string)=>{pendingGenres[t]=(pendingGenres[t]||0)+1;}));
        const topPending = (Object.entries(pendingGenres) as [string,number][]).sort((a,b)=>b[1]-a[1]).slice(0,3);
        return (
          <>
            <Card style={{ marginBottom:14 }}>
              <SectionTitle>Tu perfil lector</SectionTitle>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:14 }}>
                {[
                  { icon:'📚', label:'Libros terminados', value:finished.length, color:C.success },
                  { icon:'📄', label:'Promedio páginas', value:`${avgLen} pág.`, color:C.accent },
                  { icon:'⚡', label:'Dificultad media', value:`${avgDiff.toFixed(1)}/5`, color:C.xp },
                  { icon:'✅', label:'Tasa de finalización', value:`${finishRate}%`, color:C.success },
                  { icon:'🌟', label:'Género favorito', value:topGenre?.[0]||'—', color:'#FFB84D' },
                  { icon:'✍️', label:'Autor más leído', value:mostRead?`${mostRead[0].split(',')[0]} (${mostRead[1]})` : '—', color:C.accent },
                  { icon:'📅', label:'Mejor mes', value:monthCounts[bestMonthIdx]>0?`${MONTHS_ES[bestMonthIdx]} (${monthCounts[bestMonthIdx]})`:'—', color:'#14B8A6' },
                  { icon:'📈', label:`vs ${year-1}`, value:prevYearN>0?`${trend} (${prevYearN}→${thisYearN})`:'primer año', color:thisYearN>prevYearN?C.success:thisYearN<prevYearN?C.danger:C.ink3 },
                  { icon:'⭐', label:'Rating frecuente', value:finRating.length?`${([5,4,3,2,1].find(r=>finRating.filter(b=>b.rating===r).length===Math.max(...[1,2,3,4,5].map(r=>finRating.filter(b=>b.rating===r).length)))||5)} ★`:'—', color:C.xp },
                ].map(s=>(
                  <div key={s.label} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 12px', borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontSize:10, color:C.ink4, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:3 }}>{s.label}</p>
                      <p style={{ fontSize:14, fontWeight:600, color:s.color }}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ marginBottom:14 }}>
              <SectionTitle>Actividad lectora</SectionTitle>
              <p style={{ fontSize:12, color:C.ink4, marginBottom:14 }}>Días con sesiones registradas en los últimos 12 meses.</p>
              <ReadingHeatmap sessions={sessions}/>
            </Card>
            {topPending.length > 0 && (
              <Card style={{ marginBottom:14 }}>
                <SectionTitle>Pendientes por género</SectionTitle>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {topPending.map(([genre, count]) => (
                    <div key={genre} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:20 }}>📋</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:C.ink1 }}>{genre}</p>
                        <p style={{ fontSize:11, color:C.ink3, marginTop:2 }}>{count} libro{count!==1?'s':''} pendiente{count!==1?'s':''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <Card>
              <SectionTitle>Autores ({allAuthors.length})</SectionTitle>
              <p style={{ fontSize:12, color:C.ink4, marginBottom:12 }}>Click en un autor para ver su página dedicada.</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {allAuthors.map(author => {
                  const display = author.includes(',') ? author.split(',').reverse().join(' ').trim() : author;
                  const count = finished.filter(b=>b.author===author).length;
                  return (
                    <button key={author} onClick={()=>navigate(`/author/${encodeURIComponent(author)}`)}
                      style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.bgSurface, cursor:'pointer', fontSize:12, color:C.ink2, transition:'all 0.15s', display:'flex', alignItems:'center', gap:6 }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.accent;(e.currentTarget as HTMLElement).style.color=C.accent;}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.color=C.ink2;}}>
                      {display}
                      {count>1&&<span style={{ fontSize:10,color:C.ink4,fontFamily:C.fontMono }}>×{count}</span>}
                    </button>
                  );
                })}
              </div>
            </Card>
          </>
        );
      })()}

    </div>
  );
}