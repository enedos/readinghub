import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

interface AppState {
  books: any[]; settings: any; monthlyPages: any[];
  customLevels: any[] | null; documents: any[];
  customAchievements: any[]; achievementOverrides: any[];
  challengeOverrides: any[]; customChallenges: any[];
  categoryOverrides: Record<string,any>;
  loading: boolean; error: string | null;
  collections: any[];
  notifications: any[];
  sessions: any[];
}

const DEFAULT_SETTINGS = { ownerName:'Lector', yearlyGoal:12, theme:'dark', accentColor:'#8B5CF6', avatarUrl:'' };

interface AppContextValue extends AppState {
  addBook:    (b: any) => Promise<any>;
  updateBook: (id: string, b: any) => Promise<any>;
  deleteBook: (id: string) => Promise<void>;
  updateSettings: (s: any) => Promise<void>;
  uploadAvatar:   (file: File) => Promise<string>;
  setMonthlyPages:(ym: string, pages: number, notes?: string) => Promise<void>;
  setCustomLevels:(levels: any[]) => Promise<void>;
  addDocument:    (d: any) => Promise<any>;
  updateDocument: (id: string, d: any) => Promise<any>;
  deleteDocument: (id: string) => Promise<void>;
  addCustomAchievement:    (a: any) => Promise<any>;
  updateCustomAchievement: (id: string, a: any) => Promise<any>;
  deleteCustomAchievement: (id: string) => Promise<void>;
  setAchievementOverride:  (id: string, data: any) => Promise<void>;
  setChallengeOverride:    (id: string, data: any) => Promise<void>;
  setCustomChallenges:     (challenges: any[]) => Promise<void>;
  setCategoryOverride:     (category: string, data: any) => Promise<void>;
  exportData:  () => Promise<any>;
  importData:  (data: any) => Promise<void>;
  importBooks: (books: any[]) => Promise<void>;
  uploadCover: (file: File) => Promise<string>;
  // Collections
  collections: any[];
  addCollection:    (col: any) => Promise<any>;
  updateCollection: (id: string, col: any) => Promise<any>;
  deleteCollection: (id: string) => Promise<void>;
  // Notifications
  notifications: any[];
  addNotification:  (n: any) => Promise<any>;
  markNotificationRead: (id: string) => Promise<void>;
  markNotificationUnread: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  sessions: any[];
  addSession: (s: any) => Promise<any>;
  updateSession: (id: string, s: any) => Promise<any>;
  deleteSession: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    books:[], settings:DEFAULT_SETTINGS, monthlyPages:[], customLevels:null, collections:[],
    documents:[], customAchievements:[], achievementOverrides:[], challengeOverrides:[],
    customChallenges:[], categoryOverrides:{}, loading:true, error:null,
    notifications:[],
    sessions:[],
  });

  const set = useCallback((u: Partial<AppState>) => setState(s => ({...s,...u})), []);

  useEffect(() => {
    Promise.all([
      api.books.list(), api.settings.get(), api.monthlyPages.list(),
      api.levels.get(), api.documents.list(), api.customAchievements.list(),
      api.achievementOverrides.list(), api.challengeOverrides.list(),
      api.customChallenges.list(), api.categoryOverrides.get(),
      api.collections.list(), api.notifications.list(), api.sessions.list(),
    ]).then(([books,settings,monthlyPages,customLevels,documents,
              customAchievements,achievementOverrides,challengeOverrides,
              customChallenges,categoryOverrides,collections,notifications,sessions]) => {
      if (settings.theme === 'light') document.documentElement.classList.add('light');
      else document.documentElement.classList.remove('light');
      set({ books, settings, monthlyPages,
            customLevels: customLevels.length > 0 ? customLevels : null,
            documents, customAchievements, achievementOverrides,
            challengeOverrides, customChallenges, categoryOverrides,
            collections, notifications, sessions, loading:false });
    }).catch(err => set({ loading:false, error:`No se pudo conectar con el servidor. ¿Está corriendo? (${err.message})` }));
  }, []);

  const addBook = useCallback(async (b: any) => {
    const book = await api.books.create(b);
    setState(s => ({...s, books:[book,...s.books]}));
    return book;
  }, []);

  const updateBook = useCallback(async (id: string, b: any) => {
    const updated = await api.books.update(id, b);
    setState(s => ({...s, books:s.books.map(x => x.id===id ? updated : x)}));
    return updated;
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    await api.books.delete(id);
    setState(s => ({...s, books:s.books.filter(x => x.id!==id)}));
  }, []);

  const updateSettings = useCallback(async (data: any) => {
    await api.settings.update(data);
    setState(s => ({...s, settings:{...s.settings,...data}}));
    if (data.theme==='light') document.documentElement.classList.add('light');
    else if (data.theme==='dark') document.documentElement.classList.remove('light');
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const url = await api.settings.uploadAvatar(file);
    setState(s => ({...s, settings:{...s.settings, avatarUrl:url}}));
    return url;
  }, []);

  const setMonthlyPages = useCallback(async (ym: string, pages: number, notes?: string) => {
    const updated = await api.monthlyPages.set(ym, pages, notes);
    setState(s => {
      const ex = s.monthlyPages.find(m => m.yearMonth===ym);
      return {...s, monthlyPages: ex
        ? s.monthlyPages.map(m => m.yearMonth===ym ? updated : m)
        : [...s.monthlyPages, updated]};
    });
  }, []);

  const setCustomLevels = useCallback(async (levels: any[]) => {
    await api.levels.set(levels);
    set({ customLevels:levels });
  }, [set]);

  const addDocument = useCallback(async (d: any) => {
    const doc = await api.documents.create(d);
    setState(s => ({...s, documents:[doc,...s.documents]}));
    return doc;
  }, []);

  const updateDocument = useCallback(async (id: string, d: any) => {
    const doc = await api.documents.update(id, d);
    setState(s => ({...s, documents:s.documents.map(x => x.id===id ? doc : x)}));
    return doc;
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    await api.documents.delete(id);
    setState(s => ({...s, documents:s.documents.filter(x => x.id!==id)}));
  }, []);

  const addCustomAchievement = useCallback(async (a: any) => {
    const ach = await api.customAchievements.create(a);
    setState(s => ({...s, customAchievements:[...s.customAchievements, ach]}));
    return ach;
  }, []);

  const updateCustomAchievement = useCallback(async (id: string, a: any) => {
    const ach = await api.customAchievements.update(id, a);
    setState(s => ({...s, customAchievements:s.customAchievements.map(x => x.id===id ? ach : x)}));
    return ach;
  }, []);

  const deleteCustomAchievement = useCallback(async (id: string) => {
    await api.customAchievements.delete(id);
    setState(s => ({...s, customAchievements:s.customAchievements.filter(x => x.id!==id)}));
  }, []);

  const setAchievementOverride = useCallback(async (id: string, data: any) => {
    await api.achievementOverrides.set(id, data);
    setState(s => {
      const ex = s.achievementOverrides.find(o => o.id===id);
      return {...s, achievementOverrides: ex
        ? s.achievementOverrides.map(o => o.id===id ? {...o,...data} : o)
        : [...s.achievementOverrides, {id,...data}]};
    });
  }, []);

  const setChallengeOverride = useCallback(async (id: string, data: any) => {
    await api.challengeOverrides.set(id, data);
    setState(s => {
      const ex = s.challengeOverrides.find((o:any) => o.id===id);
      return {...s, challengeOverrides: ex
        ? s.challengeOverrides.map((o:any) => o.id===id ? {...o,...data} : o)
        : [...s.challengeOverrides, {id,...data}]};
    });
  }, []);

  const setCustomChallenges = useCallback(async (challenges: any[]) => {
    setState(s => {
      const current = s.customChallenges;
      // Async sync in background
      (async () => {
        for (const old of current) {
          if (!challenges.find((c: any) => c.id === old.id)) await api.customChallenges.delete(old.id);
        }
        const synced: any[] = [];
        for (const ch of challenges) {
          if (current.find((c: any) => c.id === ch.id)) synced.push(await api.customChallenges.update(ch.id, ch));
          else synced.push(await api.customChallenges.create(ch));
        }
        setState(prev => ({ ...prev, customChallenges: synced }));
      })();
      return { ...s, customChallenges: challenges }; // optimistic update
    });
  }, []);

  const setCategoryOverride = useCallback(async (category: string, data: any) => {
    await api.categoryOverrides.set(category, data);
    setState(s => ({...s, categoryOverrides:{...s.categoryOverrides,
      [category]:{...(s.categoryOverrides[category]||{}), ...data}}}));
  }, []);

  const exportData = useCallback(() => api.backup.export(), []);

  const importData = useCallback(async (data: any) => {
    await api.backup.import(data);
    const [books, settings] = await Promise.all([api.books.list(), api.settings.get()]);
    setState(s => ({...s, books, settings}));
  }, []);

  const importBooks = useCallback(async (books: any[]) => {
    await api.backup.import({ books });
    const fresh = await api.books.list();
    setState(s => ({...s, books:fresh}));
  }, []);

  const addSession = useCallback(async (s: any) => {
    const created = await api.sessions.create(s);
    setState(st => ({...st, sessions:[...st.sessions, created]}));
    return created;
  }, []);
  const updateSession = useCallback(async (id: string, s: any) => {
    const updated = await api.sessions.update(id, s);
    setState(st => ({...st, sessions:st.sessions.map(x => x.id===id ? updated : x)}));
    return updated;
  }, []);
  const deleteSession = useCallback(async (id: string) => {
    await api.sessions.delete(id);
    setState(st => ({...st, sessions:st.sessions.filter(x => x.id!==id)}));
  }, []);

  const addCollection = useCallback(async (col: any) => {
    const created = await api.collections.create(col);
    setState(s => ({...s, collections:[...s.collections, created]}));
    return created;
  }, []);

  const updateCollection = useCallback(async (id: string, col: any) => {
    const updated = await api.collections.update(id, col);
    setState(s => ({...s, collections:s.collections.map(x => x.id===id ? updated : x)}));
    return updated;
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    await api.collections.delete(id);
    setState(s => ({...s, collections:s.collections.filter(x => x.id!==id)}));
  }, []);

  const uploadCover = useCallback((file: File) => api.covers.upload(file), []);

  const addNotification = useCallback(async (n: any) => {
    const created = await api.notifications.create(n);
    if (!(created as any).duplicate) {
      setState(s => ({...s, notifications:[created, ...s.notifications]}));
    }
    return created;
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await api.notifications.markRead(id);
    setState(s => ({...s, notifications:s.notifications.map(n => n.id===id ? {...n,read:true} : n)}));
  }, []);

  const markNotificationUnread = useCallback(async (id: string) => {
    await api.notifications.markUnread(id);
    setState(s => ({...s, notifications:s.notifications.map(n => n.id===id ? {...n,read:false} : n)}));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await api.notifications.markAllRead();
    setState(s => ({...s, notifications:s.notifications.map(n => ({...n,read:true}))}));
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    await api.notifications.delete(id);
    setState(s => ({...s, notifications:s.notifications.filter(n => n.id!==id)}));
  }, []);

  const { collections } = state;
  return (
    <AppContext.Provider value={{
      ...state,
      addBook, updateBook, deleteBook,
      updateSettings, uploadAvatar,
      setMonthlyPages, setCustomLevels,
      addDocument, updateDocument, deleteDocument,
      addCustomAchievement, updateCustomAchievement, deleteCustomAchievement,
      setAchievementOverride, setChallengeOverride, setCustomChallenges, setCategoryOverride,
      exportData, importData, importBooks, uploadCover,
      collections, addCollection, updateCollection, deleteCollection,
      notifications: state.notifications,
      addNotification, markNotificationRead, markNotificationUnread, markAllNotificationsRead, deleteNotification,
      sessions: state.sessions, addSession, updateSession, deleteSession,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useStore<T,>(selector: (state: AppContextValue) => T): T {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useStore must be inside AppProvider');
  return selector(ctx);
}

export { AppContext };
