import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { C, Card, Modal, Input, Btn, ProgressBar } from '../components/ui';
import { CATEGORY_COLORS } from '../lib/colors';

// ── Cover mini ────────────────────────────────────────────────
function ShelfCover({ book, size=44, onClick }: { book: any; size?: number; onClick?: ()=>void }) {
  const [err, setErr] = useState(false);
  const COLORS  = ['#1a1035','#0f1f1a','#1a0f0f','#0f1a2e','#1a150a','#150f1a','#0f1a1a'];
  const ACCENTS = CATEGORY_COLORS;
  const title   = book.title || book.bookTitle || '?';
  const cover   = book.cover || book.bookCover;
  const idx = Math.abs([...title].reduce((a:number,c:string)=>a+c.charCodeAt(0),0)) % COLORS.length;

  return (
    <div onClick={onClick} title={title}
      style={{ cursor:onClick?'pointer':'default', flexShrink:0,
                transition:'transform 0.15s', display:'inline-block' }}
      onMouseEnter={e=>onClick&&(e.currentTarget.style.transform='translateY(-4px) scale(1.05)')}
      onMouseLeave={e=>onClick&&(e.currentTarget.style.transform='none')}>
      {cover && !err
        ? <img src={cover} alt={title} onError={()=>setErr(true)}
            style={{ width:size, height:size*1.5, objectFit:'cover', borderRadius:5, display:'block',
                     boxShadow:'2px 4px 12px rgba(0,0,0,0.4)' }}/>
        : (
          <svg width={size} height={size*1.5} viewBox="0 0 40 60"
            style={{ borderRadius:5, boxShadow:'2px 4px 12px rgba(0,0,0,0.3)', display:'block' }}>
            <rect width="40" height="60" fill={COLORS[idx]}/>
            <rect x="5" y="5" width="3" height="50" rx="1" fill={ACCENTS[idx]} opacity="0.4"/>
            <text x="21" y="37" fill={ACCENTS[idx]} fontFamily="Georgia" fontSize="18"
              textAnchor="middle" opacity="0.7">{title[0]}</text>
          </svg>
        )
      }
    </div>
  );
}

