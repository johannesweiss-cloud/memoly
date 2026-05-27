// Mockup components — reused floating cards that match the in-app aesthetic.

const IconGear = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
  </svg>
);
const IconShare = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><rect x="4" y="15" width="16" height="6" rx="2"/>
  </svg>
);
const IconDownload = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>
  </svg>
);
const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}>
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconArrow = (p) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

// Generic placeholder photo with monospace caption — striped warm beige
function PhotoSlot({ label = "PHOTO", w = "100%", h = 220, radius = 14, style = {} }){
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "repeating-linear-gradient(135deg, #e7e0d0 0 14px, #ddd5c3 14px 28px)",
      position:"relative", overflow:"hidden", ...style
    }}>
      <div style={{
        position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"var(--mono)", fontSize:10, letterSpacing:".14em", color:"rgba(26,24,21,.45)",
      }}>{label}</div>
    </div>
  );
}

// The trip card — like the screenshot
function TripCard({
  month = "SEPTEMBER 2026",
  title = "Sommerurlaub",
  place = "New York",
  activities = [],
  scale = 1,
  showFooter = true,
  width = 360,
  style = {},
}){
  return (
    <div className="mock" style={{ width, transform: `scale(${scale})`, transformOrigin:"top center", ...style }}>
      {/* Top header */}
      <div style={{ position:"relative", padding:"28px 24px 22px" }}>
        <div style={{
          position:"absolute", top:18, right:18,
          width:32, height:32, borderRadius:999, background:"#f4efe5",
          display:"flex", alignItems:"center", justifyContent:"center", color:"#6a665d"
        }}>
          <IconGear />
        </div>
        <div className="mock-eyebrow">{month}</div>
        <div className="mock-title">{title}</div>
        <div className="mock-sub">{place}</div>
      </div>

      <div style={{height:1, background:"var(--line-soft)", margin:"0 24px"}}/>

      {/* Activities */}
      <div style={{ padding:"22px 24px 12px" }}>
        <div className="mock-eyebrow" style={{textAlign:"left", marginBottom:16}}>Unsere Aktivitäten</div>

        {activities.length === 0 ? (
          <div style={{
            color:"var(--mute)", textAlign:"center", padding:"22px 8px",
            fontSize:14
          }}>Noch keine Aktivitäten — füge deine erste hinzu</div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:14}}>
            {activities.map((a, i) => (
              <ActivityRow key={i} {...a} />
            ))}
          </div>
        )}

        <button className="pill-dashed" style={{marginTop:6}}>
          <IconPlus /> Neue Aktivität hinzufügen
        </button>
      </div>

      {showFooter && (
        <>
          <div style={{ padding:"16px 24px 22px" }}>
            <div className="mock-eyebrow" style={{textAlign:"left", marginBottom:14}}>Weitere Bilder</div>
            <div style={{
              width:120, height:120, borderRadius:14, border:"1.5px dashed var(--line)",
              display:"flex", alignItems:"center", justifyContent:"center", color:"var(--mute)"
            }}>
              <IconPlus />
            </div>
          </div>
          <div style={{height:1, background:"var(--line-soft)", margin:"0 24px"}}/>
          <div style={{padding:"18px 24px 22px", display:"flex", flexDirection:"column", gap:10}}>
            <button className="pill-dashed" style={{borderStyle:"solid", color:"var(--ink)"}}>
              <IconShare /> Link kopieren
            </button>
            <button className="btn btn-primary" style={{width:"100%"}}>
              Als Erinnerung exportieren <IconDownload />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ActivityRow({ time = "", title = "Aktivität", place = "", thumb = null }){
  return (
    <div style={{
      display:"flex", gap:12, alignItems:"center",
      padding:"10px 12px", borderRadius:14,
      background:"#f6f2e8", border:"1px solid #ece5d3"
    }}>
      <div style={{
        width:44, height:44, borderRadius:10, flexShrink:0,
        background: thumb || "repeating-linear-gradient(135deg, #e2dac6 0 6px, #d6cdb6 6px 12px)"
      }}/>
      <div style={{minWidth:0, flex:1}}>
        <div style={{fontSize:13, fontWeight:500, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{title}</div>
        <div style={{fontSize:11, color:"var(--mute)", marginTop:2}}>
          {time}{time && place ? " · " : ""}{place}
        </div>
      </div>
    </div>
  );
}

// Smaller "memory card" — print/postcard look used in gallery + secondary stacks
function MemoryCard({ title="Wochenende in Lissabon", date="MÄRZ 2026", caption="3 Tage · 7 Aktivitäten", h=320, label="EDITORIAL PHOTO", width=260, style={} }){
  return (
    <div className="mock" style={{width, ...style}}>
      <PhotoSlot label={label} h={h-110} radius={0} />
      <div style={{padding:"16px 18px 18px"}}>
        <div className="mock-eyebrow" style={{textAlign:"left"}}>{date}</div>
        <div style={{fontFamily:"var(--serif)", fontSize:22, lineHeight:1.05, marginTop:6}}>{title}</div>
        <div style={{fontSize:12, color:"var(--mute)", marginTop:6}}>{caption}</div>
      </div>
    </div>
  );
}

Object.assign(window, { TripCard, MemoryCard, ActivityRow, PhotoSlot,
  IconGear, IconShare, IconDownload, IconPlus, IconArrow });
