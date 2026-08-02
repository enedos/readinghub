import React from 'react';

// ── Color tokens — use CSS vars so light/dark works ──────────
export const C = {
  bgBase:    'var(--rx-bg-base)',
  bgSurface: 'var(--rx-bg-surface)',
  bgCard:    'var(--rx-bg-card)',
  bgHover:   'var(--rx-bg-hover)',
  border:    'var(--rx-border)',
  accent:    'var(--rx-accent)',
  accentMid: 'var(--rx-accent-mid)',
  xp:        'var(--rx-xp)',
  success:   'var(--rx-success)',
  info:      'var(--rx-info)',
  infoMid:   'var(--rx-info-mid)',
  danger:    'var(--rx-danger)',
  magenta:   'var(--rx-magenta)',
  ink1:      'var(--rx-ink1)',
  ink2:      'var(--rx-ink2)',
  ink3:      'var(--rx-ink3)',
  ink4:      'var(--rx-ink4)',
  shadow:    'var(--rx-shadow)',
  overlay:   'var(--rx-overlay)',
  onAccent:  'var(--rx-on-accent)',
  fontSans:  'var(--rx-font-sans)',
  fontSerif: 'var(--rx-font-serif)',
  fontMono:  'var(--rx-font-mono)',
};

// ── Card ─────────────────────────────────────────────────────
// Glassy panel: translucent so the ambient wash bleeds through,
// inner top highlight + soft elevation instead of a flat 1px box.
export function Card({ children, style, onClick }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      background: `linear-gradient(170deg, color-mix(in srgb, ${C.bgCard} 92%, #8B5CF6 8%), color-mix(in srgb, ${C.bgCard} 86%, transparent))`,
      border: `1px solid color-mix(in srgb, ${C.border} 80%, #8B5CF6 20%)`,
      borderRadius: 18, padding: 20,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.22)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── SectionTitle ─────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: C.ink3, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 3, height: 11, borderRadius: 2, background: C.accent,
                     boxShadow: '0 0 6px var(--rx-accent)', flexShrink: 0, display: 'inline-block' }}/>
      {children}
    </p>
  );
}

// ── Stars ────────────────────────────────────────────────────
export function Stars({ rating, size = 12, interactive = false, onChange }: {
  rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void;
}) {
  const [hover, setHover] = React.useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20"
          fill={i <= (hover || rating) ? 'var(--rx-xp)' : 'var(--rx-border)'}
          style={{ cursor: interactive ? 'pointer' : 'default', flexShrink: 0, transition: 'fill 0.15s' }}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

// ── StatusBadge ──────────────────────────────────────────────
const STATUS_MAP = {
  finished:  { label: 'Leído',      color: 'var(--rx-success)', bg: 'rgba(34,197,94,0.1)'   },
  reading:   { label: 'Leyendo',    color: 'var(--rx-info)',    bg: 'var(--rx-info-mid)'    },
  planned:   { label: 'Pendiente',  color: 'var(--rx-ink3)',    bg: 'rgba(90,90,114,0.1)'   },
  abandoned: { label: 'Abandonado', color: 'var(--rx-danger)',  bg: 'rgba(239,68,68,0.1)'   },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.planned;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6,
                   padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:500,
                   color: s.color, background: s.bg }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.color, flexShrink:0 }} />
      {s.label}
    </span>
  );
}

// ── XPBadge ──────────────────────────────────────────────────
export function XPBadge({ xp }: { xp: number }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                   padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:500,
                   fontFamily:C.fontMono, color:'var(--rx-xp)',
                   background:'rgba(255,184,77,0.12)',
                   boxShadow:'0 0 8px rgba(255,184,77,0.2)' }}>
      ★ +{xp} XP
    </span>
  );
}

