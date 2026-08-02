import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { totalXP, levelInfo } from '../lib/xp';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { C } from '../components/ui';

// Floating book particle
function Particle({ delay, x, duration }: { delay: number; x: number; duration: number }) {
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, bottom: -40,
      fontSize: Math.random() > 0.5 ? 20 : 14,
      opacity: 0,
      animation: `floatUp ${duration}s ${delay}s ease-in infinite`,
      pointerEvents: 'none',
    }}>
      {['📖', '✨', '📚', '🌟', '💫', '📝'][Math.floor(Math.random() * 6)]}
    </div>
  );
}

export default function HomePage() {
  useDocumentTitle('Inicio');
  const navigate  = useNavigate();
  const books     = useStore(s => s.books);
  const settings  = useStore(s => s.settings);
  const customLevels = useStore(s => s.customLevels);
  const [entered, setEntered] = useState(false);

  const xp      = totalXP(books);
  const lv      = levelInfo(xp, customLevels);
  const finished = books.filter(b => b.status === 'finished');
  const reading  = books.filter(b => b.status === 'reading');

  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.8,
    x: 5 + (i * 8.5) % 90,
    duration: 6 + (i % 4),
  }));

  function enter() {
    setEntered(true);
    setTimeout(() => navigate('/dashboard'), 600);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--rx-bg-base)',
      position: 'relative', overflow: 'hidden',
      opacity: entered ? 0 : 1,
      transition: 'opacity 0.6s ease',
    }}>

      {/* Background gradient orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        animation: 'pulse 6s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: '20%', right: '15%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        animation: 'pulse 8s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }}/>

      {/* Floating particles */}
      {particles.map(p => <Particle key={p.id} {...p} />)}

      {/* Main content */}
      <div style={{
        textAlign: 'center', zIndex: 1, padding: '0 24px', maxWidth: 600,
        animation: 'fadeUp 0.8s ease both',
      }}>

        {/* Logo / brand */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #8B5CF6, #4C3A99)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(139,92,246,0.35)',
          }}>
            <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
              <rect x="7" y="6" width="3" height="20" rx="1" fill="rgba(255,255,255,0.4)"/>
              <rect x="10" y="6" width="13" height="20" rx="2" fill="rgba(255,255,255,0.95)"/>
              <rect x="12" y="10" width="7" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.5"/>
              <rect x="12" y="13.5" width="5.5" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.5"/>
              <rect x="12" y="17" width="6.5" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.5"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: C.fontSans,
            fontSize: 52, fontWeight: 600, color: 'var(--rx-ink1)',
            letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 12,
          }}>
            ReadingHub
          </h1>
          <p style={{ fontSize: 18, color: 'var(--rx-ink3)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
            Tu biblioteca personal.<br/>Cada libro, una historia tuya.
          </p>
        </div>

        {/* Stats preview (if has data) */}
        {books.length > 0 && (
          <div style={{
            display: 'flex', gap: 24, justifyContent: 'center',
            marginBottom: 40,
            animation: 'fadeUp 0.8s 0.2s ease both',
          }}>
            {[
              { label: 'Nivel', value: `${lv.level}`, color: 'var(--rx-xp)' },
              { label: 'Leídos', value: String(finished.length), color: 'var(--rx-success)' },
              { label: 'Leyendo', value: String(reading.length), color: 'var(--rx-info)' },
              { label: 'XP', value: xp.toLocaleString('es'), color: 'var(--rx-accent)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 600, color: s.color, fontFamily:C.fontMono }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'var(--rx-ink4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ animation: 'fadeUp 0.8s 0.35s ease both' }}>
          <button onClick={enter}
            style={{
              padding: '14px 40px', borderRadius: 14,
              background: 'linear-gradient(135deg, #8B5CF6, #4C3A99)',
              border: 'none', color: C.onAccent, fontSize: 16, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.01em',
              boxShadow: '0 8px 32px rgba(139,92,246,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(139,92,246,0.55)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'none';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(139,92,246,0.4)';
            }}>
            {books.length > 0 ? `Bienvenido, ${settings.ownerName} →` : 'Comenzar →'}
          </button>

          {books.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--rx-ink4)', marginTop: 16 }}>
              No se necesita cuenta · Tus datos son tuyos
            </p>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center',
        animation: 'fadeUp 0.8s 0.6s ease both',
      }}>
        <p style={{ fontSize: 11, color: 'var(--rx-ink4)', fontFamily:C.fontMono, letterSpacing: '0.06em', textAlign: 'center' }}>
          READINGHUB · Sistema personal de lectura
        </p>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0) rotate(0deg); }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-100vh) rotate(20deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
