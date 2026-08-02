// ── ReadingHub — Core Types ────────────────────────────────────

export type BookStatus = 'finished' | 'reading' | 'planned' | 'abandoned';
export type BookFormat = 'physical' | 'digital' | 'audio';

export const FORMAT_CONFIG = {
  physical: { label: 'Físico',     icon: '📖', color: '#8B5CF6', isAudio: false },
  digital:  { label: 'Digital',    icon: '📱', color: '#8B5CF6', isAudio: false },
  audio:    { label: 'Audiolibro', icon: '🎧', color: '#14B8A6', isAudio: true  },
} as const;

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  cover: string;          // URL or empty string
  tags: string[];
  language: string;
  status: BookStatus;
  start: string;          // YYYY-MM-DD or ''
  end: string;            // YYYY-MM-DD or ''
  pages: number;
  pagesRead: number;
  rating: number;         // 0–5
  difficulty: number;     // 1–5
  recommended: boolean;
  publisher: string;
  isbn: string;
  format: BookFormat;
  // Typed content sections
  summary: string;
  quotes: string;         // raw markdown
  characters: string;     // raw markdown
  notes: string;
  themes: string[];
  // Tracking
  // Audio-specific
  duration: number;       // minutes (for audio format)
  minutesListened: number;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;       // YYYY-MM-DD
  completed: boolean;
  xpReward: number;
}

export interface AppSettings {
  ownerName: string;
  yearlyGoal: number;
  theme: 'dark' | 'light';
  accentColor: string;
  avatarUrl: string;
}

export interface AppState {
  books: Book[];
  settings: AppSettings;
  // Actions
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBook: (id: string, data: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  importBooks: (books: Book[]) => void;
  exportData: () => string;
  monthlyPages: MonthlyPages[];
  setMonthlyPages: (yearMonth: string, pages: number, notes?: string) => void;
  customLevels: CustomLevel[] | null;
  setCustomLevels: (levels: CustomLevel[]) => void;
  documents: ReadingHubDocument[];
  addDocument: (doc: Omit<ReadingHubDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, data: Partial<ReadingHubDocument>) => void;
  deleteDocument: (id: string) => void;
  customChallenges: CustomChallenge[] | null;
  setCustomChallenges: (challenges: CustomChallenge[]) => void;
  customAchievements: CustomAchievement[];
  addCustomAchievement: (a: Omit<CustomAchievement,'id'>) => void;
  updateCustomAchievement: (id: string, data: Partial<CustomAchievement>) => void;
  deleteCustomAchievement: (id: string) => void;
  achievementOverrides: AchievementOverride[];
  setAchievementOverride: (id: string, data: Partial<AchievementOverride>) => void;
  challengeOverrides: ChallengeOverride[];
  setChallengeOverride: (id: string, data: Partial<ChallengeOverride>) => void;
}

export interface MonthlyPages {
  id: string;
  yearMonth: string;  // "YYYY-MM"
  pages: number;
  notes?: string;
}

export interface CustomLevel {
  level: number;
  xp: number;
  title: string;
  icon: string;    // emoji fallback
  imageUrl?: string; // preferred: image URL
}

export interface CustomChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;         // emoji or URL
  target: number;
  unit: string;
  deadline: string;
  xpReward: number;
  current?: number;
  type: 'books_year' | 'books_month' | 'pages_month' | 'genres_month' | 'custom';
}

export interface ReadingHubDocument {
  id: string;
  title: string;
  content: string;      // Markdown
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface CustomAchievement {
  id: string;
  title: string;
  description: string;
  hint: string;
  category: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  xp: number;
  unlocked: boolean;  // manual toggle
}

export interface AchievementOverride {
  id: string;           // matches Achievement.id
  title?: string;
  description?: string;
  manualUnlock?: boolean;  // force-unlock regardless of auto check
}

export interface ChallengeOverride {
  id: string;      // 'year_goal' | 'month_book' | 'pages_month' | 'genres_month'
  target?: number;
  title?: string;
  enabled: boolean;
}
