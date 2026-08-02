import express    from 'express';
import cors       from 'cors';
import multer     from 'multer';
import path       from 'path';
import fs         from 'fs';
import { fileURLToPath } from 'url';
import { Low }    from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 3001;

const COVERS_DIR = path.join(__dirname, 'covers');
const DATA_DIR   = path.join(__dirname, 'data');
const CLIENT_DIR = path.join(__dirname, '..', 'client', 'dist');

[COVERS_DIR, DATA_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Database ──────────────────────────────────────────────────
const adapter = new JSONFile(path.join(DATA_DIR, 'readinghub.json'));
const db = new Low(adapter, {
  books: [], settings: { ownerName:'Lector', yearlyGoal:12, theme:'dark', accentColor:'#8B5CF6', avatarUrl:'' },
  monthlyPages: [], customLevels: [], documents: [],
  customAchievements: [], achievementOverrides: [], challengeOverrides: [],
  customChallenges: [], categoryOverrides: {}, collections: [],
  notifications: [],
  sessions: [],
  authorAvatars: {},
});
await db.read();
// Ensure new fields exist on old DBs
if (!db.data.collections)    db.data.collections = [];
if (!db.data.notifications)  db.data.notifications = [];
if (!db.data.sessions)       db.data.sessions = [];
if (!db.data.authorAvatars)  db.data.authorAvatars = {};

let saveTimer;
const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => db.write(), 300); };
const uid  = () => nanoid(12);
const now  = () => new Date().toISOString();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/covers', express.static(COVERS_DIR));
app.use(express.static(CLIENT_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, COVERS_DIR),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${uid()}${path.extname(file.originalname).toLowerCase()||'.jpg'}`),
});
const upload = multer({ storage, limits:{ fileSize: 10*1024*1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)) });

// ═══ BOOKS ═══════════════════════════════════════════════════
// Normalize tags: lowercase, trim, deduplicate
function normTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map(t => String(t).toLowerCase().trim()).filter(Boolean))];
}

app.get('/api/books', (req, res) =>
  res.json([...db.data.books].sort((a,b) => b.createdAt.localeCompare(a.createdAt))));

app.post('/api/books', (req, res) => {
  const ts = now();
  const book = { id:uid(), ...req.body, tags:req.body.tags||[], themes:req.body.themes||[],
    tags:normTags(req.body.tags), themes:normTags(req.body.themes),
    duration:req.body.duration||0, minutesListened:req.body.minutesListened||0, createdAt:ts, updatedAt:ts };
  db.data.books.push(book); save();
  res.status(201).json(book);
});

app.put('/api/books/:id', (req, res) => {
  const i = db.data.books.findIndex(b => b.id===req.params.id);
  if (i<0) return res.status(404).json({error:'Not found'});
  // Preserve createdAt so sorting by recency isn't affected by edits
  const { createdAt, ...rest } = req.body;
  if (rest.tags) rest.tags = normTags(rest.tags);
  if (rest.themes) rest.themes = normTags(rest.themes);
  db.data.books[i] = {...db.data.books[i], ...rest, updatedAt:now()};
  save(); res.json(db.data.books[i]);
});

app.delete('/api/books/:id', (req, res) => {
  const b = db.data.books.find(b => b.id===req.params.id);
  if (b?.cover?.startsWith('/covers/')) {
    const f = path.join(COVERS_DIR, path.basename(b.cover));
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  db.data.books = db.data.books.filter(b => b.id!==req.params.id);
  save(); res.json({ok:true});
});

// ═══ COVERS ══════════════════════════════════════════════════
app.post('/api/covers/upload', upload.single('cover'), (req, res) => {
  if (!req.file) return res.status(400).json({error:'No file'});
  res.json({ url:`/covers/${req.file.filename}` });
});

// ═══ SETTINGS ════════════════════════════════════════════════
app.get('/api/settings', (req, res) => res.json(db.data.settings));
app.put('/api/settings', (req, res) => {
  Object.assign(db.data.settings, req.body); save(); res.json({ok:true});
});
app.post('/api/settings/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({error:'No file'});
  const url = `/covers/${req.file.filename}`;
  db.data.settings.avatarUrl = url; save(); res.json({url});
});

// ═══ AUTHOR AVATARS ══════════════════════════════════════════
app.get('/api/author-avatars', (req, res) => res.json(db.data.authorAvatars));

app.post('/api/author-avatars/upload', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({error:'No file'});
  const author = req.body.author;
  if (!author) return res.status(400).json({error:'Missing author'});
  // Replace previous custom avatar file for this author, if any
  const prev = db.data.authorAvatars[author];
  if (prev?.startsWith('/covers/')) {
    const f = path.join(COVERS_DIR, path.basename(prev));
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  const url = `/covers/${req.file.filename}`;
  db.data.authorAvatars[author] = url; save(); res.json({url});
});

app.delete('/api/author-avatars/:author', (req, res) => {
  const author = decodeURIComponent(req.params.author);
  const prev = db.data.authorAvatars[author];
  if (prev?.startsWith('/covers/')) {
    const f = path.join(COVERS_DIR, path.basename(prev));
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  delete db.data.authorAvatars[author];
  save(); res.json({ok:true});
});

// ═══ MONTHLY PAGES ═══════════════════════════════════════════
app.get('/api/monthly-pages', (req, res) => res.json(db.data.monthlyPages));
app.put('/api/monthly-pages/:ym', (req, res) => {
  const { ym } = req.params;
  const { pages, notes='' } = req.body;
  const i = db.data.monthlyPages.findIndex(m => m.yearMonth===ym);
  if (i>=0) db.data.monthlyPages[i] = {...db.data.monthlyPages[i], pages, notes};
  else db.data.monthlyPages.push({id:uid(), yearMonth:ym, pages, notes});
  save(); res.json(db.data.monthlyPages.find(m => m.yearMonth===ym));
});

// ═══ LEVELS ══════════════════════════════════════════════════
app.get('/api/levels', (req, res) => res.json(db.data.customLevels));
app.put('/api/levels', (req, res) => { db.data.customLevels=req.body; save(); res.json({ok:true}); });

// ═══ DOCUMENTS ═══════════════════════════════════════════════
app.get('/api/documents', (req, res) =>
  res.json([...db.data.documents].sort((a,b) => {
    if (a.pinned&&!b.pinned) return -1; if (!a.pinned&&b.pinned) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  })));
app.post('/api/documents', (req, res) => {
  const ts=now(), doc={id:uid(),...req.body,tags:req.body.tags||[],createdAt:ts,updatedAt:ts};
  db.data.documents.push(doc); save(); res.status(201).json(doc);
});
app.put('/api/documents/:id', (req, res) => {
  const i=db.data.documents.findIndex(d=>d.id===req.params.id);
  if (i<0) return res.status(404).json({error:'Not found'});
  db.data.documents[i]={...db.data.documents[i],...req.body,updatedAt:now()};
  save(); res.json(db.data.documents[i]);
});
app.delete('/api/documents/:id', (req, res) => {
  db.data.documents=db.data.documents.filter(d=>d.id!==req.params.id); save(); res.json({ok:true});
});

// ═══ GAMIFICATION ════════════════════════════════════════════
// Custom achievements
app.get('/api/custom-achievements', (req,res) => res.json(db.data.customAchievements));
app.post('/api/custom-achievements', (req,res) => {
  const a={id:uid(),...req.body}; db.data.customAchievements.push(a); save(); res.status(201).json(a);
});
app.put('/api/custom-achievements/:id', (req,res) => {
  const i=db.data.customAchievements.findIndex(a=>a.id===req.params.id);
  if (i<0) return res.status(404).json({error:'Not found'});
  db.data.customAchievements[i]={...db.data.customAchievements[i],...req.body};
  save(); res.json(db.data.customAchievements[i]);
});
app.delete('/api/custom-achievements/:id', (req,res) => {
  db.data.customAchievements=db.data.customAchievements.filter(a=>a.id!==req.params.id); save(); res.json({ok:true});
});

// Achievement overrides
app.get('/api/achievement-overrides', (req,res) => res.json(db.data.achievementOverrides));
app.put('/api/achievement-overrides/:id', (req,res) => {
  const i=db.data.achievementOverrides.findIndex(o=>o.id===req.params.id);
  const item={id:req.params.id,...req.body};
  if (i>=0) db.data.achievementOverrides[i]=item; else db.data.achievementOverrides.push(item);
  save(); res.json({ok:true});
});

// Challenge overrides
app.get('/api/challenge-overrides', (req,res) => res.json(db.data.challengeOverrides));
app.put('/api/challenge-overrides/:id', (req,res) => {
  const i=db.data.challengeOverrides.findIndex(o=>o.id===req.params.id);
  const item={id:req.params.id,...req.body};
  if (i>=0) db.data.challengeOverrides[i]=item; else db.data.challengeOverrides.push(item);
  save(); res.json({ok:true});
});

// Custom challenges
app.get('/api/custom-challenges', (req,res) => res.json(db.data.customChallenges));
app.post('/api/custom-challenges', (req,res) => {
  const c={id:uid(),...req.body}; db.data.customChallenges.push(c); save(); res.status(201).json(c);
});
app.put('/api/custom-challenges/:id', (req,res) => {
  const i=db.data.customChallenges.findIndex(c=>c.id===req.params.id);
  if (i<0) return res.status(404).json({error:'Not found'});
  db.data.customChallenges[i]={...db.data.customChallenges[i],...req.body};
  save(); res.json(db.data.customChallenges[i]);
});
app.delete('/api/custom-challenges/:id', (req,res) => {
  db.data.customChallenges=db.data.customChallenges.filter(c=>c.id!==req.params.id); save(); res.json({ok:true});
});

// Category overrides
app.get('/api/category-overrides', (req,res) => res.json(db.data.categoryOverrides));
app.put('/api/category-overrides/:cat', (req,res) => {
  const cat=decodeURIComponent(req.params.cat);
  db.data.categoryOverrides[cat]={...(db.data.categoryOverrides[cat]||{}),...req.body};
  save(); res.json({ok:true});
});

// ═══ COLLECTIONS ════════════════════════════════════════════
app.get('/api/collections', (req,res) => res.json(db.data.collections));

app.post('/api/collections', (req,res) => {
  const ts=now();
  const col={ id:uid(), ...req.body,
    books: req.body.books||[],
    createdAt:ts, updatedAt:ts };
  db.data.collections.push(col); save(); res.status(201).json(col);
});

app.put('/api/collections/:id', (req,res) => {
  const i=db.data.collections.findIndex(c=>c.id===req.params.id);
  if (i<0) return res.status(404).json({error:'Not found'});
  db.data.collections[i]={...db.data.collections[i],...req.body,updatedAt:now()};
  save(); res.json(db.data.collections[i]);
});

app.delete('/api/collections/:id', (req,res) => {
  db.data.collections=db.data.collections.filter(c=>c.id!==req.params.id);
  save(); res.json({ok:true});
});

// ═══ READING SESSIONS ════════════════════════════════════════
app.get('/api/sessions', (req,res) => res.json(db.data.sessions || []));
app.get('/api/sessions/book/:bookId', (req,res) =>
  res.json((db.data.sessions||[]).filter(s=>s.bookId===req.params.bookId)));
app.post('/api/sessions', (req,res) => {
  if (!db.data.sessions) db.data.sessions = [];
  const s = { id:uid(), ...req.body, createdAt:now() };
  db.data.sessions.push(s); save(); res.status(201).json(s);
});
app.put('/api/sessions/:id', (req,res) => {
  const i = (db.data.sessions||[]).findIndex(s=>s.id===req.params.id);
  if (i<0) return res.status(404).json({error:'Not found'});
  db.data.sessions[i] = {...db.data.sessions[i],...req.body}; save(); res.json(db.data.sessions[i]);
});
app.delete('/api/sessions/:id', (req,res) => {
  db.data.sessions = (db.data.sessions||[]).filter(s=>s.id!==req.params.id);
  save(); res.json({ok:true});
});

// ═══ NOTIFICATIONS ═══════════════════════════════════════════
app.get('/api/notifications', (req,res) => res.json(db.data.notifications || []));
app.post('/api/notifications', (req,res) => {
  const n = { id:uid(), ...req.body, createdAt: req.body.createdAt || now(), read: false };
  if (!db.data.notifications) db.data.notifications = [];
  // Avoid duplicates (same achievementId)
  if (req.body.achievementId && db.data.notifications.find(x => x.achievementId === req.body.achievementId)) {
    return res.status(200).json({ duplicate: true });
  }
  db.data.notifications.unshift(n); save(); res.status(201).json(n);
});
app.put('/api/notifications/:id', (req,res) => {
  const i = db.data.notifications?.findIndex(x => x.id === req.params.id);
  if (i === undefined || i < 0) return res.status(404).json({error:'Not found'});
  db.data.notifications[i] = { ...db.data.notifications[i], ...req.body };
  save(); res.json(db.data.notifications[i]);
});
// read-all MUST come before :id/read to avoid Express matching "read-all" as id
app.put('/api/notifications/read-all', (req,res) => {
  (db.data.notifications || []).forEach(n => { n.read = true; });
  save(); res.json({ ok: true });
});
app.put('/api/notifications/:id/read', (req,res) => {
  const n = db.data.notifications?.find(x => x.id === req.params.id);
  if (n) { n.read = true; save(); }
  res.json({ ok: true });
});
app.put('/api/notifications/:id/unread', (req,res) => {
  const n = db.data.notifications?.find(x => x.id === req.params.id);
  if (n) { n.read = false; save(); }
  res.json({ ok: true });
});
app.delete('/api/notifications/:id', (req,res) => {
  db.data.notifications = (db.data.notifications||[]).filter(x => x.id !== req.params.id);
  save(); res.json({ ok: true });
});

// ═══ BACKUP ══════════════════════════════════════════════════
app.get('/api/backup', (req,res) => res.json({version:'2.7', exportedAt:now(), ...db.data}));

// Full restore — books + settings + all config
app.post('/api/restore', async (req,res) => {
  const d = req.body;
  if (d.books)                db.data.books               = d.books;
  if (d.settings)             Object.assign(db.data.settings, d.settings);
  if (d.customAchievements)   db.data.customAchievements  = d.customAchievements;
  if (d.achievementOverrides) db.data.achievementOverrides= d.achievementOverrides;
  if (d.customChallenges)     db.data.customChallenges    = d.customChallenges;
  if (d.challengeOverrides)   db.data.challengeOverrides  = d.challengeOverrides;
  if (d.categoryOverrides)    db.data.categoryOverrides   = d.categoryOverrides;
  if (d.customLevels)         db.data.customLevels        = d.customLevels;
  if (d.monthlyPages)         db.data.monthlyPages        = d.monthlyPages;
  if (d.notifications)        db.data.notifications       = d.notifications;
  if (d.collections)          db.data.collections         = d.collections;
  if (d.documents)            db.data.documents           = d.documents;
  if (d.sessions)             db.data.sessions            = d.sessions;
  await db.write();
  res.json({ ok:true, restored: d.books?.length || 0 });
});

// Config-only export (no books, no documents)
app.get('/api/backup/config', (req,res) => {
  const { books, documents, ...config } = db.data;
  res.json({ version:'2.7', exportedAt:now(), ...config });
});

// Config-only restore
app.post('/api/restore/config', async (req,res) => {
  const d = req.body;
  if (d.settings)             Object.assign(db.data.settings, d.settings);
  if (d.customAchievements)   db.data.customAchievements  = d.customAchievements;
  if (d.achievementOverrides) db.data.achievementOverrides= d.achievementOverrides;
  if (d.customChallenges)     db.data.customChallenges    = d.customChallenges;
  if (d.challengeOverrides)   db.data.challengeOverrides  = d.challengeOverrides;
  if (d.categoryOverrides)    db.data.categoryOverrides   = d.categoryOverrides;
  if (d.customLevels)         db.data.customLevels        = d.customLevels;
  if (d.notifications)        db.data.notifications       = d.notifications;
  await db.write();
  res.json({ ok:true });
});

// ═══ SPA FALLBACK ════════════════════════════════════════════
app.get('*', (req,res) => {
  const index=path.join(CLIENT_DIR,'index.html');
  if (fs.existsSync(index)) return res.sendFile(index);
  res.status(503).send(`<html><body style="font-family:sans-serif;background:#0A0B14;color:#9898B0;padding:40px;text-align:center">
    <h1 style="color:#8B5CF6">ReadingHub</h1>
    <p>Primero compilá el cliente:</p>
    <code style="background:#1B1D2B;padding:6px 14px;border-radius:8px;color:#C4B5FD">npm run build:client</code>
    </body></html>`);
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log('  ║        READINGHUB  v1.0.1                ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log(`\n  → http://localhost:${PORT}`);
  console.log(`  → Datos: ${path.join(DATA_DIR, 'readinghub.json')}`);
  console.log(`  → Portadas: ${COVERS_DIR}\n`);
});
