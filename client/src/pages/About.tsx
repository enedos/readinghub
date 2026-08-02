import { C, Card } from '../components/ui';

const FEATURES = [
  { icon:'📚', title:'Biblioteca', desc:'Portadas a sangre completa, grid / lista / estante. "Leyendo ahora" fijo arriba. Filtrá por estado, formato y tag.' },
  { icon:'📊', title:'Dashboard', desc:'El núcleo reacciona a tu racha. "Seguí leyendo" con registro de sesión en un click. Panel "Tu año", desafíos y actividad reciente.' },
  { icon:'📈', title:'Estadísticas', desc:'Barras, líneas, área, radar y scatter. Análisis anual, comparativo, histórico y perfil lector completo con directorio de autores.' },
  { icon:'📅', title:'Sesiones', desc:'Registrá páginas por día en cada libro. Heatmap estilo GitHub, historial global, promedio por sesión y mejor sesión histórica.' },
  { icon:'🏆', title:'Logros', desc:'42 logros automáticos, 5 rarezas — cada una es un orbe con su propio nivel de energía, no un ícono plano. Caminos, mapa, línea de tiempo con fecha real inferida.' },
  { icon:'🗺️', title:'Mi Recorrido', desc:'Línea de tiempo y vista revista. Año a año con heatmap mensual, libros por año, insignias obtenidas y libro destacado.' },
  { icon:'💬', title:'Citas', desc:'Se guardan y se destacan en la ficha del libro — la última que guardaste aparece primero, no hay que ir a buscarla. Vista lista y tarjetas.' },
  { icon:'👤', title:'Autor', desc:'Página dedicada por autor: todos sus libros, rating promedio, géneros frecuentes, evolución por año y sus mejores citas.' },
  { icon:'🔍', title:'Búsqueda global', desc:'Ctrl+K abre el Command Palette. Busca en libros, citas, notas y documentos con navegación por teclado.' },
  { icon:'📁', title:'Colecciones', desc:'Agrupá libros en colecciones personalizadas: sagas, temáticas, pendientes priorizados.' },
  { icon:'📝', title:'Documentos', desc:'Editor Markdown con vista previa real (editor / vista / dividida). Documentos fijados.' },
  { icon:'⚙️', title:'Ajustes', desc:'Niveles, desafíos, logros, categorías, tema oscuro/claro, color de acento, avatar, exportación/importación.' },
];

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 28px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:C.info, marginBottom:8, display:'flex', alignItems:'center', gap:7 }}><span style={{ width:6,height:6,borderRadius:'50%',background:C.info,boxShadow:'0 0 8px 1px rgba(34,211,238,0.6)',display:'inline-block' }}/>SOBRE LA APP</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#8B5CF6,#4C3A99)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="7" y="5" width="3" height="22" rx="1" fill="rgba(255,255,255,0.35)"/>
              <rect x="10" y="5" width="14" height="22" rx="2" fill="rgba(255,255,255,0.92)"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: C.fontSans, fontSize: 32, fontWeight:700, color: C.ink1, marginBottom: 16, position:'relative', display:'inline-block' }}>
              ReadingHub
              <span style={{ position:'absolute',left:0,bottom:-7,width:36,height:3,borderRadius:2,
                             background:'linear-gradient(90deg,var(--rx-accent),transparent)' }}/>
            </h1>
            <p style={{ fontSize: 12, color: C.ink4 }}>Tu hub personal de lectura</p>
          </div>
        </div>
        <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.7, maxWidth: 680 }}>
          ReadingHub es una aplicación local para llevar el registro de tu vida lectora. Sin suscripciones, sin nube, sin anuncios. Tus datos viven en tu computadora.
        </p>
      </div>

      {/* Features */}
      <Card style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3, marginBottom: 16 }}>FUNCIONALIDADES</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.ink1, marginBottom: 3 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: C.ink3, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tech */}
      <Card>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3, marginBottom: 14 }}>TECNOLOGÍA</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['React + TypeScript','Vite','Express.js','LowDB','Recharts','React Router','React Markdown'].map(t => (
            <span key={t} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, background: C.bgSurface, border: `1px solid ${C.border}`, color: C.ink2 }}>{t}</span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: C.ink4, marginTop: 14, lineHeight: 1.6 }}>
          Aplicación local. Datos en <code style={{ fontSize: 11, color: C.accent, background: 'rgba(139,92,246,0.1)', padding: '1px 5px', borderRadius: 4 }}>server/data/readinghub.json</code> · Portadas en <code style={{ fontSize: 11, color: C.accent, background: 'rgba(139,92,246,0.1)', padding: '1px 5px', borderRadius: 4 }}>server/covers/</code>
        </p>
      </Card>
    </div>
  );
}
