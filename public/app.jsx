// memoly landing — app shell, tweaks wiring, scroll-reveal observer.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroVariant": "editorial",
  "serifFamily": "instrument",
  "accent": "mono",
  "warmth": "warm"
}/*EDITMODE-END*/;

const SERIF_MAP = {
  instrument: "'Instrument Serif', 'Times New Roman', serif",
  fraunces:   "'Fraunces', 'Times New Roman', serif",
};
const ACCENT_MAP = {
  mono:    "#1a1815",
  navy:    "#1e2a4a",
  forest:  "#2e3d2a",
  rust:    "#a14b2a",
};
const BG_MAP = {
  warm:    { bg:"#efeae0", bgSoft:"#f5f1e8", card:"#fdfbf6", line:"#d9d3c7", lineSoft:"#e6e0d3" },
  cool:    { bg:"#eceef0", bgSoft:"#f3f4f5", card:"#fdfdfe", line:"#cfd4d8", lineSoft:"#e2e6ea" },
  bone:    { bg:"#f1eee8", bgSoft:"#f7f4ee", card:"#fefdf9", line:"#dad4c8", lineSoft:"#e7e2d5" },
};

function useScrollReveal(){
  React.useEffect(() => {
    const items = document.querySelectorAll(".reveal");
    if(!("IntersectionObserver" in window)){
      items.forEach(el => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "-5% 0px -8% 0px", threshold:0.04 });
    items.forEach(el => {
      // Already-visible elements (above-the-fold) animate in immediately
      const r = el.getBoundingClientRect();
      if(r.top < window.innerHeight * 0.95){
        setTimeout(() => el.classList.add("in"), 50);
      } else {
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, []);
}

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useScrollReveal();

  // Apply tweaks to CSS variables on the root
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--serif", SERIF_MAP[t.serifFamily] || SERIF_MAP.instrument);
    root.style.setProperty("--accent", ACCENT_MAP[t.accent] || ACCENT_MAP.mono);
    const bg = BG_MAP[t.warmth] || BG_MAP.warm;
    root.style.setProperty("--bg", bg.bg);
    root.style.setProperty("--bg-soft", bg.bgSoft);
    root.style.setProperty("--card", bg.card);
    root.style.setProperty("--line", bg.line);
    root.style.setProperty("--line-soft", bg.lineSoft);
  }, [t.serifFamily, t.accent, t.warmth]);

  // Re-trigger reveal observer when hero variant changes
  React.useEffect(() => {
    document.querySelectorAll(".reveal").forEach(el => el.classList.remove("in"));
    requestAnimationFrame(() => {
      document.querySelectorAll(".reveal").forEach(el => {
        const r = el.getBoundingClientRect();
        if(r.top < window.innerHeight * 0.95) el.classList.add("in");
      });
    });
  }, [t.heroVariant]);

  return (
    <>
      <Nav />
      <Hero variant={t.heroVariant} />
      <HowItWorks />
      <LiveDemo />
      <Gallery />
      <Pricing />
      <FAQ />
      <Newsletter />
      <Footer />

      <TweaksPanel>
        <TweakSection label="Hero" />
        <TweakRadio label="Layout" value={t.heroVariant}
          options={[
            {value:"editorial", label:"Editorial"},
            {value:"split", label:"Split"},
            {value:"centered", label:"Mitte"},
          ]}
          onChange={(v) => setTweak("heroVariant", v)} />

        <TweakSection label="Typografie" />
        <TweakRadio label="Display-Serif" value={t.serifFamily}
          options={[
            {value:"instrument", label:"Instrument"},
            {value:"fraunces", label:"Fraunces"},
          ]}
          onChange={(v) => setTweak("serifFamily", v)} />

        <TweakSection label="Palette" />
        <TweakRadio label="Hintergrund" value={t.warmth}
          options={[
            {value:"warm", label:"Warm"},
            {value:"bone", label:"Knochen"},
            {value:"cool", label:"Kühl"},
          ]}
          onChange={(v) => setTweak("warmth", v)} />
        <TweakColor label="Akzent" value={ACCENT_MAP[t.accent]}
          options={Object.values(ACCENT_MAP)}
          onChange={(v) => {
            const key = Object.entries(ACCENT_MAP).find(([k,c]) => c===v)?.[0] || "mono";
            setTweak("accent", key);
          }} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
