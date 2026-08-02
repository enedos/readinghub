import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { totalXP, levelInfo } from '../../lib/xp';
import { C, XPBar } from '../ui';

// Icon components using pure SVG — consistent design system
const icons = {
  home:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2.2"/><polyline points="9 22 9 12 15 12 15 22" strokeWidth="1.3"/></svg>,
  dashboard:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" strokeWidth="2.1"/><rect x="14" y="3" width="7" height="7" strokeWidth="1.4"/><rect x="14" y="14" width="7" height="7" strokeWidth="2.1"/><rect x="3" y="14" width="7" height="7" strokeWidth="1.4"/></svg>,
  library: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeWidth="1.4"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeWidth="2.2"/></svg>,
  stats:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" strokeWidth="1.5"/><line x1="12" y1="20" x2="12" y2="4" strokeWidth="2.2"/><line x1="6" y1="20" x2="6" y2="14" strokeWidth="1.5"/></svg>,
  quotes:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  themes:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeWidth="2.1"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.6"/></svg>,
  achieve: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" strokeWidth="2.2"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" strokeWidth="1.4"/></svg>,
  docs:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth="2.1"/><polyline points="14 2 14 8 20 8" strokeWidth="1.3"/><line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.3"/><line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.3"/></svg>,
  journey: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeWidth="2.2"/><polyline points="12 6 12 12 16 14" strokeWidth="1.3"/></svg>,
  sessions: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2.1"/><line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.3"/><line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.3"/><line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.3"/></svg>,
  collections: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="18" rx="1" strokeWidth="2.0"/><rect x="9" y="3" width="6" height="18" rx="1" strokeWidth="1.4"/><rect x="16" y="3" width="6" height="18" rx="1" strokeWidth="2.0"/></svg>,
  about:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeWidth="2.2"/><line x1="12" y1="8" x2="12" y2="12" strokeWidth="1.4"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.4"/></svg>,
  settings:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" strokeWidth="1.4"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth="2.1"/></svg>,
};

const NAV = [
  { to: '/dashboard',    icon: icons.dashboard,    label: 'Dashboard',    group: 'inicio'    },
  { to: '/',             icon: icons.library,      label: 'Biblioteca',   group: 'biblioteca'},
  { to: '/collections',  icon: icons.collections,  label: 'Colecciones',  group: 'biblioteca'},
  { to: '/stats',        icon: icons.stats,        label: 'Estadísticas', group: 'analisis'  },
  { to: '/sessions',     icon: icons.sessions,     label: 'Sesiones',     group: 'analisis'  },
  { to: '/journey',      icon: icons.journey,      label: 'Mi Recorrido', group: 'analisis'  },
  { to: '/achievements', icon: icons.achieve,      label: 'Logros',       group: 'gamif'     },
  { to: '/quotes',       icon: icons.quotes,       label: 'Citas',        group: 'contenido' },
  { to: '/themes',       icon: icons.themes,       label: 'Temas',        group: 'contenido' },
  { to: '/documents',    icon: icons.docs,         label: 'Documentos',   group: 'contenido' },
];

const NAV_GROUPS = [
  { id: 'inicio',     label: '' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'analisis',   label: 'Análisis' },
  { id: 'gamif',      label: 'Gamificación' },
  { id: 'contenido',  label: 'Contenido' },
];

