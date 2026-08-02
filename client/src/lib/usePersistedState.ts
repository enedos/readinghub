import { useState } from 'react';

// Persists a small piece of UI state (view mode, sort order, active tab, etc.)
// to localStorage so it survives navigating away and back to a page.
// Keeps the exact same signature/ergonomics as useState.
export function usePersistedState<T>(key: string, defaultValue: T) {
  const storageKey = `rx-pref:${key}`;

  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? (JSON.parse(saved) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  function set(next: T | ((prev: T) => T)) {
    setValue(prev => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
      try {
        localStorage.setItem(storageKey, JSON.stringify(resolved));
      } catch {
        // localStorage unavailable (e.g. private mode) — state still works in-memory
      }
      return resolved;
    });
  }

  return [value, set] as const;
}