// ── ProgressBar ──────────────────────────────────────────────
export function ProgressBar({ value, color, height = 6 }: {
  value: number; color?: string; height?: number;
}) {
  const c = color || 'var(--rx-accent)';
  return (
    <div style={{ height, background: C.border, borderRadius:999, overflow:'hidden' }}>
      <div style={{
        height:'100%', width:`${Math.min(value,100)}%`,
        background: `linear-gradient(90deg, ${c}, color-mix(in srgb, ${c} 65%, white))`,
        borderRadius:999,
        boxShadow: `0 0 8px color-mix(in srgb, ${c} 55%, transparent)`,
        transition:'width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}/>
    </div>
  );
}

// ── XPBar ────────────────────────────────────────────────────
export function XPBar({ value }: { value: number }) {
  const pct = Math.min(value, 100);
  return (
    <div style={{ height:8, background:C.border, borderRadius:999, position:'relative' }}>
      <div style={{
        height:'100%', width:`${pct}%`, position:'relative',
        background:'linear-gradient(90deg,var(--rx-xp),#FFD98A)',
        borderRadius:999, transition:'width 1s cubic-bezier(0.25,0.46,0.45,0.94)',
        boxShadow:'0 0 10px rgba(255,184,77,0.5)',
        overflow:'hidden',
      }}>
        {/* Flowing particles — energy moving toward the charge point */}
        <div style={{
          position:'absolute', inset:0,
          background:'repeating-linear-gradient(90deg, transparent 0 8px, rgba(255,255,255,0.35) 8px 10px)',
          animation:'xpFlow 0.9s linear infinite',
        }}/>
      </div>
      {/* Charge point — a small bright spark right at the fill's leading edge */}
      {pct > 2 && (
        <div style={{
          position:'absolute', top:'50%', left:`${pct}%`,
          width:10, height:10, borderRadius:'50%',
          transform:'translate(-50%,-50%)',
          background:'#FFE9AE',
          boxShadow:'0 0 8px 2px rgba(255,184,77,0.8)',
          pointerEvents:'none',
        }}/>
      )}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────
// Pills, not rectangles. Primary carries a gradient fill + layered glow.
export function Btn({ children, onClick, variant='primary', size='md', disabled, style, type }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'primary'|'ghost'|'danger'|'success';
  size?: 'sm'|'md'; disabled?: boolean;
  style?: React.CSSProperties; type?: 'button'|'submit'|'reset';
}) {
  const pad = size==='sm' ? '6px 14px' : '9px 20px';
  const fs  = size==='sm' ? 12 : 13;
  const solid = (c: string) =>
    `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 72%, black))`;
  const bg  = variant==='primary' ? solid('var(--rx-accent)')
            : variant==='danger'  ? solid('var(--rx-danger)')
            : variant==='success' ? solid('var(--rx-success)')
            : C.bgHover;
  const color  = variant==='ghost' ? C.ink2 : C.onAccent;
  const border = variant==='ghost' ? `1px solid ${C.border}` : '1px solid rgba(255,255,255,0.14)';
  const glow   = variant==='primary' ? '0 2px 10px rgba(0,0,0,0.3), 0 0 18px rgba(139,92,246,0.35)'
               : variant==='danger'  ? '0 2px 10px rgba(0,0,0,0.3), 0 0 16px rgba(239,68,68,0.28)'
               : variant==='success' ? '0 2px 10px rgba(0,0,0,0.3), 0 0 16px rgba(34,197,94,0.28)'
               : 'none';
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={disabled ? '' : 'rx-btn'}
      style={{ padding:pad, borderRadius:999, fontSize:fs, fontWeight:600, border,
               letterSpacing:'0.01em',
               cursor:disabled?'not-allowed':'pointer', background:bg, color,
               boxShadow: disabled ? 'none' : glow,
               opacity:disabled?0.5:1, transition:'opacity 0.2s,background 0.2s,filter 0.2s,transform 0.1s', ...style }}>
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────
const fieldStyle: React.CSSProperties = {
  width:'100%', padding:'9px 13px', borderRadius:10, fontSize:13,
  background:`color-mix(in srgb, ${'var(--rx-bg-base)'} 60%, var(--rx-bg-surface))`,
  border:`1px solid var(--rx-border)`,
  boxShadow:'inset 0 1px 3px rgba(0,0,0,0.25)',
  color:'var(--rx-ink1)', outline:'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
};
const fieldFocus = (el: HTMLElement) => {
  el.style.borderColor = 'var(--rx-accent)';
  el.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.25), 0 0 0 3px var(--rx-accent-mid), 0 0 14px rgba(139,92,246,0.2)';
};
const fieldBlur = (el: HTMLElement) => {
  el.style.borderColor = 'var(--rx-border)';
  el.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.25)';
};

export function Input({ label, value, onChange, type='text', placeholder, min, max, step, required }: {
  label?: string; value: string|number; onChange: (v:string)=>void;
  type?: string; placeholder?: string; min?: number; max?: number; step?: number; required?: boolean;
}) {
  return (
    <label style={{ display:'block' }}>
      {label && <span style={{ display:'block', fontSize:11, fontWeight:500, color:C.ink3,
                               marginBottom:4, letterSpacing:'0.04em' }}>{label}</span>}
      <input type={type} value={value} placeholder={placeholder}
        min={min} max={max} step={step} required={required}
        onChange={e=>onChange(e.target.value)}
        style={fieldStyle}
        onFocus={e=>fieldFocus(e.target)}
        onBlur={e=>fieldBlur(e.target)}/>
    </label>
  );
}

// ── Textarea ─────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder, rows=4 }: {
  label?: string; value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number;
}) {
  return (
    <label style={{ display:'block' }}>
      {label && <span style={{ display:'block', fontSize:11, fontWeight:500, color:C.ink3,
                               marginBottom:4, letterSpacing:'0.04em' }}>{label}</span>}
      <textarea value={value} placeholder={placeholder} rows={rows}
        onChange={e=>onChange(e.target.value)}
        style={{ ...fieldStyle, resize:'vertical', fontFamily:'inherit' }}
        onFocus={e=>fieldFocus(e.target)}
        onBlur={e=>fieldBlur(e.target)}/>
    </label>
  );
}

