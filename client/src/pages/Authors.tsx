import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { C, Input, Empty } from '../components/ui';

function DefaultAuthorIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display:'block' }}>
      <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.12)"/>
      <circle cx="12" cy="9.5" r="3.6" fill="rgba(255,255,255,0.75)"/>
      <path d="M4.5 20c1.1-3.6 4.2-5.6 7.5-5.6s6.4 2 7.5 5.6" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export default function AuthorsPage() {
  const books         = useStore(s => s.books);
  const authorAvatars = useStore(s => s.authorAvatars);
  const navigate       = useNavigate();
  const [search, setSearch] = useState('');

  const authors = useMemo(() => {
    const map = new Map<string, { count: number; finished: number }>();
    books.forEach(b => {
      if (!b.author) return;
      const cur = map.get(b.author) || { count: 0, finished: 0 };
      cur.count += 1;
      if (b.status === 'finished') cur.finished += 1;
      map.set(b.author, cur);
    });
    return [...map.entries()]
      .map(([name, stats]) => {
        const display = name.includes(',') ? name.split(',').reverse().join(' ').trim() : name;
        return { name, display, ...stats };
      })
      .sort((a, b) => a.display.localeCompare(b.display));
  }, [books]);

  const filtered = search
    ? authors.filter(a => a.display.toLowerCase().includes(search.toLowerCase()))
    : authors;

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 80px' }}>
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8 }}>
          BIBLIOTECA
        </p>
        <h1 style={{ fontFamily:C.fontSerif, fontSize:30, color:C.ink1, marginBottom:6 }}>Autores</h1>
        <p style={{ fontSize:13, color:C.ink3 }}>
          {authors.length} autor{authors.length!==1?'es':''} en tu biblioteca
        </p>
      </div>

      {authors.length > 0 && (
        <div style={{ maxWidth:340, marginBottom:24 }}>
          <Input label="" value={search} onChange={setSearch} placeholder="Buscar autor…" />
        </div>
      )}

      {authors.length === 0 ? (
        <Empty icon="✍️" message="No hay autores todavía" sub="Agregá libros a tu biblioteca para verlos acá" />
      ) : filtered.length === 0 ? (
        <Empty icon="🔍" message="Sin resultados" sub="Probá con otro nombre" />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {filtered.map(a => {
            const avatarUrl = authorAvatars[a.name];
            return (
              <div key={a.name} onClick={()=>navigate(`/author/${encodeURIComponent(a.name)}`)}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:14,
                          background:C.bgCard, border:`1px solid ${C.border}`, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.accent; (e.currentTarget as HTMLElement).style.background=C.bgHover; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.border; (e.currentTarget as HTMLElement).style.background=C.bgCard; }}>
                <div style={{ width:48, height:48, borderRadius:'50%', flexShrink:0, overflow:'hidden',
                              background:`linear-gradient(135deg,${C.accent},#4C3A99)`,
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={a.display} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <DefaultAuthorIcon size={26}/>}
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:500, color:C.ink1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {a.display}
                  </p>
                  <p style={{ fontSize:11, color:C.ink3, marginTop:2, fontFamily:C.fontMono }}>
                    {a.count} libro{a.count!==1?'s':''}{a.finished>0 ? ` · ${a.finished} terminado${a.finished!==1?'s':''}` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
