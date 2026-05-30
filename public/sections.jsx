// Page sections for the memoly landing page.

// ─── Nav ──────────────────────────────────────────────────────────────────
function Nav(){
  return (
    <nav style={{
      position:"sticky", top:0, zIndex:50,
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
      background:"rgba(239,234,224,.72)",
      borderBottom:"1px solid rgba(217,211,199,.5)"
    }}>
      <div className="wrap" style={{display:"flex", alignItems:"center", justifyContent:"space-between", height:64}}>
        <a href="#" style={{display:"flex", alignItems:"center", gap:10}}>
          <img src="/logo.png" style={{width:32, height:32, objectFit:"contain"}} alt="memoly Logo" />
          <span style={{
            fontFamily:"var(--serif)", fontSize:26, lineHeight:1, fontStyle:"italic",
            letterSpacing:"-.02em", marginTop:2
          }}>memoly</span>
          <span style={{fontSize:10, color:"var(--mute)", letterSpacing:".14em", marginTop:8}}>BETA</span>
        </a>
        <div className="lp-nav-links" style={{display:"flex", gap:32, alignItems:"center", fontSize:14}}>
          <a href="#how" style={{color:"var(--ink-2)"}}>So funktioniert's</a>
          <a href="#demo" style={{color:"var(--ink-2)"}}>Probieren</a>
          <a href="#gallery" style={{color:"var(--ink-2)"}}>Beispiele</a>
          <a href="#preise" style={{color:"var(--ink-2)"}}>Preise</a>
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <a href="#start" className="btn btn-primary" style={{height:44, padding:"0 18px", fontSize:13}}>
            Kostenlos starten
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────
function Hero({ variant = "editorial" }){
  return (
    <section style={{position:"relative", paddingTop:48, paddingBottom:120}}>
      <div className="wrap">
        {variant === "editorial" && <HeroEditorial />}
        {variant === "split"     && <HeroSplit />}
        {variant === "centered"  && <HeroCentered />}
      </div>
    </section>
  );
}

// Variant A — large editorial photo + mockup cards floating overlay
function HeroEditorial(){
  return (
    <div style={{position:"relative"}}>
      <div style={{display:"grid", gridTemplateColumns:"1fr", gap:32, position:"relative"}}>
        {/* Eyebrow row */}
        <div className="row reveal in" style={{alignItems:"center", justifyContent:"space-between"}}>
          <div className="eyebrow">Ausgabe N°01 · Frühling 2026</div>
          <div className="eyebrow" style={{display:"flex", gap:8, alignItems:"center"}}>
            <span style={{width:6, height:6, borderRadius:999, background:"#86b06b"}}/> Beta öffentlich
          </div>
        </div>

        {/* Big headline */}
        <h1 className="display reveal d1 in" style={{fontSize:"clamp(56px, 9vw, 132px)", margin:0, maxWidth:"14ch"}}>
          Reisen, die <em>bleiben.</em>
        </h1>

        {/* Subtext + CTAs row */}
        <div className="row reveal d2 in lp-hero-sub" style={{justifyContent:"space-between", alignItems:"flex-end", gap:40, flexWrap:"wrap"}}>
          <p className="body-l" style={{maxWidth:"42ch", margin:0}}>
            Sammle die kleinen Momente deines Urlaubs an einem Ort — und exportiere sie als
            Erinnerung, die du wirklich behältst.
          </p>
          <div style={{display:"flex", gap:12, alignItems:"center"}}>
            <a href="#start" className="btn btn-primary">Jetzt kostenlos starten <IconArrow /></a>
            <a href="#demo" className="btn-link">Demo ansehen</a>
          </div>
        </div>

        {/* The big editorial composition */}
        <div className="reveal d3 in lp-hero-comp" style={{position:"relative", marginTop:24, height:620}}>
          {/* Background photo */}
          <PhotoSlot
            label="EDITORIAL HERO — DEIN URLAUBSFOTO"
            h={620} radius={28}
            style={{
              background:"repeating-linear-gradient(135deg, #d8cfba 0 22px, #cdc2a8 22px 44px)"
            }}
          />
          {/* Overlay grain */}
          <div style={{position:"absolute", inset:0, borderRadius:28, pointerEvents:"none",
            background:"radial-gradient(ellipse at 30% 20%, rgba(255,250,240,.25), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(0,0,0,.15), transparent 60%)"}}/>

          {/* Floating main mockup */}
          <div style={{position:"absolute", right:48, top:60}}>
            <TripCard
              month="JULI 2026"
              title="Lissabon"
              place="3 Nächte · zu zweit"
              activities={[
                {time:"Tag 1 · 09:30", title:"Pastéis de Belém", place:"Belém"},
                {time:"Tag 1 · 14:00", title:"Tram 28 durch Alfama", place:"Lissabon"},
                {time:"Tag 2 · 11:00", title:"LX Factory Markt", place:"Alcântara"},
                {time:"Tag 2 · 19:30", title:"Fado-Abend bei Mesa", place:"Bairro Alto"},
              ]}
              width={340}
              showFooter={false}
            />
          </div>

          {/* Floating polaroid */}
          <div style={{
            position:"absolute", left:60, bottom:60,
            background:"#fdfbf6", padding:"12px 12px 36px", borderRadius:6,
            boxShadow:"0 20px 50px -10px rgba(40,30,15,.3)",
            transform:"rotate(-6deg)"
          }}>
            <PhotoSlot label="POLAROID" w={220} h={220} radius={2} />
            <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:16, marginTop:14, textAlign:"center", color:"var(--ink-2)"}}>
              Belém, 09:42
            </div>
          </div>

          {/* Ticket/stamp chip */}
          <div style={{
            position:"absolute", left:340, bottom:24,
            background:"var(--card)", border:"1px solid var(--line-soft)",
            padding:"10px 16px", borderRadius:999, fontSize:12,
            letterSpacing:".1em", textTransform:"uppercase", color:"var(--mute)",
            boxShadow:"0 8px 22px -8px rgba(40,30,15,.2)",
            transform:"rotate(-3deg)"
          }}>
            ✺ Eingecheckt · LX 4218
          </div>
        </div>

        {/* Subtle credits row */}
        <div className="row reveal d4 in" style={{justifyContent:"space-between", color:"var(--mute)", fontSize:12, letterSpacing:".06em"}}>
          <span>① Sammle Aktivitäten unterwegs</span>
          <span className="vhr" style={{height:14}}/>
          <span>② Füge Fotos & Notizen hinzu</span>
          <span className="vhr" style={{height:14}}/>
          <span>③ Exportiere als bleibende Erinnerung</span>
        </div>
      </div>
    </div>
  );
}

