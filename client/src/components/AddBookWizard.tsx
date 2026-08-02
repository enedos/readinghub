import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { C, Modal, Btn, Input, Select, Textarea, Stars, ProgressBar } from './ui';
import { TagInput } from './TagInput';
import type { BookStatus, BookFormat } from '../types';

// ── Open Library search ──────────────────────────────────────
interface OLResult {
  key: string; title: string; author_name?: string[];
  first_publish_year?: number; number_of_pages_median?: number;
  isbn?: string[]; cover_i?: number; subject?: string[];
}

async function searchOpenLibrary(query: string): Promise<OLResult[]> {
  if (!query.trim()) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,subject`;
  const res = await fetch(url);
  const data = await res.json();
  return data.docs || [];
}

function coverUrl(coverId?: number, isbn?: string[]): string {
  if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  if (isbn?.length) return `https://covers.openlibrary.org/b/isbn/${isbn[0]}-M.jpg`;
  return '';
}

// ── Step indicator ───────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, width: i <= current ? 24 : 12, borderRadius: 999,
          background: i <= current ? C.accent : C.border, transition: 'all 0.3s',
        }} />
      ))}
      <span style={{ fontSize: 11, color: C.ink3, marginLeft: 8, fontFamily:C.fontMono }}>
        {current + 1} / {total}
      </span>
    </div>
  );
}