// ── Select ───────────────────────────────────────────────────
export function Select({ label, value, onChange, options }: {
  label?: string; value:string; onChange:(v:string)=>void;
  options:{value:string;label:string}[];
}) {
  return (
    <label style={{ display:'block' }}>
      {label && <span style={{ display:'block', fontSize:11, fontWeight:500, color:C.ink3,
                               marginBottom:4, letterSpacing:'0.04em' }}>{label}</span>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ ...fieldStyle, cursor:'pointer', appearance:'none' }}
        onFocus={e=>fieldFocus(e.target)}
        onBlur={e=>fieldBlur(e.target)}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ── Modal ────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width=560, closeOnBackdrop=true }: {
  open:boolean; onClose:()=>void; title:string; children:React.ReactNode; width?:number; closeOnBackdrop?:boolean;
}) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000,
                  background:C.overlay, backdropFilter:'blur(10px)',
                  display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e=>closeOnBackdrop && e.target===e.currentTarget&&onClose()}>
      <div style={{ background:`linear-gradient(175deg, color-mix(in srgb, ${C.bgCard} 90%, #8B5CF6 10%), ${C.bgCard})`,
                    border:`1px solid color-mix(in srgb, ${C.border} 70%, #8B5CF6 30%)`,
                    borderRadius:22, width:'100%', maxWidth:width, maxHeight:'90vh',
                    overflow:'auto', padding:28,
                    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.07), 0 24px 64px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.15)',
                    animation:'scaleIn 0.2s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <h2 style={{ fontSize:18, fontWeight:600, color:C.ink1 }}>{title}</h2>
          <button onClick={onClose}
            style={{ background:'none', border:'none', cursor:'pointer', color:C.ink3,
                     padding:4, borderRadius:6, fontSize:18, lineHeight:1, transition:'all 0.15s' }}
            onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.color=C.ink1; el.style.background=C.bgHover; }}
            onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.color=C.ink3; el.style.background='none'; }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────
// Segmented pill control — the active tab is a glowing capsule,
// not a 2px underline.
export function Tabs({ tabs, active, onChange }: {
  tabs:{id:string;label:string}[]; active:string; onChange:(id:string)=>void;
}) {
  return (
    <div style={{ display:'inline-flex', gap:3, padding:3, marginBottom:24,
                  background:`color-mix(in srgb, ${C.bgSurface} 80%, transparent)`,
                  border:`1px solid ${C.border}`, borderRadius:999 }}>
      {tabs.map(t=>{
        const isActive = active===t.id;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)}
            style={{ padding:'7px 16px', border:'none', cursor:'pointer', fontSize:12.5,
                     fontWeight:isActive?600:400, borderRadius:999,
                     color:isActive?C.onAccent:C.ink3,
                     background:isActive?`linear-gradient(135deg, var(--rx-accent), color-mix(in srgb, var(--rx-accent) 72%, black))`:'transparent',
                     boxShadow:isActive?'0 0 14px rgba(139,92,246,0.35)':'none',
                     transition:'all 0.2s' }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Empty ────────────────────────────────────────────────────
export function Empty({ icon, message, sub }: { icon?:string; message:string; sub?:string }) {
  return (
    <div style={{ textAlign:'center', padding:'64px 24px', color:C.ink3 }}>
      <div style={{ width:72, height:72, margin:'0 auto 16px', borderRadius:'50%',
                    border:`1px dashed color-mix(in srgb, ${C.accent} 40%, transparent)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background:'var(--rx-accent-mid)',
                    boxShadow:'0 0 24px rgba(139,92,246,0.12)' }}>
        <span style={{ fontSize:30 }}>{icon || '◌'}</span>
      </div>
      <p style={{ fontSize:15, color:C.ink2 }}>{message}</p>
      {sub && <p style={{ fontSize:13, marginTop:6, color:C.ink4 }}>{sub}</p>}
    </div>
  );
}
