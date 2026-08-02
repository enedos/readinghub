import type { Book, CustomLevel } from '../types';

// ── Niveles ──────────────────────────────────────────────────
export const LEVELS = [
  { level: 1, xp: 0,     title: 'Lector Curioso'             },
  { level: 2, xp: 500,   title: 'Explorador'                 },
  { level: 3, xp: 1500,  title: 'Devorador'                  },
  { level: 4, xp: 3000,  title: 'Erudito'                    },
  { level: 5, xp: 5000,  title: 'Sabio'                      },
  { level: 6, xp: 8000,  title: 'Archivista'                 },
  { level: 7, xp: 12000, title: 'Maestro'                    },
  { level: 8, xp: 18000, title: 'Leyenda'                    },
  { level: 9, xp: 25000, title: 'Explorador del Conocimiento'},
];

export function bookXP(b: Book): number {
  if (b.status === 'planned') return 0;
  const mult = 0.8 + (b.difficulty - 1) * 0.3;
  const pages = b.pagesRead * 1 * mult;
  const bonus = b.status === 'finished' ? 50 : 0;
  const ratingBonus = b.status === 'finished' && b.rating >= 4 ? 25 : 0;
  return Math.round(pages + bonus + ratingBonus);
}

export function totalXP(books: Book[]): number {
  return books.reduce((acc, b) => acc + bookXP(b), 0);
}

export function levelInfo(xp: number, customLevels?: CustomLevel[] | null) {
  const levelsToUse = (customLevels && customLevels.length > 0) ? customLevels : LEVELS;
  let cur = levelsToUse[0];
  for (const l of levelsToUse) { if (xp >= l.xp) cur = l; else break; }
  const levelsRef = (customLevels && customLevels.length > 0) ? customLevels : LEVELS;
  const idx = levelsRef.indexOf(cur);
  const next = levelsRef[idx + 1];
  const isMax = !next;
  const progressXP = xp - cur.xp;
  const rangeXP = (next?.xp ?? cur.xp) - cur.xp;
  return {
    level: cur.level, title: cur.title, totalXP: xp,
    xpForNext: next?.xp ?? xp,
    progressPercent: isMax ? 100 : Math.min(Math.round((progressXP / rangeXP) * 100), 100),
    isMax,
  };
}

// ── Stats helpers ────────────────────────────────────────────
export function booksByMonth(books: Book[], year: number) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return months.map((month, i) => {
    const key = `${year}-${String(i+1).padStart(2,'0')}`;
    return {
      month,
      count: books.filter(b => b.status === 'finished' && b.end?.startsWith(key)).length,
    };
  });
}

export function pagesByMonth(books: Book[], year: number) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return months.map((month, i) => {
    const key = `${year}-${String(i+1).padStart(2,'0')}`;
    const count = books
      .filter(b => b.status === 'finished' && b.end?.startsWith(key))
      .reduce((acc, b) => acc + b.pages, 0);
    return { month, count };
  });
}

export function topTags(books: Book[], n = 10) {
  const counts: Record<string, number> = {};
  books.forEach(b => b.tags.forEach(t => { counts[t] = (counts[t]||0)+1; }));
  return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, n);
}

export function ratingDist(books: Book[]) {
  const finished = books.filter(b => b.status === 'finished');
  return [5,4,3,2,1].map(r => ({
    rating: r,
    count: finished.filter(b => b.rating === r).length,
  }));
}

export function streakMonths(books: Book[]): number {
  const active = new Set<string>();
  books.forEach(b => {
    if (b.end) active.add(b.end.slice(0,7));
    if (b.start && b.status === 'reading') active.add(b.start.slice(0,7));
  });
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (active.has(key)) streak++; else break;
  }
  return streak;
}


// ── Challenges ────────────────────────────────────────────────
export function activeChallenges(books: Book[], goal: number) {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const monthKey = `${year}-${String(month+1).padStart(2,'0')}`;
  const lastDay = new Date(year, month+1, 0).toISOString().slice(0,10);

  const thisYear  = books.filter(b => b.status === 'finished' && b.end?.startsWith(String(year)));
  const thisMonth = books.filter(b => b.status === 'finished' && b.end?.startsWith(monthKey));
  const pagesMonth = thisMonth.reduce((a,b) => a+b.pages, 0);
  const tagsMonth = new Set(thisMonth.flatMap(b=>b.tags)).size;

  return [
    { id:'year_goal',    icon:'📅', title:`Meta ${year}`,        description:`Leer ${goal} libros este año`,   target:goal,    current:thisYear.length,  unit:'libros', deadline:`${year}-12-31`,  completed:thisYear.length>=goal,     xpReward:500 },
    { id:'month_book',   icon:'📖', title:'Libro del mes',       description:'1 libro este mes',               target:1,       current:thisMonth.length, unit:'libros', deadline:lastDay,          completed:thisMonth.length>=1,       xpReward:100 },
    { id:'pages_month',  icon:'📜', title:'Desafío de páginas',  description:'1000 páginas este mes',          target:1000,    current:pagesMonth,       unit:'páginas',deadline:lastDay,          completed:pagesMonth>=1000,          xpReward:200 },
    { id:'genres_month', icon:'🗺️', title:'Diversidad',          description:'3 géneros distintos este mes',   target:3,       current:tagsMonth,        unit:'géneros',deadline:lastDay,          completed:tagsMonth>=3,              xpReward:150 },
  ];
}