// Variant B — Side-by-side editorial
function HeroSplit(){
  return (
    <div className="lp-grid-split" style={{display:"grid", gridTemplateColumns:"1.05fr .95fr", gap:60, alignItems:"center", minHeight:620}}>
      <div className="col reveal in" style={{gap:32}}>
        <div className="eyebrow">Ausgabe N°01 · Frühling 2026</div>
        <h1 className="display" style={{fontSize:"clamp(48px, 6.4vw, 96px)", margin:0}}>
          Reisen, die <em>bleiben.</em>
        </h1>
        <p className="body-l" style={{maxWidth:"38ch", margin:0}}>
          Sammle die kleinen Momente deines Urlaubs an einem Ort — und exportiere sie als
          Erinnerung, die du wirklich behältst.
        </p>
        <div style={{display:"flex", gap:14, alignItems:"center"}}>
          <a href="#start" className="btn btn-primary">Jetzt kostenlos starten <IconArrow /></a>
          <a href="#demo" className="btn-link">Demo ansehen</a>
        </div>
        <div style={{display:"flex", gap:20, alignItems:"center", marginTop:8, color:"var(--mute)", fontSize:12}}>
          <span>Keine Kreditkarte nötig</span>
          <span style={{width:4, height:4, borderRadius:999, background:"var(--mute)"}}/>
          <span>Privat per Default</span>
        </div>
      </div>

      <div className="reveal d2 in" style={{position:"relative", height:620}}>
        <PhotoSlot label="EDITORIAL FOTO" h={520} radius={20}
          style={{position:"absolute", inset:0, top:40}} />
        <div style={{position:"absolute", right:-20, top:30}}>
          <TripCard
            month="JULI 2026" title="Lissabon" place="3 Nächte"
            activities={[
              {time:"Tag 1", title:"Pastéis de Belém", place:"Belém"},
              {time:"Tag 1", title:"Tram 28", place:"Alfama"},
              {time:"Tag 2", title:"Fado bei Mesa", place:"Bairro Alto"},
            ]}
            width={300} showFooter={false}
          />
        </div>
        <div style={{
          position:"absolute", left:-20, bottom:0,
          background:"#fdfbf6", padding:"10px 10px 28px", borderRadius:4,
          boxShadow:"0 18px 40px -10px rgba(40,30,15,.28)",
          transform:"rotate(-5deg)"
        }}>
          <PhotoSlot label="POLAROID" w={170} h={170} radius={2} />
          <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:13, marginTop:8, textAlign:"center", color:"var(--ink-2)"}}>
            Belém, 09:42
          </div>
        </div>
      </div>
    </div>
  );
}

