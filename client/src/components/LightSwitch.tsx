import { useState } from 'react';
import { useStore } from '../store';
import { C } from './ui';

export function LightSwitch() {
  const updateSettings = useStore(s => s.updateSettings);
  const settings = useStore(s => s.settings);
  const [isLight, setIsLight] = useState(() => settings.theme === 'light');

  function toggle() {
    const next = isLight ? 'dark' : 'light';
    document.documentElement.classList.toggle('light', next === 'light');
    localStorage.setItem('rx-theme', next);
    updateSettings({ theme: next as any });
    setIsLight(next === 'light');
  }

  return (
    <button onClick={toggle}
      title={isLight ? 'Modo claro — click para oscuro' : 'Modo oscuro — click para claro'}
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: C.bgCard, border: `1px solid ${C.border}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0,
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.accent; el.style.boxShadow = '0 0 12px rgba(139,92,246,0.22)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = C.border; el.style.boxShadow = 'none'; }}>
      {isLight ? (
        // Sun icon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <line x1="12" y1="2" x2="12" y2="4"/>
          <line x1="12" y1="20" x2="12" y2="22"/>
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
          <line x1="2" y1="12" x2="4" y2="12"/>
          <line x1="20" y1="12" x2="22" y2="12"/>
          <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>
          <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
        </svg>
      ) : (
        // Moon icon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      )}
    </button>
  );
}
