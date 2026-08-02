import { useNavigate } from 'react-router-dom';
import { C } from '../components/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.bgBase, padding: 24, textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* 404 number */}
      <p style={{
        fontFamily: C.fontSans,
        fontSize: 120, fontWeight: 600, lineHeight: 1,
        color: C.border, letterSpacing: '-0.04em',
        marginBottom: 8,
      }}>
        404
      </p>

      {/* Icon */}
      <div style={{ fontSize: 48, marginBottom: 20 }}>📚</div>

      <h1 style={{
        fontFamily: C.fontSans,
        fontSize: 26, fontWeight: 600, color: C.ink1, marginBottom: 10,
      }}>
        Esta página no existe
      </h1>
      <p style={{ fontSize: 15, color: C.ink3, marginBottom: 32, maxWidth: 360, lineHeight: 1.6 }}>
        El libro que buscabas no está en la biblioteca, o la URL cambió de lugar.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate('/')}
          style={{
            padding: '10px 24px', borderRadius: 10,
            background: C.accent, border: 'none',
            color: C.onAccent, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          Ir a la biblioteca
        </button>
        <button onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 24px', borderRadius: 10,
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.ink2, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = C.accent;
            (e.currentTarget as HTMLElement).style.color = C.ink1;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = C.border;
            (e.currentTarget as HTMLElement).style.color = C.ink2;
          }}>
          Ver Dashboard
        </button>
        <button onClick={() => navigate(-1)}
          style={{
            padding: '10px 24px', borderRadius: 10,
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.ink3, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
          ← Volver
        </button>
      </div>

      {/* Bottom */}
      <p style={{ position: 'absolute', bottom: 24, fontSize: 11, color: C.ink4, fontFamily:C.fontMono }}>
        ReadingHub · v6.3
      </p>
    </div>
  );
}