// Variant C — Centered hero, photo collage below
function HeroCentered(){
  return (
    <div className="col" style={{gap:48, alignItems:"center", textAlign:"center"}}>
      <div className="eyebrow reveal in">Ausgabe N°01 · Frühling 2026</div>
      <h1 className="display reveal d1 in" style={{fontSize:"clamp(56px, 8.4vw, 124px)", margin:0, maxWidth:"14ch"}}>
        Reisen, die <em>bleiben.</em>
      </h1>
      <p className="body-l reveal d2 in" style={{maxWidth:"52ch", margin:0, textAlign:"center"}}>
        Sammle die kleinen Momente deines Urlaubs an einem Ort — und exportiere sie als
        Erinnerung, die du wirklich behältst.
      </p>
      <div className="reveal d3 in" style={{display:"flex", gap:14, alignItems:"center"}}>
        <a href="#start" className="btn btn-primary">Jetzt kostenlos starten <IconArrow /></a>
        <a href="#demo" className="btn-link">Demo ansehen</a>
      </div>

      <div className="reveal d4 in" style={{position:"relative", marginTop:32, width:"100%", height:520}}>
        <div style={{position:"absolute", left:"6%", top:60, transform:"rotate(-4deg)"}}>
          <PhotoSlot label="EDITORIAL PHOTO 1" w={260} h={340} radius={6}
            style={{boxShadow:"0 20px 50px -14px rgba(40,30,15,.3)"}}/>
        </div>
        <div style={{position:"absolute", right:"6%", top:20, transform:"rotate(3deg)"}}>
          <PhotoSlot label="EDITORIAL PHOTO 2" w={260} h={340} radius={6}
            style={{boxShadow:"0 20px 50px -14px rgba(40,30,15,.3)"}}/>
        </div>
        <div style={{position:"absolute", left:"50%", top:0, transform:"translateX(-50%)"}}>
          <TripCard
            month="JULI 2026" title="Lissabon" place="3 Nächte · zu zweit"
            activities={[
              {time:"Tag 1 · 09:30", title:"Pastéis de Belém", place:"Belém"},
              {time:"Tag 1 · 14:00", title:"Tram 28", place:"Alfama"},
              {time:"Tag 2 · 19:30", title:"Fado bei Mesa", place:"Bairro Alto"},
            ]}
            width={340} showFooter={false}
          />
        </div>
      </div>
    </div>
  );
}


