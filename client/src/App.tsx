import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { C } from './components/ui';
import { useStore } from './store';
import { Sidebar } from './components/layout/Sidebar';
import { AddBookWizard } from './components/AddBookWizard';
import { Mascot } from './components/Mascot';
import { calcAchievements, RARITY_CONFIG, inferUnlockDate } from './lib/achievements';
import { topTags, streakMonths } from './lib/xp';
import { CATEGORY_COLORS } from './lib/colors';
import { CommandPalette } from './components/CommandPalette';
import { LightSwitch } from './components/LightSwitch';
import { useDocumentTitle } from './lib/useDocumentTitle';

// ── Dynamic browser tab title ───────────────────────────────────
// Static routes get their title from this map. Routes with dynamic
// content (book detail, author page) set their own title internally
// via useDocumentTitle, since they know the book/author name.
const PAGE_TITLES: Record<string, string> = {
  '/':             'Biblioteca',
  '/dashboard':    'Dashboard',
  '/quotes':       'Citas',
  '/themes':       'Temas',
  '/stats':        'Estadísticas',
  '/achievements': 'Logros',
  '/settings':     'Ajustes',
  '/documents':    'Documentos',
  '/about':        'Sobre ReadingHub',
  '/journey':      'Mi Recorrido',
  '/collections':  'Colecciones',
  '/sessions':     'Sesiones',
  '/authors':      'Autores',
};

function PageTitle() {
  const location = useLocation();
  const isDynamic = location.pathname.startsWith('/books/') || location.pathname.startsWith('/author/');
  const title = isDynamic ? undefined : (PAGE_TITLES[location.pathname] ?? 'Página no encontrada');
  useDocumentTitle(isDynamic ? undefined : title);
  return null;
}

// ── Suspense fallback for lazy-loaded pages ─────────────────────
function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#8B5CF6,#4C3A99)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s ease infinite' }}>
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <rect x="7" y="6" width="3" height="20" rx="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="10" y="6" width="13" height="20" rx="2" fill="rgba(255,255,255,0.92)"/>
        </svg>
      </div>
    </div>
  );
}

const HomePage         = lazy(() => import('./pages/Home'));
const AuthorPage       = lazy(() => import('./pages/Author'));
const AuthorsPage      = lazy(() => import('./pages/Authors'));
const SessionsPage     = lazy(() => import('./pages/Sessions'));
const LibraryPage      = lazy(() => import('./pages/Library'));
const DashboardPage    = lazy(() => import('./pages/Dashboard'));
const BookDetailPage   = lazy(() => import('./pages/BookDetail'));
const QuotesPage       = lazy(() => import('./pages/Quotes'));
const ThemesPage       = lazy(() => import('./pages/Themes'));
const StatsPage        = lazy(() => import('./pages/Stats'));
const AchievementsPage = lazy(() => import('./pages/Achievements'));
const SettingsPage     = lazy(() => import('./pages/Settings'));
const DocumentsPage    = lazy(() => import('./pages/Documents'));
const AboutPage        = lazy(() => import('./pages/About'));
const JourneyPage      = lazy(() => import('./pages/Journey'));
const CollectionsPage  = lazy(() => import('./pages/Collections'));
const NotFoundPage     = lazy(() => import('./pages/NotFound'));
import './index.css';

function MascotOrb() {
  const books = useStore(s => s.books);
  const topTag = topTags(books, 1)[0]?.[0];
  const genreColor = topTag
    ? CATEGORY_COLORS[Math.abs([...topTag].reduce((a, c) => a + c.charCodeAt(0), 0)) % CATEGORY_COLORS.length]
    : undefined;
  const streak = streakMonths(books);
  return (
    <div style={{ position: 'fixed', bottom: 21, right: 18, zIndex: 80 }}>
      <Mascot size={54} animate genreColor={genreColor} streak={streak} />
    </div>
  );
}

