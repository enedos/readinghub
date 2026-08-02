// Central API client — talks to localhost:3001
const BASE = '';  // same origin when served by Express

async function req<T>(method: string, path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

const get    = <T>(path: string)              => req<T>('GET',    path);
const post   = <T>(path: string, body: any)   => req<T>('POST',   path, body);
const put    = <T>(path: string, body: any)   => req<T>('PUT',    path, body);
const del    = <T>(path: string)              => req<T>('DELETE', path);

// ── Books ────────────────────────────────────────────────────
export const api = {
  books: {
    list:   ()            => get<any[]>('/books'),
    create: (b: any)      => post<any>('/books', b),
    update: (id: string, b: any) => put<any>(`/books/${id}`, b),
    delete: (id: string)  => del<any>(`/books/${id}`),
  },

  covers: {
    upload: async (file: File): Promise<string> => {
      const fd = new FormData();
      fd.append('cover', file);
      const res = await fetch('/api/covers/upload', { method: 'POST', body: fd });
      const data = await res.json();
      return data.url;
    },
  },

  settings: {
    get:    ()       => get<any>('/settings'),
    update: (s: any) => put<any>('/settings', s),
    uploadAvatar: async (file: File): Promise<string> => {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch('/api/settings/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      return data.url;
    },
  },

  authorAvatars: {
    list: () => get<Record<string,string>>('/author-avatars'),
    upload: async (author: string, file: File): Promise<string> => {
      const fd = new FormData();
      fd.append('author', author);
      fd.append('avatar', file);
      const res = await fetch('/api/author-avatars/upload', { method: 'POST', body: fd });
      const data = await res.json();
      return data.url;
    },
    remove: (author: string) => del<any>(`/author-avatars/${encodeURIComponent(author)}`),
  },

  monthlyPages: {
    list:   ()                              => get<any[]>('/monthly-pages'),
    set:    (yearMonth: string, pages: number, notes?: string) =>
      put<any>(`/monthly-pages/${yearMonth}`, { pages, notes }),
  },

  levels: {
    get:    () => get<any[]>('/levels'),
    set:    (levels: any[]) => put<any>('/levels', levels),
  },

  documents: {
    list:   ()            => get<any[]>('/documents'),
    create: (d: any)      => post<any>('/documents', d),
    update: (id: string, d: any) => put<any>(`/documents/${id}`, d),
    delete: (id: string)  => del<any>(`/documents/${id}`),
  },

  customAchievements: {
    list:   ()            => get<any[]>('/custom-achievements'),
    create: (a: any)      => post<any>('/custom-achievements', a),
    update: (id: string, a: any) => put<any>(`/custom-achievements/${id}`, a),
    delete: (id: string)  => del<any>(`/custom-achievements/${id}`),
  },

  achievementOverrides: {
    list:   ()            => get<any[]>('/achievement-overrides'),
    set:    (id: string, data: any) => put<any>(`/achievement-overrides/${id}`, data),
  },

  challengeOverrides: {
    list:   ()            => get<any[]>('/challenge-overrides'),
    set:    (id: string, data: any) => put<any>(`/challenge-overrides/${id}`, data),
  },

  customChallenges: {
    list:   ()            => get<any[]>('/custom-challenges'),
    create: (c: any)      => post<any>('/custom-challenges', c),
    update: (id: string, c: any) => put<any>(`/custom-challenges/${id}`, c),
    delete: (id: string)  => del<any>(`/custom-challenges/${id}`),
  },

  categoryOverrides: {
    get:    ()                        => get<any>('/category-overrides'),
    set:    (category: string, data: any) => put<any>(`/category-overrides/${encodeURIComponent(category)}`, data),
  },

  collections: {
    list:   ()                        => get<any[]>('/collections'),
    create: (col: any)                => post<any>('/collections', col),
    update: (id: string, col: any)    => put<any>(`/collections/${id}`, col),
    delete: (id: string)              => del<any>(`/collections/${id}`),
  },

  sessions: {
    list:       ()                    => get<any[]>('/sessions'),
    listByBook: (bookId: string)      => get<any[]>(`/sessions/book/${bookId}`),
    create:     (s: any)              => post<any>('/sessions', s),
    update:     (id: string, s: any)  => put<any>(`/sessions/${id}`, s),
    delete:     (id: string)          => del<any>(`/sessions/${id}`),
  },

  notifications: {
    list:    ()                     => get<any[]>('/notifications'),
    create:  (n: any)               => post<any>('/notifications', n),
    markRead:(id: string)           => put<any>(`/notifications/${id}/read`, {}),
    markUnread:(id: string)         => put<any>(`/notifications/${id}/unread`, {}),
    markAllRead: ()                 => put<any>('/notifications/read-all', {}),
    delete:  (id: string)           => del<any>(`/notifications/${id}`),
  },

  backup: {
    export:       () => get<any>('/backup'),
    import:       (data: any) => post<any>('/restore', data),
    exportConfig: () => get<any>('/backup/config'),
    importConfig: (data: any) => post<any>('/restore/config', data),
  },
};
