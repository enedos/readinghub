import { useState, useCallback, useRef } from 'react';
import { C } from './ui';

interface TooltipState { visible: boolean; x: number; y: number; content: React.ReactNode; }

export function useFixedTooltip() {
  const [state, setState] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: null });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const showTip = useCallback((e: React.MouseEvent, content: React.ReactNode) => {
    if (timer.current) clearTimeout(timer.current);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setState({ visible: true, x: r.left + r.width / 2, y: r.top - 8, content });
  }, []);
  const hideTip = useCallback(() => {
    timer.current = setTimeout(() => setState(s => ({ ...s, visible: false })), 80);
  }, []);
  return { tooltipProps: state, showTip, hideTip };
}

export function FixedTooltip({ visible, x, y, content }: TooltipState) {
  if (!visible || !content) return null;
  return (
    <div style={{
      position: 'fixed', left: x, top: y, transform: 'translate(-50%, -100%)',
      zIndex: 9999, pointerEvents: 'none',
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '8px 12px', fontSize: 12, color: C.ink2,
      whiteSpace: 'nowrap', boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
      animation: 'scaleIn 0.12s ease both',
    }}>
      {content}
    </div>
  );
}