// ── Notification Bell ─────────────────────────────────────────
function NotificationBell() {
  const notifications            = useStore(s => s.notifications);
  const markNotificationRead     = useStore(s => s.markNotificationRead);
  const markNotificationUnread   = useStore(s => (s as any).markNotificationUnread);
  const markAllNotificationsRead = useStore(s => s.markAllNotificationsRead);
  const deleteNotification       = useStore(s => s.deleteNotification);
  const [open, setOpen]          = useState(false);
  const ref                      = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function fmtDate(s: string) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]} ${d.getFullYear()}`;
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: open ? 'var(--rx-accent-mid)' : C.bgCard,
          border: `1px solid ${open ? C.accent : C.border}`,
          boxShadow: open ? '0 0 14px rgba(139,92,246,0.3)' : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', position: 'relative', transition: 'all 0.2s',
        }} title="Notificaciones">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={open ? C.accent : C.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 16, height: 16, borderRadius: '50%',
            background: '#EF4444', border: `2px solid var(--rx-bg-base)`,
            fontSize: 9, fontWeight: 700, color: C.onAccent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: C.fontMono,
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 44, zIndex: 300,
          width: 360, maxHeight: 520, overflowY: 'auto',
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 14, boxShadow: `0 16px 48px rgba(0,0,0,0.4)`,
          animation: 'scaleIn 0.15s ease both',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.ink1 }}>
              Notificaciones
              {unread > 0 && <span style={{ fontSize: 11, color: C.accent, marginLeft: 6 }}>({unread} nuevas)</span>}
            </p>
            {unread > 0 && (
              <button onClick={() => markAllNotificationsRead()}
                style={{ fontSize: 11, color: C.ink3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: C.ink4 }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>🔔</p>
              <p style={{ fontSize: 13 }}>Sin notificaciones todavía</p>
            </div>
          ) : (
            <div>
              {notifications.map(n => {
                const cfg = RARITY_CONFIG[n.rarity as keyof typeof RARITY_CONFIG];
                return (
                  <div key={n.id}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 16px',
                      borderBottom: `1px solid ${C.border}`,
                      background: n.read ? 'transparent' : `rgba(139,92,246,0.05)`,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : `rgba(139,92,246,0.05)`)}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>🏅</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: cfg?.color || C.accent }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{n.description}</p>
                      <p style={{ fontSize: 10, color: C.ink4, fontFamily: C.fontMono, marginTop: 4 }}>
                        {n.createdAt ? fmtDate(n.createdAt) : ''}
                        {n.xp ? ` · +${n.xp} XP` : ''}
                      </p>
                    </div>
                    {/* Read/unread toggle */}
                    <button
                      onClick={() => n.read ? markNotificationUnread?.(n.id) : markNotificationRead(n.id)}
                      title={n.read ? 'Marcar como no leída' : 'Marcar como leída'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: n.read ? C.ink4 : C.accent, fontSize: 14, flexShrink: 0, padding: '0 4px' }}>
                      {n.read ? '○' : '●'}
                    </button>
                    <button onClick={() => deleteNotification(n.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 16, flexShrink: 0, padding: '0 4px' }}
                      title="Eliminar">×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FOOTER_QUOTES = [
  'Cada página leída es un paso hacia algo más grande.',
  'Los libros son espejos: solo ves en ellos lo que ya llevás dentro.',
  'Leer es vivir muchas vidas antes de que acabe la tuya.',
  'Una página al día mantiene la ignorancia a raya.',
  'Hoy leíste. Mañana serás distinto.',
  'Leer no te da más tiempo, te da más vida.',
  'Cada libro terminado es una versión nueva de vos.',
  'El que lee mucho y camina mucho, ve mucho y sabe mucho.',
];
const _footerIdx = Math.floor(Math.random() * FOOTER_QUOTES.length);

function Footer() {
  return (
    <footer className="rx-footer" style={{
      borderTop: `1px solid ${C.border}`, padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 6, flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: C.ink4, fontFamily: C.fontMono }}>ReadingHub · v1.0.1</span>
      <span style={{ fontSize: 11, color: C.ink4, fontStyle: 'italic' }}>{FOOTER_QUOTES[_footerIdx]}</span>
    </footer>
  );
}

// ── Achievement Notifier ──────────────────────────────────────
// Runs once on mount (after data loads). Creates notifications for already-unlocked
// achievements using inferred historical dates — never uses "today" for old logros.
function AchievementNotifier() {
  const books                = useStore(s => s.books);
  const customAchievements   = useStore(s => s.customAchievements);
  const achievementOverrides = useStore(s => s.achievementOverrides);
  const notifications        = useStore(s => s.notifications);
  const addNotification      = useStore(s => s.addNotification);
  const setAchievementOverride = useStore(s => s.setAchievementOverride);
  const loading              = useStore(s => s.loading);
  const ran                  = useRef(false);

  useEffect(() => {
    if (loading || ran.current) return;
    ran.current = true;

    const existingIds = new Set(notifications.map(n => n.achievementId).filter(Boolean));

    const base = calcAchievements(books).map(a => {
      const ov = achievementOverrides.find(o => o.id === a.id);
      return ov ? { ...a, unlocked: ov.manualUnlock ? true : a.unlocked } : a;
    });

    base.filter(a => a.unlocked).forEach(a => {
      const ov = achievementOverrides.find(o => o.id === a.id);
      const storedDate = ov?.unlockDate;

      // Infer historical date from books if not already stored
      const inferredDate = storedDate || inferUnlockDate(a.id, books);
      const finalDate    = inferredDate || new Date().toISOString();

      // Persist the inferred date as unlockDate override (only if not already set)
      if (!storedDate && inferredDate) {
        setAchievementOverride(a.id, {
          ...(ov || {}),
          unlockDate: inferredDate,
        });
      }

      // Create notification if not already exists
      if (!existingIds.has(a.id)) {
        addNotification({
          achievementId: a.id,
          title: a.title,
          description: a.description,
          rarity: a.rarity,
          xp: a.xp,
          createdAt: finalDate,
        });
      }
    });

    // Custom achievements
    (customAchievements as any[]).filter(a => a.unlocked).forEach(a => {
      if (existingIds.has(a.id)) return;
      addNotification({
        achievementId: a.id,
        title: a.title,
        description: a.description,
        rarity: a.rarity,
        xp: a.xp,
        createdAt: new Date().toISOString(),
      });
    });
  }, [loading]);

  return null;
}

function AppShell() {
  const loading       = useStore(s => s.loading);
  const error         = useStore(s => s.error);
  const notifications = useStore(s => s.notifications);

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const location   = useLocation();
  const showMascot = !location.pathname.startsWith('/books/');
  // Only show badge if there are unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const check = () => { if (window.innerWidth < 900) setCollapsed(true); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--rx-bg-base)', gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:12, background:'linear-gradient(135deg,#8B5CF6,#4C3A99)', display:'flex', alignItems:'center', justifyContent:'center', animation:'pulse 1.5s ease infinite' }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect x="7" y="6" width="3" height="20" rx="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="10" y="6" width="13" height="20" rx="2" fill="rgba(255,255,255,0.92)"/>
        </svg>
      </div>
      <p style={{ color:'var(--rx-ink3)', fontSize:14, fontFamily:C.fontMono }}>Cargando ReadingHub...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--rx-bg-base)', gap:12, padding:24, textAlign:'center' }}>
      <span style={{ fontSize:40 }}>⚠️</span>
      <h2 style={{ color:'var(--rx-ink1)', fontSize:20 }}>No se pudo conectar</h2>
      <p style={{ color:'var(--rx-ink3)', fontSize:14, maxWidth:400, lineHeight:1.6 }}>{error}</p>
      <div style={{ marginTop:8, padding:'12px 20px', borderRadius:10, background:'var(--rx-bg-card)', border:'1px solid var(--rx-border)', fontSize:13, color:'var(--rx-ink2)', fontFamily:C.fontMono, textAlign:'left' }}>
        <p>1. Abrí una terminal</p><p>2. Navegá a la carpeta de ReadingHub</p>
        <p>3. Ejecutá: <strong>node server/index.js</strong></p><p>4. Recargá esta página</p>
      </div>
      <button onClick={() => window.location.reload()} style={{ marginTop:8, padding:'10px 24px', borderRadius:10, background:'var(--rx-accent)', border:'none', color:C.onAccent, fontSize:14, cursor:'pointer' }}>Reintentar</button>
    </div>
  );

  return (
    <div className="rx-layout">
      <PageTitle />
      <AchievementNotifier />
      {mobileOpen && <div className="rx-overlay" onClick={() => setMobileOpen(false)} />}
      <button className="rx-hamburger" onClick={() => setMobileOpen(o => !o)}
        style={{ display:'none', position:'fixed', top:12, left:12, zIndex:200, width:36, height:36, borderRadius:9, background:C.bgCard, border:`1px solid ${C.border}`, cursor:'pointer', color:C.ink2, alignItems:'center', justifyContent:'center', fontSize:16 }}>
        ☰
      </button>

      <div className={mobileOpen ? 'rx-sidebar-mobile-open' : ''}
        style={{ position: isMobile && !mobileOpen ? 'fixed' : 'relative', left: isMobile && !mobileOpen ? -280 : 0, transition: 'left 0.25s ease' }}>
        <Sidebar
          collapsed={collapsed}
          unreadNotifications={unreadCount}  // 0 means no badge shown
          onToggle={() => {
            if (window.innerWidth < 768) setMobileOpen(false);
            else setCollapsed(c => !c);
          }}
        />
      </div>

      <div className="rx-main">
        <div style={{ position:'sticky', top:0, zIndex:100, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8, padding:'10px 24px 10px', background:'color-mix(in srgb, var(--rx-bg-base) 65%, transparent)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderBottom:'1px solid color-mix(in srgb, var(--rx-border) 50%, transparent)' }}>
          <CommandPalette />
          <LightSwitch />
          <NotificationBell />
        </div>
        <div className="rx-content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"             element={<LibraryPage onAddBook={() => setShowWizard(true)} />} />
              <Route path="/dashboard"    element={<DashboardPage />} />
              <Route path="/books/:id"    element={<BookDetailPage />} />
              <Route path="/quotes"       element={<QuotesPage />} />
              <Route path="/themes"       element={<ThemesPage />} />
              <Route path="/stats"        element={<StatsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/settings"     element={<SettingsPage />} />
              <Route path="/documents"    element={<DocumentsPage />} />
              <Route path="/about"        element={<AboutPage />} />
              <Route path="/journey"      element={<JourneyPage />} />
              <Route path="/collections"  element={<CollectionsPage />} />
              <Route path="/sessions"       element={<SessionsPage />} />
              <Route path="/authors" element={<AuthorsPage />} />
              <Route path="/author/:authorSlug" element={<AuthorPage />} />
              <Route path="*"             element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
      </div>

      {showMascot && <MascotOrb />}
      <AddBookWizard open={showWizard} onClose={() => setShowWizard(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/*"    element={<AppShell />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
