import { RARITY_CONFIG, CATEGORY_COLOR, type Rarity } from '../lib/achievements';

interface BadgeProps {
  rarity: Rarity;
  category: string;
  unlocked: boolean;
  size?: number;
  icon?: string; // optional custom image URL
}

// Orb badge — same visual language as the mascot, tiered by rarity through
// glow strength, orbit rings, and specular highlight instead of a different
// silhouette per rarity.
function BadgeShape({ rarity, color, size, children }: {
  rarity: Rarity; color: string; size: number; children: React.ReactNode;
}) {
  const s = size;
  const c = s / 2;
  const tier = { bronze:1, silver:2, gold:3, platinum:4, legendary:5 }[rarity];
  const rings = tier >= 4 ? 2 : tier >= 2 ? 1 : 0;
  const hasSparkle = tier >= 5;
  const uid = `${rarity}-${Math.round(c)}`;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`core-${uid}`} cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.9"/>
          <stop offset="35%"  stopColor={color} stopOpacity="0.85"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.55"/>
        </radialGradient>
        {tier >= 5 && (
          <filter id={`blur-${uid}`}>
            <feGaussianBlur stdDeviation="1.4"/>
          </filter>
        )}
      </defs>

      {/* Orbit rings — more rings at higher tiers, like the mascot */}
      {rings >= 1 && (
        <ellipse cx={c} cy={c} rx={c*0.92} ry={c*0.32}
          fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1"
          strokeDasharray="2 4" transform={`rotate(20, ${c}, ${c})`}/>
      )}
      {rings >= 2 && (
        <ellipse cx={c} cy={c} rx={c*0.85} ry={c*0.4}
          fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="0.8"
          strokeDasharray="1.5 5" transform={`rotate(-35, ${c}, ${c})`}/>
      )}

      {/* Sphere core */}
      <circle cx={c} cy={c} r={c - 5} fill={`url(#core-${uid})`}
        filter={tier >= 5 ? `url(#blur-${uid})` : undefined}/>
      <circle cx={c} cy={c} r={c - 5} fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.7"/>

      {/* Specular highlight */}
      <ellipse cx={c - (c-5)*0.32} cy={c - (c-5)*0.4} rx={(c-5)*0.28} ry={(c-5)*0.16}
        fill="rgba(255,255,255,0.55)" transform={`rotate(-30, ${c - (c-5)*0.32}, ${c - (c-5)*0.4})`}/>

      {/* Legendary sparkles */}
      {hasSparkle && [0,1].map(i => {
        const a = (i * 160 + 40) * Math.PI/180;
        const r = c * 0.85;
        return <circle key={i} cx={c + r*Math.cos(a)} cy={c + r*Math.sin(a)} r={1.6} fill={color}/>;
      })}

      {children}
    </svg>
  );
}

// Category symbol inside the badge
function CategorySymbol({ category, size }: { category: string; size: number }) {
  const s = size * 0.38;
  const x = size / 2;
  const y = size / 2;
  const SYMBOLS: Record<string, string> = {
    'Primeros pasos':  '★',
    'Volumen':         '⊕',
    'Constancia':      '∞',
    'Velocidad':       '↯',
    'Calidad':         '◈',
    'Diversidad':      '⊛',
    'Formatos':        '▣',
    'Audio':           '◎',
    'Metas':           '◉',
    'Maestría':        '♦',
  };
  return (
    <text x={x} y={y + s * 0.38} textAnchor="middle" fontSize={s}
      fill="rgba(255,255,255,0.92)" fontFamily="system-ui" style={{ userSelect: 'none' }}>
      {SYMBOLS[category] || '◆'}
    </text>
  );
}

export function AchievementBadge({ rarity, category, unlocked, size = 56, icon }: BadgeProps) {
  const cfg = RARITY_CONFIG[rarity];
  const catColor = CATEGORY_COLOR[category] || cfg.color;
  // Plain hex, not a CSS var — used as `${color}18` etc. for hex-alpha
  // transparency throughout BadgeShape, which breaks with var() strings.
  const color = unlocked ? catColor : '#3A3A50';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Glow behind for unlocked */}
      {unlocked && (
        <div style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}/>
      )}
      <div style={{ opacity: unlocked ? 1 : 0.3, transition: 'opacity 0.3s' }}>
        <BadgeShape rarity={rarity} color={color} size={size}>
          {icon && unlocked ? (
            <image href={icon} x={size*0.25} y={size*0.25} width={size*0.5} height={size*0.5}
              clipPath="circle()" style={{ borderRadius: '50%' }}/>
          ) : (
            <CategorySymbol category={category} size={size}/>
          )}
        </BadgeShape>
      </div>
      {/* Rarity tier dots */}
      {unlocked && (
        <div style={{
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 2,
        }}>
          {Array.from({ length: cfg.tier }, (_, i) => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%', background: cfg.color,
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}
