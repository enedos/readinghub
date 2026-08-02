import { useState, useRef, useMemo } from 'react';
import { useStore } from '../store';
import { C } from './ui';

function normalizeTag(t: string): string {
  return t.toLowerCase().trim().replace(/\s+/g, ' ');
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = 'Escribí un tema...' }: TagInputProps) {
  const books = useStore(s => s.books);
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const existingTags = useMemo(() => {
    const all = books.flatMap(b => b.tags.map(normalizeTag));
    return [...new Set(all)].sort();
  }, [books]);

  const suggestions = useMemo(() => {
    const q = normalizeTag(input);
    if (!q) return existingTags.filter(t => !value.map(normalizeTag).includes(t)).slice(0, 8);
    return existingTags.filter(t => t.includes(q) && !value.map(normalizeTag).includes(normalizeTag(t))).slice(0, 8);
  }, [input, existingTags, value]);

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag) return;
    if (!value.map(normalizeTag).includes(tag)) {
      onChange([...value, tag]);
    }
    setInput('');
  }

  // Parse multiple tags from a string (split by comma or semicolon)
  function addMultipleTags(raw: string) {
    const parts = raw.split(/[,;]+/).map(s => normalizeTag(s)).filter(Boolean);
    const existing = value.map(normalizeTag);
    const newTags = parts.filter(t => !existing.includes(t));
    if (newTags.length > 0) onChange([...value, ...newTags]);
    setInput('');
  }

  function removeTag(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    // If user types or pastes something containing comma, split immediately
    if (v.includes(',') || v.includes(';')) {
      addMultipleTags(v);
    } else {
      setInput(v);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes(',') || pasted.includes(';')) {
      e.preventDefault();
      addMultipleTags(pasted);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Tag chips + input field */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          padding: '7px 10px', borderRadius: 10, minHeight: 42,
          background: C.bgSurface, border: `1px solid ${focused ? C.accent : C.border}`,
          cursor: 'text', transition: 'border-color 0.2s',
        }}>
        {value.map((tag, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            background: `color-mix(in srgb, ${C.accent} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${C.accent} 21%, transparent)`,
            fontSize: 12, color: C.accent, fontWeight: 500, lineHeight: 1.4,
          }}>
            {tag}
            <button
              onMouseDown={e => { e.preventDefault(); removeTag(i); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent, fontSize: 15, lineHeight: 1, padding: 0, opacity: 0.7, marginTop: -1 }}>
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => { setFocused(true); setShowHint(true); }}
          onBlur={() => { setTimeout(() => setFocused(false), 150); setShowHint(false); }}
          placeholder={value.length === 0 ? placeholder : '+ agregar'}
          style={{
            flex: 1, minWidth: 80, background: 'none', border: 'none', outline: 'none',
            fontSize: 13, color: C.ink1, fontFamily: 'inherit', padding: '2px 0',
          }}
        />
      </div>

      {/* Hint */}
      {showHint && (
        <p style={{ fontSize: 10, color: C.ink4, marginTop: 4 }}>
          Presioná <kbd style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: C.bgHover, border: `1px solid ${C.border}` }}>Enter</kbd> o <kbd style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: C.bgHover, border: `1px solid ${C.border}` }}>,</kbd> para confirmar · Podés pegar múltiples separados por coma
        </p>
      )}

      {/* Autocomplete dropdown */}
      {focused && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 10, boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
          marginTop: 4, overflow: 'hidden',
        }}>
          {input.trim() && !existingTags.includes(normalizeTag(input)) && (
            <button
              onMouseDown={() => addTag(input)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', textAlign: 'left', background: `color-mix(in srgb, ${C.accent} 3%, transparent)`, border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              Crear "{normalizeTag(input)}"
            </button>
          )}
          {suggestions.map(tag => (
            <button key={tag} onMouseDown={() => addTag(tag)}
              style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: C.ink2 }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
