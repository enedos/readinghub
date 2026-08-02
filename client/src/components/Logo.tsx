import { C } from './ui';

interface LogoProps {
  size?: number;
  showText?: boolean;
  collapsed?: boolean;
}

export function Logo({ size = 28, showText = true, collapsed = false }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Book icon */}
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}>
        <rect width="32" height="32" rx="7" fill="#8B5CF6"/>
        {/* Spine */}
        <rect x="7" y="7" width="3" height="18" rx="1" fill="rgba(255,255,255,0.4)"/>
        {/* Pages */}
        <rect x="10" y="7" width="12" height="18" rx="1.5" fill="rgba(255,255,255,0.95)"/>
        {/* Lines */}
        <rect x="12" y="11" width="7" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.5"/>
        <rect x="12" y="14" width="5" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.5"/>
        <rect x="12" y="17" width="6" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.5"/>
        {/* Cover accent */}
        <rect x="22" y="7" width="2" height="18" rx="1" fill="rgba(255,255,255,0.25)"/>
      </svg>
      {showText && !collapsed && (
        <span style={{
          fontFamily: C.fontSans,
          fontSize: size * 0.7,
          fontWeight: 600,
          color: 'var(--rx-ink1)',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}>
          ReadingHub
        </span>
      )}
    </div>
  );
}
