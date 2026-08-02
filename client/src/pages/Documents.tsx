import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../store';
import { C, Card, Modal, Input, Btn } from '../components/ui';
import type { ReadingHubDocument } from '../types';

function DocEditor({ doc, onSave, onClose }: {
  doc: Partial<ReadingHubDocument>;
  onSave: (d: Partial<ReadingHubDocument>) => void;
  onClose: () => void;
}) {
  const [title,   setTitle]   = useState(doc.title || '');
  const [content, setContent] = useState(doc.content || '');
  const [tags,    setTags]    = useState((doc.tags || []).join(', '));
  const [mode, setMode] = useState<'editor'|'preview'|'split'>('editor');

  const dirty = title !== (doc.title || '') || content !== (doc.content || '') || tags !== (doc.tags || []).join(', ');

  function handleClose() {
    if (dirty && !confirm('¿Cerrar sin guardar? Se perderán los cambios.')) return;
    onClose();
  }

  function save() {
    if (!title.trim()) return;
    onSave({
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      pinned: doc.pinned || false,
    });
  }

  return (
    <Modal open title={doc.id ? 'Editar documento' : 'Nuevo documento'} onClose={handleClose} width={860} closeOnBackdrop={false}>
      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <Input label="Título" value={title} onChange={setTitle} placeholder="Nombre del documento" />
        <Input label="Tags (coma)" value={tags} onChange={setTags} placeholder="tesis, borrador, notas" />
      </div>

      {/* Editor / Preview toggle */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 10, background: C.bgSurface,
                     borderRadius: 8, padding: 3, border: `1px solid ${C.border}`, width: 'fit-content' }}>
        {(['editor', 'preview', 'split'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{
              padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              background: mode === m ? C.accent : 'transparent',
              color: mode === m ? C.onAccent : C.ink3,
              transition: 'all 0.15s',
            }}>
            {m === 'editor' ? 'Editar' : m === 'preview' ? 'Vista' : 'Dividida'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mode === 'split' ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16 }}>
        {/* Editor */}
        {mode !== 'preview' && (
        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`# Mi documento\n\nEscribí aquí en **Markdown**...\n\n## Sección\n\nTexto normal, *cursiva*, **negrita**.\n\n- Ítem 1\n- Ítem 2`}
            style={{
              width: '100%', height: 420, padding: '12px 14px',
              borderRadius: 10, fontSize: 13, lineHeight: 1.7,
              background: C.bgSurface, border: `1px solid ${C.border}`,
              color: C.ink1, outline: 'none', resize: 'vertical',
              fontFamily: C.fontMono,
            }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          <p style={{ fontSize: 11, color: C.ink4, marginTop: 6 }}>
            Soporta Markdown: **negrita**, *cursiva*, # títulos, - listas, `código`, &gt; citas
          </p>
        </div>
        )}

        {/* Preview */}
        {mode !== 'editor' && (
          <div style={{
            height: 420, padding: '12px 14px', overflowY: 'auto',
            borderRadius: 10, background: C.bgSurface, border: `1px solid ${C.border}`,
            fontSize: 14, lineHeight: 1.75, color: C.ink1,
          }}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ fontFamily: C.fontSerif, fontSize: 24, color: C.ink1, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: 18, color: C.ink1, marginTop: 20, marginBottom: 8 }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: 15, color: C.ink2, marginTop: 14, marginBottom: 6 }}>{children}</h3>,
                p: ({ children }) => <p style={{ color: C.ink2, marginBottom: 10 }}>{children}</p>,
                strong: ({ children }) => <strong style={{ color: C.ink1, fontWeight: 600 }}>{children}</strong>,
                em: ({ children }) => <em style={{ color: C.ink2 }}>{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote style={{ borderLeft: `2px solid ${C.accent}`, paddingLeft: 14, margin: '12px 0', color: C.ink3, fontStyle: 'italic' }}>
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code style={{ background: C.bgCard, padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily:C.fontMono, color: C.accent }}>
                    {children}
                  </code>
                ),
                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 10, color: C.ink2 }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 10, color: C.ink2 }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />,
              }}>
              {content || '*Vista previa aquí...*'}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="ghost" onClick={handleClose}>Cancelar</Btn>
        <Btn onClick={save} disabled={!title.trim()}>
          {doc.id ? 'Guardar cambios' : 'Crear documento'}
        </Btn>
      </div>
    </Modal>
  );
}

