import { useState } from 'react';
import { useStore } from '../store';
import { LEVELS } from '../lib/xp';
import { C, Card, SectionTitle, Btn } from './ui';
import type { CustomLevel } from '../types';

const LEVEL_ICONS = ['📖','🌱','🔍','⚡','🧠','🏛️','🌌','👑','🔮','💎','🦁','🐉','⭐','🌟','💫','🐺','🦊','🦅','🌙','☀️'];

export function LevelEditor() {
  const customLevels    = useStore(s => s.customLevels);
  const setCustomLevels = useStore(s => s.setCustomLevels);

  const workingLevels: CustomLevel[] = customLevels && customLevels.length > 0
    ? [...customLevels]
    : LEVELS.map(l => ({ ...l, icon: LEVEL_ICONS[l.level - 1] || '📖' }));

  const [levels, setLevels]   = useState<CustomLevel[]>(workingLevels);
  const [saved,  setSaved]    = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  function updateLevel(idx: number, field: keyof CustomLevel, value: string | number) {
    setLevels(prev => prev.map((l, i) =>
      i === idx ? { ...l, [field]: field === 'xp' || field === 'level' ? Number(value) : value } : l
    ));
  }

  function addLevel() {
    const last = levels[levels.length - 1];
    setLevels(prev => [...prev, {
      level: last.level + 1,
      xp: last.xp + 5000,
      title: 'Nuevo nivel',
      icon: '✨',
    }]);
    setEditing(levels.length);
  }

  function removeLevel(idx: number) {
    if (levels.length <= 2) return;
    setLevels(prev => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, level: i + 1 })));
  }

  function save() {
    const sorted = [...levels].sort((a, b) => a.xp - b.xp).map((l, i) => ({ ...l, level: i + 1 }));
    setCustomLevels(sorted);
    setLevels(sorted);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function reset() {
    const defaults: CustomLevel[] = LEVELS.map(l => ({ ...l, icon: LEVEL_ICONS[l.level - 1] || '📖' }));
    setLevels(defaults);
    setCustomLevels(defaults);
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <SectionTitle>Escala de niveles</SectionTitle>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={reset}>Restablecer</Btn>
          <Btn size="sm" onClick={save}>{saved ? '✅ Guardado' : 'Guardar cambios'}</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {levels.map((level, idx) => (
          <div key={idx}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              background: editing === idx ? 'var(--rx-accent-mid)' : C.bgSurface,
              border: `1px solid ${editing === idx ? C.accent : C.border}`,
              transition: 'all 0.15s',
            }}>

            {/* Icon picker */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setEditing(editing === idx ? null : idx)}
                style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`,
                          background: C.bgCard, cursor: 'pointer', fontSize: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {level.icon}
              </button>
              {editing === idx && (
                <div style={{
                  position: 'absolute', top: 40, left: 0, zIndex: 50,
                  background: C.bgCard, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 8, display: 'flex', flexWrap: 'wrap',
                  gap: 4, width: 160,
                  animation: 'scaleIn 0.15s ease both',
                }}>
                  {LEVEL_ICONS.map(icon => (
                    <button key={icon} onClick={() => { updateLevel(idx, 'icon', icon); setEditing(null); }}
                      style={{ width: 28, height: 28, borderRadius: 6, border: 'none',
                                background: level.icon === icon ? C.accent : 'transparent',
                                cursor: 'pointer', fontSize: 16,
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Level number */}
            <span style={{ fontSize: 11, fontFamily:C.fontMono, color: C.ink4,
                           width: 20, textAlign: 'center', flexShrink: 0 }}>
              {level.level}
            </span>

            {/* Title */}
            <input
              value={level.title}
              onChange={e => updateLevel(idx, 'title', e.target.value)}
              style={{ flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 13,
                        background: 'transparent', border: `1px solid transparent`,
                        color: C.ink1, outline: 'none', minWidth: 0 }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />

            {/* XP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <input
                type="number" value={level.xp} min={0}
                onChange={e => updateLevel(idx, 'xp', e.target.value)}
                style={{ width: 80, padding: '4px 8px', borderRadius: 6, fontSize: 12,
                          background: C.bgCard, border: `1px solid ${C.border}`,
                          color: C.xp, outline: 'none', fontFamily:C.fontMono,
                          textAlign: 'right' }}
              />
              <span style={{ fontSize: 11, color: C.ink4 }}>XP</span>
            </div>

            {/* Remove */}
            {levels.length > 2 && (
              <button onClick={() => removeLevel(idx)}
                style={{ width: 24, height: 24, borderRadius: 6, border: 'none',
                          background: 'transparent', cursor: 'pointer', color: C.ink4,
                          fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.danger)}
                onMouseLeave={e => (e.currentTarget.style.color = C.ink4)}>
                ✕
              </button>
            )}
          </div>
        ))}

        {/* Add level */}
        <button onClick={addLevel}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', borderRadius: 10, border: `1px dashed ${C.border}`,
                    background: 'transparent', color: C.ink3, cursor: 'pointer',
                    fontSize: 13, transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.accent; (e.currentTarget as HTMLElement).style.color = C.accent; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.ink3; }}>
          + Agregar nivel
        </button>
      </div>

      <p style={{ fontSize: 11, color: C.ink4, marginTop: 12 }}>
        Editá títulos, XP requerido e iconos. Los niveles se ordenan automáticamente por XP.
      </p>
    </Card>
  );
}