// ── Search result card ───────────────────────────────────────
function SearchResult({ result, onSelect }: { result: OLResult; onSelect: (r: OLResult) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const url = coverUrl(result.cover_i, result.isbn);
  return (
    <button onClick={() => onSelect(result)}
      style={{
        display: 'flex', gap: 12, padding: '10px 12px', width: '100%',
        background: 'transparent', border: `1px solid ${C.border}`,
        borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.accent + '60'; (e.currentTarget as HTMLElement).style.background = C.bgHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
      <div style={{ width: 36, height: 52, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: C.bgSurface }}>
        {url && !imgErr
          ? <img src={url} alt="" onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: C.ink4 }}>📖</div>
        }
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.ink1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</p>
        <p style={{ fontSize: 11, color: C.ink3, marginTop: 3 }}>{result.author_name?.[0] || 'Autor desconocido'}</p>
        {result.number_of_pages_median && (
          <p style={{ fontSize: 10, color: C.ink4, marginTop: 2, fontFamily:C.fontMono }}>{result.number_of_pages_median} páginas</p>
        )}
      </div>
    </button>
  );
}

// ── Author autocomplete ──────────────────────────────────────
function AuthorInput({ value, onChange, existingAuthors }: { value: string; onChange: (v: string) => void; existingAuthors: string[] }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSug(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(v: string) {
    onChange(v);
    if (v.length >= 1) {
      const q = v.toLowerCase();
      const matches = existingAuthors.filter(a => a.toLowerCase().includes(q)).slice(0, 6);
      setSuggestions(matches);
      setShowSug(matches.length > 0);
    } else {
      setShowSug(false);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>AUTOR *</label>
      <input
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
        placeholder="Apellido, Nombre"
        style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, background: C.bgSurface, border: `1px solid ${C.border}`, color: C.ink1, outline: 'none', boxSizing: 'border-box' }}
        onFocusCapture={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
      {showSug && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: `0 8px 24px rgba(0,0,0,0.3)`, marginTop: 4, overflow: 'hidden' }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => { onChange(s); setShowSug(false); }}
              style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: C.ink2 }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bgHover)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cover picker — URL + file upload ────────────────────────
function CoverPicker({ value, onChange, uploadCover }: { value: string; onChange: (v: string) => void; uploadCover: (f: File) => Promise<string> }) {
  const [mode, setMode] = useState<'url'|'file'>('url');
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { onChange(await uploadCover(file)); }
    catch { alert('Error al subir la imagen'); }
    finally { setUploading(false); }
  }

  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>PORTADA</label>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, background: C.bgSurface, borderRadius: 8, padding: 3, border: `1px solid ${C.border}`, width: 'fit-content' }}>
        {(['url', 'file'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, background: mode === m ? C.accent : 'transparent', color: mode === m ? C.onAccent : C.ink3, transition: 'all 0.15s' }}>
            {m === 'url' ? '🔗 URL' : '📁 Archivo'}
          </button>
        ))}
      </div>
      {mode === 'url' ? (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="https://..." style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12, background: C.bgSurface, border: `1px solid ${C.border}`, color: C.ink1, outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border} />
      ) : (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1px dashed ${C.border}`, cursor: 'pointer', background: C.bgSurface }}>
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          {uploading
            ? <span style={{ fontSize: 13, color: C.ink3 }}>Subiendo...</span>
            : <><span style={{ fontSize: 20 }}>📷</span><span style={{ fontSize: 13, color: C.ink2 }}>{value ? 'Cambiar imagen' : 'Seleccionar imagen'}</span></>
          }
        </label>
      )}
      {value && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, padding: 10, background: C.bgSurface, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <img src={value} alt="" style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 4 }} onError={e => (e.currentTarget.style.display = 'none')} />
          <p style={{ fontSize: 12, color: C.ink3 }}>Vista previa de portada</p>
          <button onClick={() => onChange('')} style={{ marginLeft: 'auto', fontSize: 11, color: C.danger, background: 'none', border: 'none', cursor: 'pointer' }}>✕ Quitar</button>
        </div>
      )}
    </div>
  );
}

// ── Default empty form ───────────────────────────────────────
const EMPTY = {
  title: '', author: '', cover: '', tags: [] as string[], language: 'es',
  status: 'planned' as BookStatus, start: '', end: '', pages: 0, pagesRead: 0,
  rating: 0, difficulty: 3, recommended: false, isbn: '',
  format: 'physical' as BookFormat, summary: '', quotes: '', characters: '',
  notes: '', themes: [] as string[], sessions: [] as any[],
};

// ── Main wizard ──────────────────────────────────────────────
export function AddBookWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addBook          = useStore(s => s.addBook);
  const uploadCover      = useStore(s => s.uploadCover);
  const books            = useStore(s => s.books);
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState({ ...EMPTY });
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<OLResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [dirty, setDirty]     = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Unique authors from existing books
  const existingAuthors = [...new Set(books.map(b => b.author).filter(Boolean))].sort();

  const set = (k: string, v: any) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); };

  useEffect(() => {
    if (open) {
      setStep(0); setForm({ ...EMPTY }); setQuery(''); setResults([]); setSearchDone(false); setDirty(false);
    }
  }, [open]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchOpenLibrary(query)); }
      catch { setResults([]); }
      finally { setLoading(false); setSearchDone(true); }
    }, 400);
  }, [query]);

  function selectResult(r: OLResult) {
    const authorRaw = r.author_name?.[0] || '';
    const parts = authorRaw.split(' ');
    const authorFormatted = parts.length > 1 ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}` : authorRaw;
    setForm(f => ({
      ...f,
      title:  r.title,
      author: authorFormatted,
      pages:  r.number_of_pages_median || 0,
      isbn:   r.isbn?.[0] || '',
      cover:  coverUrl(r.cover_i, r.isbn),
      tags:   r.subject?.slice(0, 5).map(s => s.toLowerCase().replace(/[^a-záéíóúñü\s]/gi, '').trim()).filter(Boolean) || [],
    }));
    setResults([]); setQuery(''); setDirty(true); setStep(1);
  }

  function handleClose() {
    if (dirty && step > 0 && (form.title || form.author)) {
      if (!confirm('¿Cerrar sin guardar? Se perderán los datos ingresados.')) return;
    }
    onClose();
  }

  function handleSubmit() {
    if (!form.title || !form.author || !form.pages) return;
    addBook({ ...form, themes: form.tags, duration: 0, minutesListened: 0 });
    onClose();
  }

  function canNext() {
    if (step === 1) return !!(form.title && form.author && form.pages > 0);
    return true;
  }

  const STEPS = ['Buscar', 'Información', 'Estado', 'Detalles'];

  return (
    <Modal open={open} onClose={handleClose} title="Agregar libro" width={580}>
      <StepDots current={step} total={STEPS.length} />

      {/* ── Step 0: Search ── */}
      {step === 0 && (
        <div>
          <p style={{ fontSize: 14, color: C.ink2, marginBottom: 20 }}>
            Buscá el libro para autocompletar los datos, o cargalo manualmente.
          </p>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.ink3, fontSize: 14 }}>🔍</span>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Título, autor o ISBN..."
              style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10, fontSize: 14, background: C.bgSurface, border: `1px solid ${C.border}`, color: C.ink1, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border} />
            {loading && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.ink3 }}>…</span>}
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
              {results.map(r => <SearchResult key={r.key} result={r} onSelect={selectResult} />)}
            </div>
          )}
          {searchDone && results.length === 0 && query.length > 1 && !loading && (
            <p style={{ fontSize: 13, color: C.ink3, textAlign: 'center', padding: '16px 0' }}>Sin resultados. Cargá los datos manualmente.</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setStep(1)}>Cargar manualmente →</Btn>
          </div>
        </div>
      )}

      {/* ── Step 1: Basic info ── */}
      {step === 1 && (
        <div style={{ display: 'grid', gap: 14 }}>
          <Input label="Título *" value={form.title} onChange={v => set('title', v)} placeholder="Nombre del libro" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <AuthorInput value={form.author} onChange={v => set('author', v)} existingAuthors={existingAuthors} />
            </div>
            {form.format === 'audio'
              ? <Input label="Duración (minutos) *" value={form.pages || ''} onChange={v => set('pages', Number(v))} type="number" min={1} placeholder="ej: 540" />
              : <Input label="Páginas totales *" value={form.pages || ''} onChange={v => set('pages', Number(v))} type="number" min={1} />
            }
            <Select label="Formato" value={form.format} onChange={v => set('format', v as BookFormat)} options={[
              { value: 'physical', label: '📖 Físico'     },
              { value: 'digital',  label: '📱 Digital'    },
              { value: 'audio',    label: '🎧 Audiolibro' },
            ]} />
            <div style={{ gridColumn: '1/-1' }}>
              <CoverPicker value={form.cover} onChange={v => set('cover', v)} uploadCover={uploadCover} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <span style={{ display:'block',fontSize:11,fontWeight:500,color:C.ink3,marginBottom:6,letterSpacing:'0.04em' }}>Tags</span>
              <TagInput value={form.tags} onChange={v => set('tags', v)} placeholder="novela, historia, filosofía..." />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Status ── */}
      {step === 2 && (
        <div style={{ display: 'grid', gap: 18 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', marginBottom: 12 }}>ESTADO DE LECTURA</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { value: 'planned',   label: '📋 Pendiente',  desc: form.format==='audio'?'Lo quiero escuchar':'Lo quiero leer' },
                { value: 'reading',   label: form.format==='audio'?'🎧 Escuchando':'📖 Leyendo', desc: form.format==='audio'?'Lo estoy escuchando':'Lo estoy leyendo' },
                { value: 'finished',  label: '✅ Terminado',  desc: form.format==='audio'?'Ya lo escuché':'Ya lo leí' },
                { value: 'abandoned', label: '🚫 Abandonado', desc: 'Lo dejé a mitad' },
              ].map(opt => (
                <button key={opt.value} onClick={() => set('status', opt.value)}
                  style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid`, borderColor: form.status === opt.value ? C.accent : C.border, background: form.status === opt.value ? `rgba(139,92,246,0.1)` : C.bgSurface, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.ink1 }}>{opt.label}</p>
                  <p style={{ fontSize: 11, color: C.ink3, marginTop: 4 }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Fecha de inicio" value={form.start} onChange={v => set('start', v)} type="date" />
            <Input label="Fecha de fin" value={form.end} onChange={v => {
              set('end', v);
              // Auto-fill pagesRead if finished
              if (form.status === 'finished' && form.pages > 0) set('pagesRead', form.pages);
            }} type="date" />
            {(form.status === 'reading' || form.status === 'abandoned') && (
              <div style={{ gridColumn: '1/-1' }}>
                <Input label={form.format === 'audio' ? 'Minutos escuchados' : 'Páginas leídas'}
                  value={form.pagesRead || ''} onChange={v => set('pagesRead', Math.min(Number(v), form.pages))} type="number" min={0} max={form.pages} />
                {form.pages > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <ProgressBar value={form.pages > 0 ? Math.round((form.pagesRead / form.pages) * 100) : 0} />
                    <p style={{ fontSize: 11, color: C.ink3, marginTop: 4, fontFamily:C.fontMono }}>
                      {form.pagesRead} / {form.pages} ({form.pages > 0 ? Math.round((form.pagesRead / form.pages) * 100) : 0}%)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Review + details ── */}
      {step === 3 && (
        <div style={{ display: 'grid', gap: 18 }}>
          {form.status === 'finished' ? (
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', marginBottom: 10 }}>CALIFICACIÓN</p>
              <Stars rating={form.rating} size={28} interactive onChange={v => set('rating', v)} />
              {form.rating > 0 && <p style={{ fontSize: 12, color: C.ink3, marginTop: 8 }}>{['','No me gustó','Regular','Bien','Muy bueno','Excelente'][form.rating]}</p>}
            </div>
          ) : (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: C.bgSurface, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, color: C.ink3 }}>
                Vas a poder calificarlo y marcarlo como recomendado cuando lo termines.
              </p>
            </div>
          )}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: C.ink3, letterSpacing: '0.04em', marginBottom: 8 }}>
              DIFICULTAD: {['','Muy fácil','Fácil','Medio','Difícil','Muy difícil'][form.difficulty]}
            </p>
            <input type="range" min={1} max={5} value={form.difficulty} onChange={e => set('difficulty', Number(e.target.value))} style={{ width: '100%', accentColor: C.accent }} />
          </div>
          <Textarea label="Notas rápidas (opcional)" value={form.notes} onChange={v => set('notes', v)} rows={3} placeholder="¿Qué te pareció? ¿Qué te llevás?" />
          {form.status === 'finished' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.recommended} onChange={e => set('recommended', e.target.checked)} style={{ accentColor: C.accent, width: 16, height: 16 }} />
              <span style={{ fontSize: 13, color: C.ink2 }}>Lo recomendaría</span>
            </label>
          )}
          {/* Summary */}
          <div style={{ padding: 14, background: C.bgSurface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, color: C.ink3, marginBottom: 10 }}>RESUMEN</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {form.cover && <img src={form.cover} alt="" style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.ink1 }}>{form.title}</p>
                <p style={{ fontSize: 12, color: C.ink2, marginTop: 2 }}>{form.author}</p>
                <p style={{ fontSize: 11, color: C.ink3, marginTop: 4, fontFamily:C.fontMono }}>
                  {form.pages} {form.format === 'audio' ? 'min' : 'páginas'} · {form.format === 'physical' ? 'Físico' : form.format === 'digital' ? 'Digital' : 'Audio'}
                </p>
                {form.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {form.tags.map(t => <span key={t} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, background: C.bgHover, border: `1px solid ${C.border}`, color: C.ink3 }}>{t}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer navigation ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="ghost" onClick={() => step === 0 ? handleClose() : setStep(s => s - 1)}>
          {step === 0 ? 'Cancelar' : '← Atrás'}
        </Btn>
        <div style={{ display: 'flex', gap: 8 }}>
          {step === STEPS.length - 1 ? (
            <Btn onClick={handleSubmit} disabled={!form.title || !form.author || !form.pages}>Agregar libro ✓</Btn>
          ) : (
            <Btn onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Siguiente →</Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}