function NavItem({ item, collapsed, isActive, badge }: { item: typeof NAV[0]; collapsed: boolean; isActive: boolean; badge?: number }) {
  return (
    <NavLink to={item.to} title={collapsed ? item.label : undefined}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '9px 0' : '8px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 9,
        background: isActive ? 'var(--rx-accent-mid)' : 'transparent',
        color: isActive ? 'var(--rx-accent)' : 'var(--rx-ink3)',
        textDecoration: 'none', transition: 'all 0.15s',
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        boxShadow: isActive ? 'inset 0 0 0 1px var(--rx-accent-mid), 0 0 14px rgba(139,92,246,0.28)' : 'none',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--rx-bg-hover)'; el.style.color = 'var(--rx-ink2)'; } }}
      onMouseLeave={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--rx-ink3)'; } }}>
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'inherit', position: 'relative' }}>
        {item.icon}
        {!!badge && badge > 0 && collapsed && (
          <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#EF4444', fontSize: 8, fontWeight: 700, color: C.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily:C.fontMono }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{item.label}</span>}
      {!collapsed && !!badge && badge > 0 ? (
        <span style={{ fontSize: 10, fontWeight: 700, color: C.onAccent, background: '#EF4444', borderRadius: 999, padding: '1px 6px', fontFamily:C.fontMono, flexShrink: 0 }}>
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </NavLink>
  );
}

export function Sidebar({ collapsed, onToggle, unreadNotifications = 0 }: { collapsed: boolean; onToggle: () => void; unreadNotifications?: number }) {
  const books        = useStore(s => s.books);
  const settings     = useStore(s => s.settings);
  const customLevels = useStore(s => s.customLevels);
  const loc          = useLocation();
  const navigate     = useNavigate();
  const xp           = totalXP(books);
  const lv           = levelInfo(xp, customLevels);
  const w            = collapsed ? 56 : 220;

  return (
    <aside style={{
      width: w, minHeight: '100vh', flexShrink: 0,
      background: 'color-mix(in srgb, var(--rx-bg-surface) 72%, transparent)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderRight: `1px solid var(--rx-border)`,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
      overflow: 'hidden', position: 'sticky', top: 0, height: '100vh',
      zIndex: 50,
    }}>

      {/* Header: logo + toggle */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 8px' : '0 12px',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid var(--rx-border)`, flexShrink: 0, gap: 8,
      }}>
        {!collapsed && (
          <button onClick={() => navigate('/home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
            {/* Book SVG logo */}
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <rect width="32" height="32" rx="7" fill="#8B5CF6"/>
              <rect x="7" y="6" width="3" height="20" rx="1" fill="rgba(255,255,255,0.4)"/>
              <rect x="10" y="6" width="13" height="20" rx="2" fill="rgba(255,255,255,0.92)"/>
              <rect x="12" y="10" width="7" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.45"/>
              <rect x="12" y="13.5" width="5" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.45"/>
              <rect x="12" y="17" width="6" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.45"/>
            </svg>
            <span style={{ fontFamily: C.fontSans, fontSize: 17, fontWeight: 600,
                            color: 'var(--rx-ink1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ReadingHub</span>
          </button>
        )}
        <button onClick={onToggle} title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{
            background: 'none', border: `1px solid var(--rx-border)`, cursor: 'pointer',
            color: 'var(--rx-ink4)', width: 26, height: 26, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--rx-ink1)'; el.style.borderColor = 'var(--rx-accent)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--rx-ink4)'; el.style.borderColor = 'var(--rx-border)'; }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Avatar + XP */}
      {!collapsed && (
        <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid var(--rx-border)`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,var(--rx-accent),#4C3A99)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: C.onAccent, overflow: 'hidden',
              border: '2px solid rgba(139,92,246,0.3)',
            }}>
              {settings.avatarUrl
                ? <img src={settings.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : settings.ownerName[0]?.toUpperCase() || 'L'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--rx-ink1)',
                           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {settings.ownerName}
              </p>
              <p style={{ fontSize: 10, color: 'var(--rx-xp)', fontFamily:C.fontMono, marginTop: 1 }}>
                Nv.{lv.level} · {lv.title}
              </p>
            </div>
          </div>
          <XPBar value={lv.progressPercent} />
        </div>
      )}
      {collapsed && (
        <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center',
                       borderBottom: `1px solid var(--rx-border)`, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--rx-accent),#4C3A99)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: C.onAccent, overflow: 'hidden',
          }}>
            {settings.avatarUrl
              ? <img src={settings.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : settings.ownerName[0]?.toUpperCase() || 'L'}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column',
                     gap: 0, overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => {
          const groupItems = NAV.filter(item => item.group === group.id);
          if (groupItems.length === 0) return null;
          return (
            <div key={group.id}>
              {/* Group separator label */}
              {group.label && !collapsed && (
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                             color: 'var(--rx-ink4)', padding: '10px 12px 4px', marginTop: 4 }}>
                  {group.label}
                </p>
              )}
              {group.label && collapsed && (
                <div style={{ height: 1, background: 'var(--rx-border)', margin: '8px 10px 4px' }}/>
              )}
              {groupItems.map(item => {
                const isActive = item.to === '/' ? loc.pathname === '/'
                  : item.to === '/home' ? loc.pathname === '/home'
                  : loc.pathname.startsWith(item.to);
                const badge = item.to === '/achievements' ? unreadNotifications : undefined;
                return <NavItem key={item.to} item={item} collapsed={collapsed} isActive={isActive} badge={badge} />;
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom: about + settings */}
      <div style={{ padding: '10px 8px', borderTop: `1px solid var(--rx-border)`,
                     flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <NavItem item={{ to: '/about', icon: icons.about, label: 'Sobre ReadingHub', group: 'bottom' }}
          collapsed={collapsed}
          isActive={loc.pathname === '/about'} />
        <NavItem item={{ to: '/settings', icon: icons.settings, label: 'Ajustes', group: 'bottom' }}
          collapsed={collapsed}
          isActive={loc.pathname === '/settings'} />
      </div>
    </aside>
  );
}