function DocCard({ doc, onEdit, onDelete, onPin }: {
  doc: ReadingHubDocument;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const [showFull, setShowFull] = useState(false);
  const wordCount = doc.content.split(/\s+/).filter(Boolean).length;
  const preview   = doc.content.slice(0, 200) + (doc.content.length > 200 ? '…' : '');
  const fmtDate   = (s: string) => {
    const d = new Date(s);
    return `${d.getDate()} ${['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <Card style={{ position: 'relative', transition: 'all 0.2s' }}>
      {/* Pin indicator */}
      {doc.pinned && (
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 14 }} title="Fijado">📌</div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                       background: `rgba(139,92,246,0.12)`, border: `1px solid rgba(139,92,246,0.2)`,
                       display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          📄
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink1, marginBottom: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.title}
          </h3>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: C.ink4 }}>
            <span>{wordCount} palabras</span>
            <span>·</span>
            <span>{fmtDate(doc.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {doc.tags.map(t => (
            <span key={t} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10,
                                    background: C.bgHover, border: `1px solid ${C.border}`, color: C.ink3 }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Preview */}
      <div style={{ fontSize: 13, color: C.ink3, lineHeight: 1.6, marginBottom: 12,
                     fontFamily: 'inherit', cursor: 'pointer' }}
        onClick={() => setShowFull(true)}>
        {preview || <em style={{ color: C.ink4 }}>Sin contenido todavía...</em>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={onPin}
          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.ink3, cursor: 'pointer', fontSize: 12 }}>
          {doc.pinned ? '📌 Fijado' : '📌 Fijar'}
        </button>
        <button onClick={onEdit}
          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.ink2, cursor: 'pointer', fontSize: 12 }}>
          ✏️ Editar
        </button>
        <button onClick={onDelete}
          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid rgba(239,68,68,0.25)`,
                    background: 'transparent', color: C.danger, cursor: 'pointer', fontSize: 12 }}>
          Eliminar
        </button>
      </div>

      {/* Full view modal */}
      {showFull && (
        <Modal open title={doc.title} onClose={() => setShowFull(false)} width={720}>
          <div style={{ maxHeight: 560, overflowY: 'auto', fontSize: 14, lineHeight: 1.8, color: C.ink1 }}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ fontFamily: C.fontSerif, fontSize: 26, color: C.ink1, marginBottom: 14 }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: 20, color: C.ink1, marginTop: 20, marginBottom: 10 }}>{children}</h2>,
                p: ({ children }) => <p style={{ color: C.ink2, marginBottom: 12 }}>{children}</p>,
                blockquote: ({ children }) => <blockquote style={{ borderLeft: `2px solid ${C.accent}`, paddingLeft: 16, margin: '14px 0', color: C.ink3, fontStyle: 'italic' }}>{children}</blockquote>,
                code: ({ children }) => <code style={{ background: C.bgCard, padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily:C.fontMono, color: C.accent }}>{children}</code>,
                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12, color: C.ink2 }}>{children}</ul>,
                li: ({ children }) => <li style={{ marginBottom: 5 }}>{children}</li>,
              }}>
              {doc.content}
            </ReactMarkdown>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <Btn variant="ghost" onClick={() => setShowFull(false)}>Cerrar</Btn>
            <Btn onClick={() => { setShowFull(false); onEdit(); }}>✏️ Editar</Btn>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export default function DocumentsPage() {
  const documents      = useStore(s => s.documents);
  const addDocument    = useStore(s => s.addDocument);
  const updateDocument = useStore(s => s.updateDocument);
  const deleteDocument = useStore(s => s.deleteDocument);

  const [showNew,  setShowNew]  = useState(false);
  const [editing,  setEditing]  = useState<ReadingHubDocument | null>(null);
  const [search,   setSearch]   = useState('');
  const [filterTag, setFilterTag] = useState('all');

  const allTags = [...new Set(documents.flatMap(d => d.tags))].sort();

  const filtered = documents
    .filter(d => {
      if (filterTag !== 'all' && !d.tags.includes(filterTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.title.toLowerCase().includes(q) && !d.content.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  function handleSaveNew(data: Partial<ReadingHubDocument>) {
    addDocument({ title: data.title!, content: data.content || '', tags: data.tags || [], pinned: false });
    setShowNew(false);
  }

  function handleSaveEdit(data: Partial<ReadingHubDocument>) {
    if (!editing) return;
    updateDocument(editing.id, data);
    setEditing(null);
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 28px' }}>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}><span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>ESCRITURA</p>
          <h1 style={{ fontFamily: C.fontSans, fontSize: 30, fontWeight:700, color: C.ink1, position:'relative', display:'inline-block', marginBottom:16 }}>
            Documentos
            <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                           background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
          </h1>
          <p style={{ color: C.ink3, fontSize: 13, marginTop: 4 }}>
            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'} · Tesis, borradores, notas
          </p>
        </div>
        <Btn onClick={() => setShowNew(true)}>+ Nuevo documento</Btn>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.ink3 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en documentos..."
            autoComplete="off"
            autoCorrect="off" spellCheck="false"
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, fontSize: 13,
                     background: C.bgCard, border: `1px solid ${C.border}`, color: C.ink1, outline: 'none' }} />
        </div>
        {allTags.length > 0 && (
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, background: C.bgCard,
                     border: `1px solid ${C.border}`, color: C.ink2, outline: 'none', cursor: 'pointer' }}>
            <option value="all">Todos los tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Docs grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: C.ink3 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <p style={{ fontSize: 16, color: C.ink2 }}>
            {documents.length === 0 ? 'Todavía no hay documentos' : 'Sin resultados'}
          </p>
          <p style={{ fontSize: 13, color: C.ink4, marginTop: 8 }}>
            {documents.length === 0 ? 'Creá tu primera tesis, borrador o nota' : 'Probá con otros filtros'}
          </p>
          {documents.length === 0 && (
            <button onClick={() => setShowNew(true)}
              style={{ marginTop: 20, padding: '10px 24px', borderRadius: 10, background: C.accent,
                        border: 'none', color: C.onAccent, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
              Crear primer documento
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {filtered.map(doc => (
            <DocCard key={doc.id} doc={doc}
              onEdit={() => setEditing(doc)}
              onDelete={() => { if (confirm(`¿Eliminar "${doc.title}"?`)) deleteDocument(doc.id); }}
              onPin={() => updateDocument(doc.id, { pinned: !doc.pinned })} />
          ))}
        </div>
      )}

      {showNew && <DocEditor doc={{}} onSave={handleSaveNew} onClose={() => setShowNew(false)} />}
      {editing  && <DocEditor doc={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />}
    </div>
  );
}