// ─── How it works ─────────────────────────────────────────────────────────
function HowItWorks(){
  const steps = [
    { n:"01", title:"Trip anlegen", body:"Gib deiner Reise einen Namen, ein Ziel und einen Monat. Mehr braucht es zum Start nicht.", note:"~ 20 Sekunden" },
    { n:"02", title:"Aktivitäten sammeln", body:"Unterwegs notierst du, was ihr macht — kurze Titel, Zeit, ein Foto. Ohne Hashtags, ohne Stress.", note:"So oft du willst" },
    { n:"03", title:"Als Erinnerung exportieren", body:"Am Ende der Reise exportierst du alles als PDF — ein echtes Dokument, das du öffnest, druckst oder verschickst.", note:"Ein Tap" },
  ];
  return (
    <section id="how" style={{padding:"140px 0"}}>
      <div className="wrap">
        <div className="reveal" style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:64, gap:40, flexWrap:"wrap"}}>
          <div>
            <div className="eyebrow" style={{marginBottom:18}}>Methode</div>
            <h2 className="display" style={{fontSize:"clamp(40px, 5.4vw, 80px)", margin:0, maxWidth:"14ch"}}>
              In drei stillen <em>Schritten.</em>
            </h2>
          </div>
          <p className="body-l" style={{maxWidth:"38ch", margin:0}}>
            Kein Algorithmus, kein Druck, keine Likes. Nur du, dein Trip und die Dinge,
            die ihr nicht vergessen wollt.
          </p>
        </div>

        <div className="lp-grid-3" style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:0, borderTop:"1px solid var(--line)"}}>
          {steps.map((s, i) => (
            <div key={s.n} className={`reveal d${i+1}`} style={{
              padding:"36px 28px 80px",
              borderRight: i<2 ? "1px solid var(--line)" : "none",
              position:"relative", minHeight:380
            }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                <div style={{fontFamily:"var(--mono)", fontSize:12, color:"var(--mute)"}}>{s.n}</div>
                <div style={{fontFamily:"var(--mono)", fontSize:11, color:"var(--mute)"}}>{s.note}</div>
              </div>
              <h3 style={{fontFamily:"var(--serif)", fontSize:38, lineHeight:1.05, margin:"40px 0 18px", fontWeight:400, letterSpacing:"-.01em"}}>{s.title}</h3>
              <p className="body-m" style={{margin:0, maxWidth:"28ch"}}>{s.body}</p>
              {/* tiny illustrative card */}
              <div style={{position:"absolute", left:28, right:28, bottom:24}}>
                <StepIllustration n={i} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepIllustration({ n }){
  if(n===0) return (
    <div style={{padding:14, background:"var(--card)", border:"1px solid var(--line-soft)", borderRadius:14}}>
      <div className="mock-eyebrow" style={{textAlign:"left", fontSize:9}}>NEUER TRIP</div>
      <div style={{fontFamily:"var(--serif)", fontSize:22, marginTop:4}}>Sommer in Mailand</div>
      <div style={{fontSize:11, color:"var(--mute)", marginTop:4}}>August 2026 · 5 Nächte</div>
    </div>
  );
  if(n===1) return (
    <div style={{display:"flex", flexDirection:"column", gap:6}}>
      {[
        ["Tag 1 · 11:00", "Aperitivo in Brera"],
        ["Tag 2 · 09:30", "Markt am Navigli"],
        ["Tag 3 · 20:00", "Cena im Trippa"],
      ].map(([t,n]) => (
        <div key={n} style={{display:"flex", gap:10, alignItems:"center", padding:"8px 10px",
          background:"#f6f2e8", border:"1px solid #ece5d3", borderRadius:10}}>
          <div style={{width:28, height:28, borderRadius:6, background:"repeating-linear-gradient(135deg, #e2dac6 0 5px, #d6cdb6 5px 10px)"}}/>
          <div style={{minWidth:0, flex:1}}>
            <div style={{fontSize:11, fontWeight:500}}>{n}</div>
            <div style={{fontSize:9, color:"var(--mute)"}}>{t}</div>
          </div>
        </div>
      ))}
    </div>
  );
  if(n===2) return (
    <div style={{padding:14, background:"var(--card)", border:"1px solid var(--line-soft)", borderRadius:14, display:"flex", alignItems:"center", gap:12}}>
      <div style={{width:48, height:64, borderRadius:4, background:"repeating-linear-gradient(135deg, #e2dac6 0 5px, #d6cdb6 5px 10px)", boxShadow:"0 4px 10px -4px rgba(0,0,0,.2)"}}/>
      <div style={{flex:1}}>
        <div style={{fontFamily:"var(--serif)", fontSize:18, lineHeight:1}}>Mailand 2026</div>
        <div style={{fontSize:10, color:"var(--mute)", marginTop:4}}>memoly.pdf · 1,2 MB</div>
      </div>
      <button className="btn btn-primary" style={{height:30, padding:"0 12px", fontSize:11}}>Export</button>
    </div>
  );
}

// ─── Live Demo ────────────────────────────────────────────────────────────
function LiveDemo(){
  const [activities, setActivities] = React.useState([
    { time:"Tag 1 · 14:30", title:"Spaziergang im Park", place:"Tiergarten" },
  ]);
  const [draft, setDraft] = React.useState({ title:"", place:"" });
  const [exported, setExported] = React.useState(false);

  const presets = [
    {title:"Frühstück im Café", place:"Mitte"},
    {title:"Museum besuchen", place:"Museumsinsel"},
    {title:"Sonnenuntergang am Fluss", place:"Spree"},
    {title:"Späti um die Ecke", place:"Kreuzberg"},
  ];

  const add = (a) => {
    if(!a.title.trim()) return;
    setActivities(prev => [...prev, {time:`Tag ${prev.length+1} · ${10+prev.length}:00`, ...a}]);
    setDraft({title:"", place:""});
  };

  return (
    <section id="demo" style={{padding:"140px 0", background:"var(--bg-soft)"}}>
      <div className="wrap">
        <div className="reveal" style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48, gap:40, flexWrap:"wrap"}}>
          <div>
            <div className="eyebrow" style={{marginBottom:18}}>Live ausprobieren</div>
            <h2 className="display" style={{fontSize:"clamp(40px, 5.4vw, 80px)", margin:0, maxWidth:"16ch"}}>
              Tipp etwas ein. Sieh, wie es <em>bleibt.</em>
            </h2>
          </div>
          <p className="body-l" style={{maxWidth:"36ch", margin:0}}>
            Eine Mini-Version direkt hier. Was du eingibst, landet rechts in der Karte —
            und du kannst sie als Erinnerung exportieren.
          </p>
        </div>

        <div className="lp-grid-2" style={{display:"grid", gridTemplateColumns:"1.05fr .95fr", gap:48, alignItems:"flex-start"}}>
          {/* Editor */}
          <div className="reveal d1" style={{background:"var(--card)", border:"1px solid var(--line-soft)", borderRadius:24, padding:28}}>
            <div className="mock-eyebrow" style={{textAlign:"left", marginBottom:18}}>Aktivität hinzufügen</div>

            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              <DemoInput label="Was habt ihr gemacht?" value={draft.title}
                onChange={v => setDraft(d => ({...d, title:v}))}
                placeholder="z.B. Eis am Hafen"/>
              <DemoInput label="Wo?" value={draft.place}
                onChange={v => setDraft(d => ({...d, place:v}))}
                placeholder="z.B. Hamburg, Landungsbrücken"/>

              <button onClick={() => add(draft)}
                className="btn btn-primary" style={{width:"100%", marginTop:6}}>
                <IconPlus /> Zur Erinnerung hinzufügen
              </button>
            </div>

            <div style={{marginTop:26}}>
              <div className="small" style={{marginBottom:10, color:"var(--mute)"}}>Oder probiere eines davon:</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                {presets.map(p => (
                  <button key={p.title} onClick={() => add(p)}
                    style={{height:44, padding:"0 16px", borderRadius:999, border:"1px solid var(--line)",
                      fontSize:13, color:"var(--ink-2)", background:"transparent", transition:"all .2s"}}
                    onMouseEnter={e => {e.currentTarget.style.background="var(--ink)"; e.currentTarget.style.color="var(--bg)"; e.currentTarget.style.borderColor="var(--ink)"}}
                    onMouseLeave={e => {e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--ink-2)"; e.currentTarget.style.borderColor="var(--line)"}}
                  >+ {p.title}</button>
                ))}
              </div>
            </div>

            <div style={{marginTop:30, paddingTop:22, borderTop:"1px solid var(--line-soft)",
              display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div className="small">{activities.length} {activities.length===1?"Aktivität":"Aktivitäten"}</div>
              <button onClick={() => {setExported(true); setTimeout(()=>setExported(false), 2400)}}
                className="btn btn-ghost" style={{height:44, padding:"0 16px", fontSize:13}}>
                <IconDownload /> {exported ? "Exportiert ✓" : "Als Erinnerung exportieren"}
              </button>
            </div>
          </div>

          {/* Preview card */}
          <div className="reveal d2" style={{position:"relative"}}>
            <TripCard
              month="MAI 2026"
              title="Wochenende"
              place="Berlin"
              activities={activities}
              width="100%"
              style={{maxWidth:400}}
              showFooter={true}
            />
            {exported && (
              <div style={{
                position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
                background:"rgba(239,234,224,.85)", backdropFilter:"blur(4px)",
                borderRadius:24, animation:"fadeIn .3s ease"
              }}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontFamily:"var(--serif)", fontSize:36, fontStyle:"italic"}}>memoly.pdf</div>
                  <div className="small" style={{marginTop:8}}>wird heruntergeladen…</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoInput({ label, value, onChange, placeholder }){
  return (
    <label style={{display:"flex", flexDirection:"column", gap:6}}>
      <span style={{fontSize:11, letterSpacing:".14em", textTransform:"uppercase", color:"var(--mute)"}}>{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          height:46, padding:"0 16px", borderRadius:12,
          border:"1px solid var(--line)", background:"#fff", fontSize:15, fontFamily:"var(--sans)",
          color:"var(--ink)", outline:"none", transition:"border-color .2s"
        }}
        onFocus={e => e.currentTarget.style.borderColor="var(--ink)"}
        onBlur={e => e.currentTarget.style.borderColor="var(--line)"}
      />
    </label>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────
function Gallery(){
  const items = [
    {title:"Toskana, im Mai", date:"MAI 2025", caption:"5 Tage · 12 Aktivitäten · 38 Fotos", h:380, label:"WEINBERGE BEI SIENA"},
    {title:"Tokio, drei Sommer", date:"AUGUST 2024", caption:"10 Tage · 24 Aktivitäten · 92 Fotos", h:320, label:"NEONLICHT IN SHIBUYA"},
    {title:"Kleines Wochenende", date:"FEBRUAR 2025", caption:"2 Tage · 6 Aktivitäten · 19 Fotos", h:300, label:"SCHNEE IM HARZ"},
    {title:"Roadtrip Norwegen", date:"JULI 2025", caption:"14 Tage · 31 Aktivitäten · 210 Fotos", h:360, label:"FJORD BEI LOFOTEN"},
  ];
  return (
    <section id="gallery" style={{padding:"140px 0"}}>
      <div className="wrap">
        <div className="reveal" style={{textAlign:"center", marginBottom:64}}>
          <div className="eyebrow" style={{marginBottom:18}}>Beispiele</div>
          <h2 className="display" style={{fontSize:"clamp(40px, 5.4vw, 80px)", margin:0}}>
            Wie eine fertige <em>Erinnerung</em> aussieht.
          </h2>
        </div>

        <div className="lp-grid-4" style={{
          display:"grid",
          gridTemplateColumns:"repeat(4, 1fr)",
          gap:24,
          alignItems:"start"
        }}>
          {items.map((it, i) => (
            <div key={it.title} className={`reveal d${i+1}`} style={{
              transform: i%2 ? "translateY(40px)" : "none"
            }}>
              <MemoryCard {...it} width="100%" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────
function Pricing(){
  return (
    <section id="preise" style={{padding:"140px 0", borderTop:"1px solid var(--line-soft)"}}>
      <div className="wrap">
        <div className="reveal" style={{textAlign:"center", marginBottom:64}}>
          <div className="eyebrow" style={{marginBottom:18}}>Preise</div>
          <h2 className="display" style={{fontSize:"clamp(40px, 5.4vw, 80px)", margin:0, maxWidth:"16ch", marginInline:"auto"}}>
            Kostenlos. Einmalig <em>wenn's zählt.</em>
          </h2>
          <p className="body-l reveal d1" style={{maxWidth:"48ch", marginInline:"auto", marginTop:24}}>
            memoly ist kostenlos zum Ausprobieren. Du zahlst einmalig 3,99 € — nur dann, wenn du eine Erinnerung exportieren möchtest.
          </p>
        </div>

        <div className="lp-grid-2" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, maxWidth:920, margin:"0 auto"}}>
          {/* Kostenlos */}
          <div className="reveal d1" style={{
            background:"var(--card)", borderRadius:24, padding:"36px 32px 32px",
            border:"1px solid var(--line-soft)", display:"flex", flexDirection:"column", gap:22
          }}>
            <div style={{fontFamily:"var(--serif)", fontSize:28}}>Ausprobieren</div>
            <div style={{display:"flex", alignItems:"baseline", gap:10}}>
              <div style={{fontFamily:"var(--serif)", fontSize:72, lineHeight:1}}>€0</div>
              <div style={{fontSize:13, opacity:.6}}>für immer</div>
            </div>
            <div style={{fontSize:14, opacity:.75, lineHeight:1.5}}>Leg los, ohne nachzudenken — sammle alles, ohne etwas zu zahlen.</div>
            <div style={{height:1, background:"var(--line-soft)"}}/>
            <ul style={{listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:12, fontSize:14}}>
              {["Trips anlegen", "Momente & Fotos sammeln", "Link zum Teilen"].map(f => (
                <li key={f} style={{display:"flex", gap:10, alignItems:"flex-start", opacity:.92}}>
                  <span style={{marginTop:7, width:5, height:5, borderRadius:999, background:"var(--ink)", flexShrink:0}}/>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#start" className="btn" style={{marginTop:8, height:48, width:"100%", background:"var(--ink)", color:"var(--bg)", textAlign:"center"}}>
              Jetzt kostenlos starten
            </a>
          </div>

          {/* Export */}
          <div className="reveal d2" style={{
            background:"var(--ink)", color:"var(--bg)", borderRadius:24, padding:"36px 32px 32px",
            border:"1px solid var(--ink)", display:"flex", flexDirection:"column", gap:22
          }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
              <div style={{fontFamily:"var(--serif)", fontSize:28}}>Exportieren</div>
              <span style={{fontSize:10, letterSpacing:".14em", textTransform:"uppercase", padding:"4px 10px", border:"1px solid rgba(239,234,224,.3)", borderRadius:999}}>einmalig</span>
            </div>
            <div style={{display:"flex", alignItems:"baseline", gap:10}}>
              <div style={{fontFamily:"var(--serif)", fontSize:72, lineHeight:1}}>€3,99</div>
              <div style={{fontSize:13, opacity:.6}}>pro Erinnerung</div>
            </div>
            <div style={{fontSize:14, opacity:.75, lineHeight:1.5}}>Bezahle einmalig, wenn du deine Reise für immer festhalten willst.</div>
            <div style={{height:1, background:"rgba(239,234,224,.15)"}}/>
            <ul style={{listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:12, fontSize:14}}>
              {["Alles aus Kostenlos", "PDF-Export in Druckqualität", "Für immer gespeichert", "Kein Abo, keine Karte hinterlegen"].map(f => (
                <li key={f} style={{display:"flex", gap:10, alignItems:"flex-start", opacity:.92}}>
                  <span style={{marginTop:7, width:5, height:5, borderRadius:999, background:"var(--bg)", flexShrink:0}}/>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#start" className="btn" style={{marginTop:8, height:48, width:"100%", background:"var(--bg)", color:"var(--ink)", textAlign:"center"}}>
              Erinnerung starten
            </a>
          </div>
        </div>

        <div className="reveal" style={{textAlign:"center", marginTop:40}}>
          <div className="small">Kein Abo. Keine gespeicherte Karte. Nur einmal zahlen, wenn es dir wichtig ist.</div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────
function FAQ(){
  const items = [
    {q:"Brauche ich ein Konto, um zu starten?", a:"Nein. Du kannst sofort einen Trip anlegen — kein Konto, keine E-Mail. Nur wenn du exportieren willst, geht es weiter zur Zahlung."},
    {q:"Funktioniert memoly offline?", a:"Noch nicht. Du brauchst eine Internetverbindung. Offline-Unterstützung ist geplant, aber noch nicht verfügbar."},
    {q:"In welche Formate kann ich exportieren?", a:"Aktuell als PDF in Druckqualität. Weitere Formate sind in Planung."},
    {q:"Kann ich mit anderen zusammen sammeln?", a:"Noch nicht. In der aktuellen Version erstellt jede Person ihren eigenen Trip. Gemeinsames Sammeln kommt in einer späteren Version."},
    {q:"Was passiert mit meinen Fotos?", a:"Sie liegen auf Servern innerhalb der EU. Wir verwenden sie nicht für KI-Training, Werbung oder Empfehlungen. Du kannst alles jederzeit löschen."},
    {q:"Wie funktioniert die Zahlung?", a:"Du zahlst einmalig 3,99 € pro Erinnerung, genau dann wenn du exportieren möchtest. Kein Abo, keine gespeicherte Karte, keine monatliche Abbuchung."},
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section id="faq" style={{padding:"140px 0", background:"var(--bg-soft)"}}>
      <div className="wrap lp-grid-faq" style={{display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:80, alignItems:"flex-start"}}>
        <div className="reveal" style={{position:"sticky", top:96}}>
          <div className="eyebrow" style={{marginBottom:18}}>Häufige Fragen</div>
          <h2 className="display" style={{fontSize:"clamp(40px, 4.8vw, 72px)", margin:0}}>
            Vielleicht <em>hilft das.</em>
          </h2>
          <p className="body-m" style={{marginTop:24, maxWidth:"32ch"}}>
            Findest du nichts? Schreib uns an <a href="mailto:hi@memoly.app" style={{borderBottom:"1px solid var(--ink)"}}>hi@memoly.app</a>.
          </p>
        </div>
        <div style={{borderTop:"1px solid var(--line)"}}>
          {items.map((it, i) => (
            <div key={i} className={`reveal d${i+1}`} style={{borderBottom:"1px solid var(--line)"}}>
              <button onClick={() => setOpen(open===i ? -1 : i)}
                style={{width:"100%", display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"24px 0", textAlign:"left", gap:24}}>
                <span style={{fontFamily:"var(--serif)", fontSize:24, lineHeight:1.2, fontWeight:400}}>{it.q}</span>
                <span style={{
                  width:32, height:32, borderRadius:999, border:"1px solid var(--line)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  transform: open===i ? "rotate(45deg)" : "rotate(0)", transition:"transform .3s"
                }}><IconPlus /></span>
              </button>
              <div style={{
                maxHeight: open===i ? 200 : 0, overflow:"hidden", transition:"max-height .4s ease, opacity .3s",
                opacity: open===i ? 1 : 0
              }}>
                <p className="body-m" style={{margin:"0 0 24px", maxWidth:"56ch"}}>{it.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Newsletter / Waitlist ───────────────────────────────────────────────
function Newsletter(){
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      const { error } = await window.supabaseClient
        .from('waitlist')
        .insert([{ email }]);
      if (error) {
        if (error.code === '23505') {
          alert('Diese E-Mail-Adresse ist bereits auf der Warteliste!');
        } else {
          alert('Fehler beim Eintragen: ' + error.message);
        }
      } else {
        setSent(true);
      }
    } catch (err) {
      console.error(err);
      alert('Verbindungsfehler. Bitte versuche es später noch einmal.');
    }
  };

  return (
    <section id="start" style={{padding:"160px 0", borderTop:"1px solid var(--line-soft)"}}>
      <div className="wrap reveal" style={{textAlign:"center", maxWidth:780, margin:"0 auto"}}>
        <div className="eyebrow" style={{marginBottom:24}}>Frühen Zugang sichern</div>
        <h2 className="display" style={{fontSize:"clamp(48px, 7vw, 104px)", margin:0, lineHeight:.95}}>
          Werde Teil der<br/><em>ersten Reise.</em>
        </h2>
        <p className="body-l" style={{marginTop:28, maxWidth:"46ch", marginInline:"auto"}}>
          Wir laden alle zwei Wochen 200 neue Reisende ein.
          Trag dich ein und du bist beim nächsten Mal dabei.
        </p>

        <form onSubmit={handleSubmit}
          style={{marginTop:44, display:"flex", maxWidth:520, marginInline:"auto",
            background:"var(--card)", border:"1px solid var(--line)", borderRadius:999, padding:6,
            transition:"border-color .2s"}}>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="deine@email.de"
            style={{flex:1, height:48, padding:"0 22px", border:0, background:"transparent",
              outline:"none", fontFamily:"var(--sans)", fontSize:15, color:"var(--ink)"}}/>
          <button type="submit" className="btn btn-primary" style={{height:48, padding:"0 24px"}}>
            {sent ? "Auf der Liste ✓" : "Eintragen"}
          </button>
        </form>
        <div className="small" style={{marginTop:18}}>
          Keine Werbung. Kein Spam. Eine Mail, wenn dein Platz frei ist.
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────
function Footer(){
  return (
    <footer style={{padding:"80px 0 60px", borderTop:"1px solid var(--line)"}}>
      <div className="wrap">
        <div className="lp-grid-footer" style={{display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr 1fr", gap:40, marginBottom:64}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
              <img src="/logo.png" style={{width:40, height:40, objectFit:"contain"}} alt="memoly Logo" />
              <div style={{fontFamily:"var(--serif)", fontSize:36, fontStyle:"italic", letterSpacing:"-.02em", marginTop:2}}>memoly</div>
            </div>
            <p className="body-m" style={{marginTop:16, maxWidth:"32ch"}}>
              Eine kleine App für die Momente einer Reise — entwickelt in Berlin, gemacht für jeden, der weniger Apps und mehr Erinnerung möchte.
            </p>
          </div>
          <FooterCol title="Produkt" items={[
            {label:"So funktioniert's", href:"#how"},
            {label:"Live-Demo", href:"#demo"},
            {label:"Preise", href:"#preise"},
            {label:"Beispiele", href:"#gallery"},
          ]} />
          <FooterCol title="Kontakt" items={[
            {label:"hi@memoly.app", href:"mailto:hi@memoly.app"},
          ]} />
          <FooterCol title="Rechtliches" items={[
            {label:"Impressum", href:"/impressum.html"},
            {label:"Datenschutz", href:"/datenschutz.html"},
          ]} />
        </div>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center",
          borderTop:"1px solid var(--line)", paddingTop:32, color:"var(--mute)", fontSize:12,
          flexWrap:"wrap", gap:16}}>
          <div>© 2026 memoly · Made in Berlin</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({title, items}){
  return (
    <div>
      <div className="eyebrow" style={{marginBottom:18}}>{title}</div>
      <ul style={{listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10}}>
        {items.map(({label, href}) => (
          <li key={label}><a href={href} style={{fontSize:14, color:"var(--ink-2)"}}>{label}</a></li>
        ))}
      </ul>
    </div>
  );
}

Object.assign(window, { Nav, Hero, HowItWorks, LiveDemo, Gallery, Pricing, FAQ, Newsletter, Footer });
