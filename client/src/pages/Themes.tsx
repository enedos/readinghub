import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { C } from '../components/ui';
import { CATEGORY_COLORS, STATUS_COLORS } from '../lib/colors';

function BookCover({ book }: { book: any }) {
  const COLORS  = ['#1a1035','#0f1f1a','#1a0f0f','#0f1a2e','#1a150a','#150f1a','#0f1a1a'];
  const ACCENTS = CATEGORY_COLORS;
  const idx = Math.abs([...book.title].reduce((a:number,c:string)=>a+c.charCodeAt(0),0)) % COLORS.length;
  return (
    <svg viewBox="0 0 200 300" style={{ width:'100%',height:'100%',display:'block' }}>
      <rect width="200" height="300" fill={COLORS[idx]}/>
      <text x="100" y="160" fill={ACCENTS[idx]} fontFamily="Georgia,serif"
        fontSize="48" textAnchor="middle" opacity="0.4">{book.title[0]}</text>
    </svg>
  );
}

export default function ThemesPage() {
  const books    = useStore(s => s.books);
  const navigate = useNavigate();

  const themes = useMemo(() => {
    const map: Record<string, typeof books> = {};
    books.forEach(b => b.tags.forEach(t => {
      if (!map[t]) map[t] = [];
      map[t].push(b);
    }));
    return Object.entries(map).sort((a,b)=>b[1].length-a[1].length);
  }, [books]);

  const STATUS_COLOR = STATUS_COLORS;

  return (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:'32px 28px' }}>

      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:10,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:C.info,marginBottom:8,display:'flex',alignItems:'center',gap:7 }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>
          EXPLORAR
        </p>
        <h1 style={{ fontFamily:C.fontSans,fontSize:32,fontWeight:700,color:C.ink1,position:'relative',display:'inline-block', marginBottom:16 }}>
          Temas
          <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                         background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
        </h1>
        <p style={{ color:C.ink3,fontSize:14,marginTop:4 }}>
          {themes.length} temas · {books.length} libros
        </p>
      </div>

      {/* Tag cloud */}
      <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginBottom:40 }}>
        {themes.map(([tag,tbooks])=>(
          <a key={tag} href={`#${tag}`}
            style={{
              padding:'6px 14px',borderRadius:999,border:`1px solid ${C.border}`,
              background:C.bgCard,color:C.ink2,textDecoration:'none',
              fontSize: Math.max(11, Math.min(16, 11 + tbooks.length * 1.5)),
              transition:'all 0.2s',display:'inline-flex',alignItems:'center',gap:6,
            }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.accent; (e.currentTarget as HTMLElement).style.color=C.accent; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.border; (e.currentTarget as HTMLElement).style.color=C.ink2; }}>
            {tag}
            <span style={{ fontSize:10,color:C.ink3,fontFamily:C.fontMono }}>{tbooks.length}</span>
          </a>
        ))}
      </div>

      {/* Themes sections */}
      <div style={{ display:'flex',flexDirection:'column',gap:40 }}>
        {themes.map(([tag,tbooks])=>(
          <section key={tag} id={tag}>
            <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:16 }}>
              <h2 style={{ fontFamily:C.fontSans,fontSize:20,fontWeight:600,color:C.ink1 }}>
                {tag}
              </h2>
              <div style={{ flex:1,height:1,background:C.border }}/>
              <span style={{ fontSize:11,fontFamily:C.fontMono,color:C.ink3 }}>{tbooks.length}</span>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10 }}>
              {tbooks.map(book=>{
                const author = book.author.includes(',')
                  ? book.author.split(',').reverse().join(' ').trim() : book.author;
                return (
                  <div key={book.id} onClick={()=>navigate(`/books/${book.id}`)}
                    style={{ display:'flex',alignItems:'center',gap:12,padding:12,borderRadius:12,
                              background:C.bgCard,border:`1px solid ${C.border}`,cursor:'pointer',
                              transition:'border-color 0.2s,background 0.2s' }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=`color-mix(in srgb, ${C.accent} 31%, transparent)`; (e.currentTarget as HTMLElement).style.background=C.bgHover; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor=C.border; (e.currentTarget as HTMLElement).style.background=C.bgCard; }}>
                    <div style={{ width:40,height:60,borderRadius:6,overflow:'hidden',flexShrink:0,background:C.bgSurface }}>
                      <BookCover book={book}/>
                    </div>
                    <div style={{ minWidth:0,flex:1 }}>
                      <p style={{ fontSize:12,fontWeight:500,color:C.ink1,lineHeight:1.4,
                                   overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>
                        {book.title}
                      </p>
                      <p style={{ fontSize:11,color:C.ink3,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                        {author}
                      </p>
                      <div style={{ display:'flex',alignItems:'center',gap:5,marginTop:5 }}>
                        <span style={{ width:6,height:6,borderRadius:'50%',background:STATUS_COLOR[book.status]||C.ink3,flexShrink:0 }}/>
                        {book.rating>0 && (
                          <div style={{ display:'flex',gap:1 }}>
                            {[1,2,3,4,5].map(i=>(
                              <svg key={i} width="8" height="8" viewBox="0 0 20 20" fill={i<=book.rating?'#FFB84D':C.border}>
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
