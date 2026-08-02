import { useState, useEffect, useRef } from 'react';

const PHRASES = [
  '¡Seguí leyendo! 📖',
  '¡Sos una leyenda! ✨',
  '¿Leíste hoy? 🌙',
  '¡Un libro más! 🚀',
  '¡El conocimiento es poder! ⚡',
  '¡Imparable! 🔥',
  '¿Qué libro sigue? 🗺️',
  '¡Cada página cuenta! 💫',
  '¡Seguís creciendo! 🌱',
  '¡Orbe de sabiduría activo! 🔮',
  '¡La biblioteca te llama! 📚',
  '¡Leer es volar! 🦋',
];

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const ORBE_COLORS = ['#8B5CF6','#9B8FF0','#A78BFA','#C4B5FD','#60A5FA','#34D399'];

export function Mascot({ size = 64, animate = true, genreColor, streak = 0 }: {
  size?: number; animate?: boolean; genreColor?: string; streak?: number;
}) {
  const [phase,      setPhase]     = useState(0);
  const [particles,  setParticles] = useState<Particle[]>([]);
  const [phrase,     setPhrase]    = useState('');
  const [showPhrase, setShowPhrase]= useState(false);
  const [clicked,    setClicked]   = useState(false);
  const pidRef = useRef(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Pulse animation — ticks faster with an active reading streak (more
  // months in a row = a livelier, more energetic core), clamped so it
  // never feels frantic.
  const tickMs = Math.max(30, 50 - Math.min(streak, 10) * 2);
  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => setPhase(p => p + 0.05), tickMs);
    return () => clearInterval(id);
  }, [animate, tickMs]);

  // Particle physics
  useEffect(() => {
    if (particles.length === 0) return;
    const id = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, vy: p.vy+0.15, life: p.life-1 }))
          .filter(p => p.life > 0)
      );
    }, 16);
    return () => clearInterval(id);
  }, [particles.length]);

  function spawnParticles() {
    const newP: Particle[] = Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      return {
        id: pidRef.current++,
        x: 0, y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 20 + Math.floor(Math.random() * 15),
        color: ORBE_COLORS[Math.floor(Math.random() * ORBE_COLORS.length)],
        size: 3 + Math.random() * 5,
      };
    });
    setParticles(prev => [...prev, ...newP]);
  }

  function handleClick() {
    if (clicked) return;
    setClicked(true);
    spawnParticles();

    const p = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setPhrase(p);
    setShowPhrase(true);
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = setTimeout(() => {
      setShowPhrase(false);
      setClicked(false);
    }, 2200);
  }

  const pulse  = Math.sin(phase) * 0.12;
  const glow   = Math.sin(phase * 1.3) * 0.5 + 0.5;
  const rotate = phase * 20;
  const s      = size;
  const c      = s / 2;

  return (
    <div style={{ position: 'relative', width: s, height: s, cursor: 'pointer', userSelect: 'none' }}
      onClick={handleClick}>

      {/* Floating phrase — positioned to the left to avoid edge clipping */}
      {showPhrase && (
        <div style={{
          position: 'fixed',
          bottom: 90,
          right: 16,
          maxWidth: 220,
          background: 'rgba(20,16,40,0.95)',
          border: '1px solid rgba(139,92,246,0.5)',
          borderRadius: 12, padding: '8px 16px',
          fontSize: 13, color: '#C4B5FD',
          textAlign: 'center',
          zIndex: 300,
          animation: 'fadeUp 0.3s ease both',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 24px rgba(139,92,246,0.35)',
          pointerEvents: 'none',
          lineHeight: 1.4,
        }}>
          {phrase}
        </div>
      )}

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: c + p.x - p.size/2,
          top:  c + p.y - p.size/2,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          opacity: p.life / 35,
          pointerEvents: 'none',
          transform: `scale(${p.life/35})`,
        }}/>
      ))}

      {/* Orb SVG */}
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}
        style={{ display: 'block', transform: clicked ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <defs>
          <radialGradient id="orbCore" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#E0D7FF" stopOpacity="0.95"/>
            <stop offset="35%"  stopColor="#A78BFA" stopOpacity="0.85"/>
            <stop offset="70%"  stopColor="#8B5CF6" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.95"/>
          </radialGradient>
        </defs>

        {/* Orbit ring 1 */}
        <ellipse cx={c} cy={c}
          rx={c*0.75} ry={c*0.22}
          fill="none" stroke="rgba(196,181,253,0.4)" strokeWidth="1"
          strokeDasharray="3 5"
          transform={`rotate(${rotate}, ${c}, ${c})`}/>

        {/* Orbit ring 2 */}
        <ellipse cx={c} cy={c}
          rx={c*0.68} ry={c*0.28}
          fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="0.8"
          strokeDasharray="2 6"
          transform={`rotate(${-rotate*0.7 + 45}, ${c}, ${c})`}/>

        {/* Main orb */}
        <circle cx={c} cy={c} r={c * (0.52 + pulse*0.08)}
          fill="url(#orbCore)"/>

        {/* Specular highlight */}
        <ellipse cx={c * 0.72} cy={c * 0.58} rx={c*0.14} ry={c*0.08}
          fill="rgba(255,255,255,0.55)" transform={`rotate(-35,${c*0.72},${c*0.58})`}/>

        {/* Inner rune/symbol */}
        <text x={c} y={c + c*0.13} textAnchor="middle" fontSize={c*0.38}
          fill="rgba(255,255,255,0.25)" fontFamily="Georgia,serif">
          ᚱ
        </text>

        {/* Orbiting sparkles */}
        {[0,1,2].map(i => {
          const a = (rotate * (i%2===0?1:-0.8) + i*120) * Math.PI/180;
          const r = c * 0.7;
          const px = c + r * Math.cos(a);
          const py = c + r * Math.sin(a);
          return (
            <circle key={i} cx={px} cy={py}
              r={2 + Math.sin(phase*2 + i*2) * 1}
              fill={ORBE_COLORS[i*2]}
              opacity={0.7 + Math.sin(phase + i) * 0.3}/>
          );
        })}
      </svg>
    </div>
  );
}