// ── Collection card ───────────────────────────────────────────
function CollectionCard({ col, onEdit }: { col: any; onEdit: ()=>void }) {
  const navigate  = useNavigate();
  const books     = useStore(s => s.books);
  const [expanded, setExpanded] = useState(false);

  const ownedItems   = (col.books||[]).filter((b:any) => b.status === 'owned');
  const pendingItems = (col.books||[]).filter((b:any) => b.status === 'pending');
  const readCount    = ownedItems.filter((b:any) => {
    const lib = books.find(lb => lb.id === b.bookId);
    return lib?.status === 'finished';
  }).length;
  const totalOwned = ownedItems.length;
  const totalAll   = col.books?.length || 0;
  const pct = totalOwned > 0 ? Math.round((readCount/totalOwned)*100) : 0;

  return (
    <Card style={{ transition:'all 0.2s' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:C.ink1, marginBottom:4 }}>{col.title}</h3>
          {col.description && (
            <p style={{ fontSize:12, color:C.ink3, lineHeight:1.5, marginBottom:6 }}>{col.description}</p>
          )}
          <div style={{ display:'flex', gap:12, fontSize:11, color:C.ink4 }}>
            <span>{totalOwned} {totalOwned===1?'libro':'libros'}</span>
            {pendingItems.length > 0 && <span>+ {pendingItems.length} pendientes</span>}
            <span style={{ color:pct===100?C.success:C.ink4 }}>{readCount}/{totalOwned} leídos</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <button onClick={() => setExpanded(e=>!e)}
            style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${C.border}`,
                      background:'transparent', color:C.ink3, cursor:'pointer', fontSize:12 }}>
            {expanded ? 'Contraer' : 'Ver más'}
          </button>
          <button onClick={onEdit}
            style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${C.border}`,
                      background:'transparent', color:C.ink2, cursor:'pointer', fontSize:12 }}>
            ✏️
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:14 }}>
        <ProgressBar value={pct} color={pct===100?C.success:C.accent} height={5}/>
        <p style={{ fontSize:10, color:C.ink4, marginTop:4, fontFamily:C.fontMono }}>
          {pct}% completado
          {pct===100 && ' · ✓ Colección terminada'}
        </p>
      </div>

      {/* Shelf — owned */}
      {totalOwned > 0 && (
        <div style={{ marginBottom:pendingItems.length>0?14:0 }}>
          <p style={{ fontSize:10, fontWeight:600, color:C.ink3, letterSpacing:'0.08em',
                       textTransform:'uppercase', marginBottom:8 }}>En biblioteca</p>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
            {ownedItems.map((item:any) => {
              const lib = books.find(lb => lb.id === item.bookId);
              return (
                <div key={item.id} style={{ position:'relative', flexShrink:0 }}>
                  <ShelfCover
                    book={lib || { title:item.bookTitle, cover:item.bookCover }}
                    size={40}
                    onClick={lib ? () => navigate(`/books/${lib.id}`) : undefined}/>
                  {lib?.status === 'finished' && (
                    <div style={{ position:'absolute', bottom:2, right:2, width:12, height:12,
                                   borderRadius:'50%', background:C.success,
                                   display:'flex', alignItems:'center', justifyContent:'center',
                                   fontSize:7, color:C.onAccent, border:'1px solid rgba(0,0,0,0.3)' }}>✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shelf — pending */}
      {pendingItems.length > 0 && (
        <div style={{ paddingTop:12, borderTop:`1px solid ${C.border}` }}>
          <p style={{ fontSize:10, fontWeight:600, color:C.ink4, letterSpacing:'0.08em',
                       textTransform:'uppercase', marginBottom:8 }}>
            Pendientes de leer
          </p>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
            {pendingItems.map((item:any) => (
              <div key={item.id} style={{ position:'relative', flexShrink:0, opacity:0.55 }}>
                <ShelfCover book={{ title:item.bookTitle, cover:item.bookCover }} size={40}/>
                <div style={{ position:'absolute', bottom:2, right:2, width:12, height:12,
                               borderRadius:'50%', background:C.ink4,
                               display:'flex', alignItems:'center', justifyContent:'center',
                               fontSize:7, color:C.onAccent, border:'1px solid rgba(0,0,0,0.3)' }}>
                  ⋯
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded book list */}
      {expanded && (
        <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
          {(col.books||[]).map((item:any) => {
            const lib = books.find(lb => lb.id === item.bookId);
            const isPending = item.status === 'pending';
            return (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10,
                                           padding:'7px 0', borderBottom:`1px solid ${C.border}`,
                                           opacity:isPending?0.6:1 }}>
                <span style={{ fontSize:14, flexShrink:0 }}>
                  {lib?.status==='finished'?'✓':isPending?'○':'◎'}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, color:C.ink1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.bookTitle}
                  </p>
                  {item.bookAuthor && (
                    <p style={{ fontSize:11, color:C.ink4 }}>{item.bookAuthor}</p>
                  )}
                </div>
                <span style={{ fontSize:10, color:isPending?C.ink4:lib?.status==='finished'?C.success:C.ink3,
                                flexShrink:0 }}>
                  {isPending?'Pendiente':lib?.status==='finished'?'Leído':lib?.status==='reading'?'Leyendo':'Pendiente'}
                </span>
                {lib && (
                  <button onClick={() => navigate(`/books/${lib.id}`)}
                    style={{ padding:'2px 8px', borderRadius:5, border:`1px solid ${C.border}`,
                              background:'transparent', color:C.ink3, cursor:'pointer', fontSize:10 }}>
                    Ver →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Collection modal ──────────────────────────────────────────
function CollectionModal({ col, onSave, onDelete, onClose }: {
  col: any; onSave:(d:any)=>void; onDelete?:()=>void; onClose:()=>void;
}) {
  const books = useStore(s => s.books);
  const [title, setTitle]   = useState(col.title||'');
  const [desc,  setDesc]    = useState(col.description||'');
  const [items, setItems]   = useState<any[]>(col.books||[]);

  // Add book from library
  const [bookSearch, setBookSearch] = useState('');
  const [pendingTitle, setPendingTitle] = useState('');
  const [pendingAuthor, setPendingAuthor] = useState('');

  const filteredBooks = useMemo(() => {
    if (!bookSearch.trim()) return [];
    const q = bookSearch.toLowerCase();
    return books.filter(b =>
      !items.find(i => i.bookId === b.id) &&
      (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    ).slice(0,5);
  }, [bookSearch, books, items]);

  function addFromLibrary(book: any) {
    const author = book.author.includes(',') ? book.author.split(',').reverse().join(' ').trim() : book.author;
    setItems(prev => [...prev, {
      id: Date.now().toString(36),
      bookId: book.id, bookTitle: book.title, bookAuthor: author,
      bookCover: book.cover, status: 'owned',
    }]);
    setBookSearch('');
  }

  function addPending() {
    if (!pendingTitle.trim()) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(36),
      bookId: null, bookTitle: pendingTitle, bookAuthor: pendingAuthor,
      status: 'pending',
    }]);
    setPendingTitle(''); setPendingAuthor('');
  }

  function removeItem(id: string) { setItems(prev => prev.filter(i => i.id !== id)); }

  function save() {
    if (!title.trim()) return;
    onSave({ title, description:desc, books:items });
  }

  return (
    <Modal open title={col.id?`Editar — ${col.title}`:'Nueva colección'} onClose={onClose} width={600}>
      <div style={{ display:'grid', gap:14, marginBottom:20 }}>
        <Input label="Nombre *" value={title} onChange={setTitle} placeholder="ej: Saga Fundación"/>
        <Input label="Descripción" value={desc} onChange={setDesc} placeholder="Una breve descripción..."/>
      </div>

      {/* Books in collection */}
      <div style={{ marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:600, color:C.ink3, letterSpacing:'0.06em',
                     textTransform:'uppercase', marginBottom:10 }}>
          Libros ({items.length})
        </p>
        {items.length === 0 ? (
          <p style={{ fontSize:13, color:C.ink4, fontStyle:'italic', padding:'12px 0' }}>
            Agregá libros desde tu biblioteca o creá entradas pendientes.
          </p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:200, overflowY:'auto', marginBottom:12 }}>
            {items.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10,
                                           padding:'7px 10px', borderRadius:8,
                                           background:C.bgSurface, border:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{item.status==='pending'?'○':'◎'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, color:C.ink1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.bookTitle}
                  </p>
                  {item.bookAuthor && <p style={{ fontSize:10, color:C.ink4 }}>{item.bookAuthor}</p>}
                </div>
                <span style={{ fontSize:10, color:C.ink4, flexShrink:0 }}>
                  {item.status==='pending'?'Pendiente':'Biblioteca'}
                </span>
                <button onClick={() => removeItem(item.id)}
                  style={{ border:'none', background:'none', cursor:'pointer', color:C.danger, fontSize:14 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Add from library */}
        <div style={{ padding:12, borderRadius:10, background:C.bgSurface, border:`1px solid ${C.border}`, marginBottom:8 }}>
          <p style={{ fontSize:11, fontWeight:600, color:C.ink2, marginBottom:8 }}>Agregar desde biblioteca</p>
          <input value={bookSearch} onChange={e => setBookSearch(e.target.value)}
            placeholder="Buscar libro..."
            autoComplete="off"
            autoCorrect="off" spellCheck="false"
            style={{ width:'100%', padding:'7px 12px', borderRadius:7, fontSize:12,
                      background:C.bgCard, border:`1px solid ${C.border}`,
                      color:C.ink1, outline:'none' }}/>
          {filteredBooks.length > 0 && (
            <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:3 }}>
              {filteredBooks.map(b => (
                <button key={b.id} onClick={() => addFromLibrary(b)}
                  style={{ textAlign:'left', padding:'6px 10px', borderRadius:6, border:'none',
                            background:C.bgHover, cursor:'pointer', color:C.ink1, fontSize:12 }}>
                  {b.title} <span style={{ color:C.ink4 }}>· {b.author.split(',')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add pending */}
        <div style={{ padding:12, borderRadius:10, background:C.bgSurface, border:`1px dashed ${C.border}` }}>
          <p style={{ fontSize:11, fontWeight:600, color:C.ink2, marginBottom:8 }}>
            Agregar pendiente (no está en biblioteca)
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <input value={pendingTitle} onChange={e=>setPendingTitle(e.target.value)}
              placeholder="Título *"
              style={{ padding:'7px 10px', borderRadius:7, fontSize:12, background:C.bgCard,
                        border:`1px solid ${C.border}`, color:C.ink1, outline:'none' }}/>
            <input value={pendingAuthor} onChange={e=>setPendingAuthor(e.target.value)}
              placeholder="Autor"
              style={{ padding:'7px 10px', borderRadius:7, fontSize:12, background:C.bgCard,
                        border:`1px solid ${C.border}`, color:C.ink1, outline:'none' }}/>
          </div>
          <button onClick={addPending} disabled={!pendingTitle.trim()}
            style={{ padding:'6px 14px', borderRadius:7, border:`1px solid ${C.border}`,
                      background:'transparent', color:C.ink2, cursor:'pointer', fontSize:12,
                      opacity:pendingTitle.trim()?1:0.5 }}>
            + Agregar pendiente
          </button>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:16, borderTop:`1px solid ${C.border}` }}>
        {onDelete ? (
          <Btn variant="danger" onClick={() => { if(confirm('¿Eliminar colección?')) onDelete(); }}>Eliminar</Btn>
        ) : <div/>}
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={save} disabled={!title.trim()}>
            {col.id ? 'Guardar cambios' : 'Crear colección'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function CollectionsPage() {
  const collections      = useStore(s => s.collections);
  const addCollection    = useStore(s => s.addCollection);
  const updateCollection = useStore(s => s.updateCollection);
  const deleteCollection = useStore(s => s.deleteCollection);

  const [showNew, setShowNew]   = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [search,  setSearch]    = useState('');

  const filtered = collections.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSaveNew(data: any) {
    await addCollection(data);
    setShowNew(false);
  }

  async function handleSaveEdit(data: any) {
    if (!editing) return;
    await updateCollection(editing.id, data);
    setEditing(null);
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteCollection(editing.id);
    setEditing(null);
  }

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 28px 80px' }}>

      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>
            ORGANIZACIÓN
          </p>
          <h1 style={{ fontFamily:C.fontSans, fontSize:30, fontWeight:700, color:C.ink1, position:'relative', display:'inline-block', marginBottom:16 }}>
            Colecciones
            <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                           background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
          </h1>
          <p style={{ color:C.ink3, fontSize:13, marginTop:4 }}>
            {collections.length} {collections.length===1?'colección':'colecciones'} · Sagas, series y selecciones temáticas
          </p>
        </div>
        <Btn onClick={() => setShowNew(true)}>+ Nueva colección</Btn>
      </div>

      {/* Search */}
      {collections.length > 3 && (
        <div style={{ position:'relative', marginBottom:20 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:C.ink3 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar colecciones..."
            autoComplete="off"
            autoCorrect="off" spellCheck="false"
            style={{ width:'100%', padding:'9px 12px 9px 36px', borderRadius:10, fontSize:13,
                      background:C.bgCard, border:`1px solid ${C.border}`, color:C.ink1, outline:'none' }}/>
        </div>
      )}

      {/* Empty state */}
      {collections.length === 0 && (
        <div style={{ textAlign:'center', padding:'64px 24px', color:C.ink3 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
          <p style={{ fontSize:16, color:C.ink2, marginBottom:8 }}>Todavía no hay colecciones</p>
          <p style={{ fontSize:13, color:C.ink4, marginBottom:24 }}>
            Creá una para agrupar sagas, trilogías o selecciones de un autor.
          </p>
          <Btn onClick={() => setShowNew(true)}>Crear primera colección</Btn>
        </div>
      )}

      {/* Collections grid */}
      <div className="rx-collections-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))', gap:16 }}>
        {filtered.map(col => (
          <CollectionCard key={col.id} col={col} onEdit={() => setEditing(col)}/>
        ))}
      </div>

      {showNew && (
        <CollectionModal col={{}} onSave={handleSaveNew} onClose={() => setShowNew(false)}/>
      )}
      {editing && (
        <CollectionModal col={editing} onSave={handleSaveEdit}
          onDelete={handleDelete} onClose={() => setEditing(null)}/>
      )}
    </div>
  );
}
