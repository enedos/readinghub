import type { Book } from '../types';

export type Rarity = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  hint: string;           // how to unlock
  category: string;
  rarity: Rarity;
  xp: number;
  unlocked: boolean;
  progress?: number;      // 0–100
  progressLabel?: string; // "3 / 10"
}

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  hint: string;
  category: string;
  rarity: Rarity;
  xp: number;
  check: (books: Book[]) => { unlocked: boolean; progress?: number; progressLabel?: string };
}

const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = `${thisYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

function byStatus(books: Book[], status: string) {
  return books.filter(b => b.status === status);
}
function finished(books: Book[]) { return byStatus(books, 'finished'); }
function totalPages(books: Book[]) { return finished(books).reduce((a, b) => a + b.pages, 0); }
function yearBooks(books: Book[], year = thisYear) {
  return finished(books).filter(b => b.end?.startsWith(String(year)));
}
function getDays(b: Book) {
  if (!b.start || !b.end) return Infinity;
  return Math.round((new Date(b.end).getTime() - new Date(b.start).getTime()) / 86400000);
}

// ── Category colors (for badge rendering) ────────────────────
export const CATEGORY_COLOR: Record<string, string> = {
  'Primeros pasos':  '#8B5CF6',
  'Volumen':         '#3B82F6',
  'Constancia':      '#22C55E',
  'Velocidad':       '#FFB84D',
  'Calidad':         '#F472B6',
  'Diversidad':      '#14B8A6',
  'Formatos':        '#8B5CF6',
  'Audio':           '#06B6D4',
  'Metas':           '#EF4444',
  'Maestría':        '#F97316',
};

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; glow: string; tier: number }> = {
  bronze:    { label: 'Bronce',    color: '#CD7F32', glow: 'rgba(205,127,50,0.3)',  tier: 1 },
  silver:    { label: 'Plata',     color: '#9898B0', glow: 'rgba(152,152,176,0.3)', tier: 2 },
  gold:      { label: 'Oro',       color: '#FFB84D', glow: 'rgba(255,184,77,0.3)',  tier: 3 },
  platinum:  { label: 'Platino',   color: '#22D3EE', glow: 'rgba(34,211,238,0.4)',  tier: 4 },
  legendary: { label: 'Legendario',color: '#C6409A', glow: 'rgba(198,64,154,0.4)',  tier: 5 },
};

const DEFS: AchievementDef[] = [
  // ── Primeros pasos ─────────────────────────────────────────
  {
    id: 'first_book', category: 'Primeros pasos', rarity: 'bronze', xp: 50,
    title: 'Primera página', description: 'Registraste tu primer libro',
    hint: 'Agregá un libro a tu biblioteca',
    check: b => ({ unlocked: b.length >= 1 }),
  },
  {
    id: 'first_finish', category: 'Primeros pasos', rarity: 'bronze', xp: 100,
    title: 'Primer cierre', description: 'Terminaste tu primer libro',
    hint: 'Marcá un libro como "Leído"',
    check: b => ({ unlocked: finished(b).length >= 1 }),
  },
  {
    id: 'first_quote', category: 'Primeros pasos', rarity: 'bronze', xp: 75,
    title: 'Primera cita', description: 'Guardaste tu primera cita',
    hint: 'Agregá una cita en el detalle de un libro',
    check: b => ({ unlocked: b.some(x => x.quotes && x.quotes.trim().length > 10) }),
  },
  {
    id: 'first_note', category: 'Primeros pasos', rarity: 'bronze', xp: 75,
    title: 'Primera reflexión', description: 'Escribiste tu primera nota',
    hint: 'Agregá una nota en el detalle de un libro',
    check: b => ({ unlocked: b.some(x => x.notes && x.notes.trim().length > 10) }),
  },
  {
    id: 'profile_complete', category: 'Primeros pasos', rarity: 'silver', xp: 100,
    title: 'Identidad propia', description: 'Completaste tu perfil',
    hint: 'Cargá tu foto de perfil y cambiá tu nombre en Ajustes',
    check: b => ({ unlocked: false }), // handled in Settings check
  },

  // ── Volumen ────────────────────────────────────────────────
  {
    id: 'books_5', category: 'Volumen', rarity: 'bronze', xp: 150,
    title: 'Estante inicial', description: '5 libros terminados',
    hint: 'Terminá 5 libros',
    check: b => {
      const n = finished(b).length;
      return { unlocked: n >= 5, progress: Math.min((n/5)*100,100), progressLabel: `${n}/5` };
    },
  },
  {
    id: 'books_10', category: 'Volumen', rarity: 'bronze', xp: 200,
    title: 'Lector activo', description: '10 libros terminados',
    hint: 'Terminá 10 libros',
    check: b => {
      const n = finished(b).length;
      return { unlocked: n >= 10, progress: Math.min((n/10)*100,100), progressLabel: `${n}/10` };
    },
  },
  {
    id: 'books_25', category: 'Volumen', rarity: 'silver', xp: 300,
    title: 'Biblioteca creciente', description: '25 libros terminados',
    hint: 'Terminá 25 libros',
    check: b => {
      const n = finished(b).length;
      return { unlocked: n >= 25, progress: Math.min((n/25)*100,100), progressLabel: `${n}/25` };
    },
  },
  {
    id: 'books_50', category: 'Volumen', rarity: 'gold', xp: 500,
    title: 'Coleccionista', description: '50 libros terminados',
    hint: 'Terminá 50 libros',
    check: b => {
      const n = finished(b).length;
      return { unlocked: n >= 50, progress: Math.min((n/50)*100,100), progressLabel: `${n}/50` };
    },
  },
  {
    id: 'books_100', category: 'Volumen', rarity: 'platinum', xp: 1000,
    title: 'Centenario', description: '100 libros terminados',
    hint: 'Terminá 100 libros',
    check: b => {
      const n = finished(b).length;
      return { unlocked: n >= 100, progress: Math.min((n/100)*100,100), progressLabel: `${n}/100` };
    },
  },
  {
    id: 'books_200', category: 'Volumen', rarity: 'legendary', xp: 2000,
    title: 'Biblioteca viva', description: '200 libros terminados',
    hint: 'Terminá 200 libros',
    check: b => {
      const n = finished(b).length;
      return { unlocked: n >= 200, progress: Math.min((n/200)*100,100), progressLabel: `${n}/200` };
    },
  },
  {
    id: 'pages_1000', category: 'Volumen', rarity: 'bronze', xp: 150,
    title: 'Mil páginas', description: '1.000 páginas leídas',
    hint: 'Acumulá 1.000 páginas en libros terminados',
    check: b => {
      const n = totalPages(b);
      return { unlocked: n >= 1000, progress: Math.min((n/1000)*100,100), progressLabel: `${n.toLocaleString()}/1.000` };
    },
  },
  {
    id: 'pages_5000', category: 'Volumen', rarity: 'silver', xp: 300,
    title: 'Cinco mil páginas', description: '5.000 páginas leídas',
    hint: 'Acumulá 5.000 páginas',
    check: b => {
      const n = totalPages(b);
      return { unlocked: n >= 5000, progress: Math.min((n/5000)*100,100), progressLabel: `${n.toLocaleString()}/5.000` };
    },
  },
  {
    id: 'pages_10000', category: 'Volumen', rarity: 'gold', xp: 500,
    title: 'Mar de páginas', description: '10.000 páginas leídas',
    hint: 'Acumulá 10.000 páginas',
    check: b => {
      const n = totalPages(b);
      return { unlocked: n >= 10000, progress: Math.min((n/10000)*100,100), progressLabel: `${n.toLocaleString()}/10.000` };
    },
  },
  {
    id: 'pages_50000', category: 'Volumen', rarity: 'legendary', xp: 1500,
    title: 'Océano de páginas', description: '50.000 páginas leídas',
    hint: 'Acumulá 50.000 páginas',
    check: b => {
      const n = totalPages(b);
      return { unlocked: n >= 50000, progress: Math.min((n/50000)*100,100), progressLabel: `${n.toLocaleString()}/50.000` };
    },
  },

  // ── Constancia ─────────────────────────────────────────────
  {
    id: 'streak_3', category: 'Constancia', rarity: 'bronze', xp: 150,
    title: 'Hábito formándose', description: '3 meses consecutivos leyendo',
    hint: 'Terminá al menos un libro por mes durante 3 meses seguidos',
    check: b => {
      let streak = 0;
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (finished(b).some(x => x.end?.startsWith(key))) streak++;
        else break;
      }
      return { unlocked: streak >= 3, progress: Math.min((streak/3)*100,100), progressLabel: `${streak}/3 meses` };
    },
  },
  {
    id: 'streak_6', category: 'Constancia', rarity: 'silver', xp: 300,
    title: 'Hábito consolidado', description: '6 meses consecutivos leyendo',
    hint: 'Terminá al menos un libro por mes durante 6 meses',
    check: b => {
      let streak = 0;
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (finished(b).some(x => x.end?.startsWith(key))) streak++;
        else break;
      }
      return { unlocked: streak >= 6, progress: Math.min((streak/6)*100,100), progressLabel: `${streak}/6 meses` };
    },
  },
  {
    id: 'streak_12', category: 'Constancia', rarity: 'gold', xp: 600,
    title: 'Lector del año', description: 'Un año completo leyendo',
    hint: 'Terminá al menos un libro por mes durante 12 meses',
    check: b => {
      let streak = 0;
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (finished(b).some(x => x.end?.startsWith(key))) streak++;
        else break;
      }
      return { unlocked: streak >= 12, progress: Math.min((streak/12)*100,100), progressLabel: `${streak}/12 meses` };
    },
  },
  {
    id: 'two_month', category: 'Constancia', rarity: 'bronze', xp: 100,
    title: 'Doble turno', description: '2 libros en el mismo mes',
    hint: 'Terminá 2 libros en un mismo mes',
    check: b => {
      const monthCounts: Record<string, number> = {};
      finished(b).forEach(x => { if (x.end) { const k = x.end.slice(0,7); monthCounts[k] = (monthCounts[k]||0)+1; } });
      return { unlocked: Object.values(monthCounts).some(c => c >= 2) };
    },
  },
  {
    id: 'five_month', category: 'Constancia', rarity: 'gold', xp: 400,
    title: 'Mes de fuego', description: '5 libros en un mes',
    hint: 'Terminá 5 libros en un mismo mes',
    check: b => {
      const monthCounts: Record<string, number> = {};
      finished(b).forEach(x => { if (x.end) { const k = x.end.slice(0,7); monthCounts[k] = (monthCounts[k]||0)+1; } });
      const max = Math.max(...Object.values(monthCounts), 0);
      return { unlocked: max >= 5, progress: Math.min((max/5)*100,100), progressLabel: `${max}/5` };
    },
  },

  // ── Velocidad ──────────────────────────────────────────────
  {
    id: 'speed_3days', category: 'Velocidad', rarity: 'silver', xp: 200,
    title: 'Lectura relámpago', description: 'Terminaste un libro en 3 días o menos',
    hint: 'Completá un libro en 3 días o menos (requiere fecha de inicio y fin)',
    check: b => ({ unlocked: finished(b).some(x => getDays(x) <= 3 && getDays(x) >= 0) }),
  },
  {
    id: 'speed_1day', category: 'Velocidad', rarity: 'gold', xp: 350,
    title: 'Devorador', description: 'Terminaste un libro en un día',
    hint: 'Completá un libro en 1 día',
    check: b => ({ unlocked: finished(b).some(x => getDays(x) <= 1 && getDays(x) >= 0) }),
  },
  {
    id: 'speed_week', category: 'Velocidad', rarity: 'bronze', xp: 100,
    title: 'Semana lectora', description: 'Terminaste un libro en menos de 7 días',
    hint: 'Completá un libro en menos de 7 días',
    check: b => ({ unlocked: finished(b).some(x => getDays(x) < 7 && getDays(x) >= 0) }),
  },

  // ── Calidad ────────────────────────────────────────────────
  {
    id: 'five_stars_1', category: 'Calidad', rarity: 'bronze', xp: 75,
    title: 'Obra maestra', description: 'Tu primer libro con 5 estrellas',
    hint: 'Calificá un libro con 5 estrellas',
    check: b => ({ unlocked: finished(b).some(x => x.rating === 5) }),
  },
  {
    id: 'five_stars_5', category: 'Calidad', rarity: 'silver', xp: 200,
    title: 'Crítico exigente', description: '5 libros con calificación perfecta',
    hint: 'Calificá 5 libros con 5 estrellas',
    check: b => {
      const n = finished(b).filter(x => x.rating === 5).length;
      return { unlocked: n >= 5, progress: Math.min((n/5)*100,100), progressLabel: `${n}/5` };
    },
  },
  {
    id: 'five_stars_10', category: 'Calidad', rarity: 'gold', xp: 400,
    title: 'Catálogo de joyas', description: '10 libros con 5 estrellas',
    hint: 'Calificá 10 libros con 5 estrellas',
    check: b => {
      const n = finished(b).filter(x => x.rating === 5).length;
      return { unlocked: n >= 10, progress: Math.min((n/10)*100,100), progressLabel: `${n}/10` };
    },
  },
  {
    id: 'high_difficulty', category: 'Calidad', rarity: 'silver', xp: 250,
    title: 'Lector difícil', description: '3 libros de dificultad máxima terminados',
    hint: 'Terminá 3 libros con dificultad 5',
    check: b => {
      const n = finished(b).filter(x => x.difficulty === 5).length;
      return { unlocked: n >= 3, progress: Math.min((n/3)*100,100), progressLabel: `${n}/3` };
    },
  },
  {
    id: 'all_ratings', category: 'Calidad', rarity: 'silver', xp: 150,
    title: 'Criterio formado', description: 'Calificaste 10 libros',
    hint: 'Asigná rating a 10 libros terminados',
    check: b => {
      const n = finished(b).filter(x => x.rating > 0).length;
      return { unlocked: n >= 10, progress: Math.min((n/10)*100,100), progressLabel: `${n}/10` };
    },
  },
  {
    id: 'notes_5', category: 'Calidad', rarity: 'bronze', xp: 100,
    title: 'Lector reflexivo', description: 'Notas en 5 libros',
    hint: 'Escribí notas en 5 libros distintos',
    check: b => {
      const n = b.filter(x => x.notes && x.notes.trim().length > 10).length;
      return { unlocked: n >= 5, progress: Math.min((n/5)*100,100), progressLabel: `${n}/5` };
    },
  },
  {
    id: 'quotes_10', category: 'Calidad', rarity: 'silver', xp: 200,
    title: 'Coleccionista de citas', description: '10 libros con citas guardadas',
    hint: 'Guardá citas en 10 libros distintos',
    check: b => {
      const n = b.filter(x => x.quotes && x.quotes.trim().length > 10).length;
      return { unlocked: n >= 10, progress: Math.min((n/10)*100,100), progressLabel: `${n}/10` };
    },
  },

  // ── Diversidad ─────────────────────────────────────────────
  {
    id: 'genres_5', category: 'Diversidad', rarity: 'bronze', xp: 100,
    title: 'Explorador inicial', description: '5 géneros distintos',
    hint: 'Terminá libros de 5 géneros (tags) distintos',
    check: b => {
      const n = new Set(finished(b).flatMap(x => x.tags)).size;
      return { unlocked: n >= 5, progress: Math.min((n/5)*100,100), progressLabel: `${n}/5` };
    },
  },
  {
    id: 'genres_10', category: 'Diversidad', rarity: 'silver', xp: 200,
    title: 'Omnívoro literario', description: '10 géneros distintos',
    hint: 'Terminá libros de 10 géneros distintos',
    check: b => {
      const n = new Set(finished(b).flatMap(x => x.tags)).size;
      return { unlocked: n >= 10, progress: Math.min((n/10)*100,100), progressLabel: `${n}/10` };
    },
  },
  {
    id: 'genres_20', category: 'Diversidad', rarity: 'gold', xp: 400,
    title: 'Sin fronteras', description: '20 géneros distintos',
    hint: 'Terminá libros de 20 géneros distintos',
    check: b => {
      const n = new Set(finished(b).flatMap(x => x.tags)).size;
      return { unlocked: n >= 20, progress: Math.min((n/20)*100,100), progressLabel: `${n}/20` };
    },
  },
  {
    id: 'authors_5', category: 'Diversidad', rarity: 'bronze', xp: 100,
    title: 'Voces múltiples', description: '5 autores distintos',
    hint: 'Terminá libros de 5 autores distintos',
    check: b => {
      const n = new Set(finished(b).map(x => x.author)).size;
      return { unlocked: n >= 5, progress: Math.min((n/5)*100,100), progressLabel: `${n}/5` };
    },
  },
  {
    id: 'authors_20', category: 'Diversidad', rarity: 'silver', xp: 250,
    title: 'Muchas voces', description: '20 autores distintos',
    hint: 'Terminá libros de 20 autores distintos',
    check: b => {
      const n = new Set(finished(b).map(x => x.author)).size;
      return { unlocked: n >= 20, progress: Math.min((n/20)*100,100), progressLabel: `${n}/20` };
    },
  },
  {
    id: 'authors_50', category: 'Diversidad', rarity: 'gold', xp: 500,
    title: 'Universo de autores', description: '50 autores distintos',
    hint: 'Terminá libros de 50 autores distintos',
    check: b => {
      const n = new Set(finished(b).map(x => x.author)).size;
      return { unlocked: n >= 50, progress: Math.min((n/50)*100,100), progressLabel: `${n}/50` };
    },
  },
  {
    id: 'two_languages', category: 'Diversidad', rarity: 'silver', xp: 200,
    title: 'Políglota', description: 'Libros en 2 idiomas distintos',
    hint: 'Terminá libros en al menos 2 idiomas diferentes',
    check: b => ({ unlocked: new Set(finished(b).map(x => x.language)).size >= 2 }),
  },

  // ── Formatos ───────────────────────────────────────────────
  {
    id: 'physical_10', category: 'Formatos', rarity: 'bronze', xp: 100,
    title: 'Amor al papel', description: '10 libros físicos',
    hint: 'Terminá 10 libros en formato físico',
    check: b => {
      const n = finished(b).filter(x => x.format === 'physical').length;
      return { unlocked: n >= 10, progress: Math.min((n/10)*100,100), progressLabel: `${n}/10` };
    },
  },
  {
    id: 'digital_5', category: 'Formatos', rarity: 'bronze', xp: 75,
    title: 'Lector digital', description: '5 libros en formato digital',
    hint: 'Terminá 5 libros en formato digital',
    check: b => {
      const n = finished(b).filter(x => x.format === 'digital').length;
      return { unlocked: n >= 5, progress: Math.min((n/5)*100,100), progressLabel: `${n}/5` };
    },
  },
  {
    id: 'all_formats', category: 'Formatos', rarity: 'silver', xp: 200,
    title: 'Multiformato', description: 'Físico, digital y audiolibro',
    hint: 'Terminá al menos un libro en cada formato',
    check: b => {
      const formats = new Set(finished(b).map(x => x.format));
      return { unlocked: formats.has('physical') && formats.has('digital') && formats.has('audio') };
    },
  },

  // ── Audio ──────────────────────────────────────────────────
  {
    id: 'audio_first', category: 'Audio', rarity: 'bronze', xp: 100,
    title: 'Primera escucha', description: 'Completaste tu primer audiolibro',
    hint: 'Terminá un libro en formato audiolibro',
    check: b => ({ unlocked: finished(b).some(x => x.format === 'audio') }),
  },
  {
    id: 'audio_5', category: 'Audio', rarity: 'silver', xp: 250,
    title: 'Oyente dedicado', description: '5 audiolibros completados',
    hint: 'Terminá 5 audiolibros',
    check: b => {
      const n = finished(b).filter(x => x.format === 'audio').length;
      return { unlocked: n >= 5, progress: Math.min((n/5)*100,100), progressLabel: `${n}/5` };
    },
  },
  {
    id: 'audio_10', category: 'Audio', rarity: 'gold', xp: 400,
    title: 'Oídos de papel', description: '10 audiolibros completados',
    hint: 'Terminá 10 audiolibros',
    check: b => {
      const n = finished(b).filter(x => x.format === 'audio').length;
      return { unlocked: n >= 10, progress: Math.min((n/10)*100,100), progressLabel: `${n}/10` };
    },
  },

  // ── Metas ──────────────────────────────────────────────────
  {
    id: 'goal_12', category: 'Metas', rarity: 'gold', xp: 500,
    title: 'Meta anual', description: '12 libros en un año',
    hint: 'Completá 12 libros en un mismo año',
    check: b => {
      const byYear: Record<string, number> = {};
      finished(b).forEach(x => { if (x.end) { const y = x.end.slice(0,4); byYear[y] = (byYear[y]||0)+1; } });
      const max = Math.max(...Object.values(byYear), 0);
      return { unlocked: max >= 12, progress: Math.min((yearBooks(b).length/12)*100,100), progressLabel: `${yearBooks(b).length}/12` };
    },
  },
  {
    id: 'goal_24', category: 'Metas', rarity: 'platinum', xp: 800,
    title: 'Dos libros por mes', description: '24 libros en un año',
    hint: 'Completá 24 libros en un mismo año',
    check: b => {
      const byYear: Record<string, number> = {};
      finished(b).forEach(x => { if (x.end) { const y = x.end.slice(0,4); byYear[y] = (byYear[y]||0)+1; } });
      const max = Math.max(...Object.values(byYear), 0);
      return { unlocked: max >= 24, progress: Math.min((yearBooks(b).length/24)*100,100), progressLabel: `${yearBooks(b).length}/24` };
    },
  },
  {
    id: 'comeback', category: 'Metas', rarity: 'silver', xp: 150,
    title: 'Regreso', description: 'Abandonaste y seguiste leyendo',
    hint: 'Tenés al menos un libro abandonado y 5 libros terminados',
    check: b => ({
      unlocked: byStatus(b, 'abandoned').length >= 1 && finished(b).length >= 5,
    }),
  },
  {
    id: 'planned_10', category: 'Metas', rarity: 'bronze', xp: 50,
    title: 'Lista ambiciosa', description: '10 libros en lista de espera',
    hint: 'Agregá 10 libros con estado "Pendiente"',
    check: b => {
      const n = byStatus(b, 'planned').length;
      return { unlocked: n >= 10, progress: Math.min((n/10)*100,100), progressLabel: `${n}/10` };
    },
  },

  // ── Maestría ───────────────────────────────────────────────
  {
    id: 'all_categories', category: 'Maestría', rarity: 'platinum', xp: 1000,
    title: 'Erudito completo', description: 'Terminaste libros de 30+ géneros',
    hint: 'Explorá 30 géneros distintos',
    check: b => {
      const n = new Set(finished(b).flatMap(x => x.tags)).size;
      return { unlocked: n >= 30, progress: Math.min((n/30)*100,100), progressLabel: `${n}/30` };
    },
  },
  {
    id: 'library_size', category: 'Maestría', rarity: 'platinum', xp: 800,
    title: 'Archivista', description: '150 libros en tu biblioteca',
    hint: 'Registrá 150 libros (en cualquier estado)',
    check: b => {
      const n = b.length;
      return { unlocked: n >= 150, progress: Math.min((n/150)*100,100), progressLabel: `${n}/150` };
    },
  },
  {
    id: 'true_master', category: 'Maestría', rarity: 'legendary', xp: 5000,
    title: 'Leyenda ReadingHub', description: '300 libros terminados',
    hint: 'Terminá 300 libros. El logro más difícil del sistema.',
    check: b => {
      const n = finished(b).length;
      return { unlocked: n >= 300, progress: Math.min((n/300)*100,100), progressLabel: `${n}/300` };
    },
  },
];

export function calcAchievements(books: Book[]): Achievement[] {
  return DEFS.map(def => {
    const result = def.check(books);
    return {
      id: def.id, title: def.title, description: def.description,
      hint: def.hint, category: def.category, rarity: def.rarity,
      xp: def.xp, ...result,
    };
  }).sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    const tierA = RARITY_CONFIG[a.rarity].tier;
    const tierB = RARITY_CONFIG[b.rarity].tier;
    return tierB - tierA;
  });
}

export const TOTAL_ACHIEVEMENTS = DEFS.length;

// ── Infer unlock date from books ──────────────────────────────
// Returns the most appropriate date (ISO string) for when each achievement
// was likely unlocked, based on the books' end dates.
export function inferUnlockDate(id: string, books: Book[]): string | null {
  const fin = books
    .filter(b => b.status === 'finished' && b.end)
    .sort((a, b) => (a.end || '').localeCompare(b.end || ''));

  if (fin.length === 0) return null;

  // Volume: N-th finished book end date
  const bookMilestones: Record<string, number> = {
    first_book: 1, first_finish: 1,
    books_5: 5, books_10: 10, books_25: 25, books_50: 50,
    books_100: 100, books_200: 200,
  };
  if (bookMilestones[id] !== undefined) {
    const nth = fin[bookMilestones[id] - 1];
    return nth?.end || null;
  }

  // Pages milestones: find book that crossed the threshold
  const pageMilestones: Record<string, number> = {
    pages_1000: 1000, pages_5000: 5000, pages_10000: 10000, pages_50000: 50000,
  };
  if (pageMilestones[id] !== undefined) {
    let running = 0;
    for (const b of fin) {
      running += b.pages || 0;
      if (running >= pageMilestones[id]) return b.end || null;
    }
    return null;
  }

  // Annual goals: find the year when the goal was first reached
  const goalMap: Record<string, number> = { goal_12: 12, goal_24: 24 };
  if (goalMap[id] !== undefined) {
    const target = goalMap[id];
    const byYear: Record<string, Book[]> = {};
    fin.forEach(b => {
      const y = b.end!.slice(0, 4);
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(b);
    });
    for (const year of Object.keys(byYear).sort()) {
      if (byYear[year].length >= target) {
        const sorted = byYear[year].sort((a, b) => (a.end || '').localeCompare(b.end || ''));
        return sorted[target - 1]?.end || null;
      }
    }
    return null;
  }

  // Streak achievements: use last book of the streak
  if (['streak_3', 'streak_6', 'streak_12', 'two_month', 'five_month'].includes(id)) {
    // Approximate: use the end date of the book that completed the streak
    // For simplicity use the nth book (rough approximation)
    const streakBooks: Record<string, number> = {
      two_month: 2, streak_3: 3, five_month: 5, streak_6: 6, streak_12: 12,
    };
    const nth = fin[Math.min((streakBooks[id] || 1) - 1, fin.length - 1)];
    return nth?.end || fin[fin.length - 1]?.end || null;
  }

  // First quote / note: find earliest book with content
  if (id === 'first_quote') {
    const b = [...fin].sort((a, b) => (a.end || '').localeCompare(b.end || ''))
      .find(x => x.quotes && x.quotes.trim().length > 10);
    return b?.end || null;
  }
  if (['first_note', 'notes_5'].includes(id)) {
    const withNotes = fin.filter(x => x.notes && x.notes.trim().length > 10);
    if (id === 'notes_5' && withNotes.length >= 5) return withNotes[4]?.end || null;
    return withNotes[0]?.end || null;
  }

  // Ratings
  if (['five_stars_1', 'five_stars_5', 'five_stars_10', 'all_ratings'].includes(id)) {
    const fiveStars = fin.filter(b => b.rating === 5).sort((a, b) => (a.end||'').localeCompare(b.end||''));
    const targets: Record<string, number> = { five_stars_1: 1, five_stars_5: 5, five_stars_10: 10 };
    if (targets[id]) return fiveStars[targets[id] - 1]?.end || null;
    if (id === 'all_ratings') {
      const hasAll = [1,2,3,4,5].every(r => fin.some(b => b.rating === r));
      if (hasAll) return fin[fin.length - 1]?.end || null;
    }
    return null;
  }

  // Diversity: genres, authors
  if (id.startsWith('genres_') || id.startsWith('authors_') || id === 'two_languages') {
    return fin[fin.length - 1]?.end || null;
  }

  // Formats
  if (['all_formats', 'all_categories'].includes(id)) {
    return fin[fin.length - 1]?.end || null;
  }

  // Default: use last finished book date
  return fin[fin.length - 1]?.end || null;
}
