// memoly Helfer — regelbasierter FAQ-Chatbot (kein Backend, keine API, 0 €).
//
// Funktionsweise (bewusst einfach):
//   1. Jede mögliche Antwort ist als "Intent" mit Stichwörtern hinterlegt (KB unten).
//   2. Eine Nutzerfrage wird normalisiert (klein, Umlaute → ae/oe/ue/ss, € → euro) und gegen
//      die Stichwörter gezählt. Der Intent mit den meisten Treffern gewinnt.
//   3. Findet sich nichts, kommt eine freundliche Fallback-Antwort + Mail-Hinweis.
//
// Wissensquelle: FAQ + Preise + Pre-Launch-Status der echten Landingpage. Wenn sich
// dort etwas ändert, hier ebenfalls anpassen (eine zentrale Stelle: KB).

// ─── Wissensbasis ──────────────────────────────────────────────────────────
// keys  : Stichwörter (bereits normalisiert: nur Kleinbuchstaben, keine Umlaute)
// label : Text für den anklickbaren Vorschlags-Chip (null = kein Chip)
// answer: die Antwort des Bots
const MEMOLY_KB = [
  {
    id: "capabilities",
    keys: ["was kannst du", "hilfe", "helfen", "wobei", "funktion", "kannst du", "wer bist du", "bot", "fragen"],
    label: "Was kannst du?",
    answer:
      "Ich bin Lumi 🙂 Ich beantworte Fragen rund um memoly — zum Beispiel:\n" +
      "• Was ist memoly?\n• Was kostet es?\n• Brauche ich ein Konto?\n• Wie funktioniert der Export?\n" +
      "Tipp die Frage einfach ein oder nutz die Vorschläge unten.",
  },
  {
    id: "what",
    keys: ["was ist memoly", "was ist das", "produkt", "worum geht", "was macht", "wozu", "idee", "memoly"],
    label: "Was ist memoly?",
    answer:
      "memoly verwandelt die Momente einer Reise oder eines Ausflugs in ein schönes, bleibendes Erinnerungs-PDF. " +
      "Du sammelst Fotos, gibst jedem Moment einen Titel und eine kurze Beschreibung — und exportierst am Ende " +
      "ein echtes Dokument, das du öffnen, drucken oder verschicken kannst. Statt Fotos, die in der Galerie verschwinden.",
  },
  {
    id: "how",
    keys: ["wie funktioniert", "wie geht", "anleitung", "schritte", "ablauf", "benutzen", "loslegen", "starten"],
    label: "Wie funktioniert's?",
    answer:
      "In drei Schritten:\n" +
      "① Trip anlegen — gib deiner Reise einen Namen.\n" +
      "② Momente sammeln — Foto, Titel und kurze Beschreibung pro Moment.\n" +
      "③ Exportieren — am Ende alles als PDF in Druckqualität.",
  },
  {
    id: "price",
    keys: ["preis", "kosten", "kostet", "teuer", "bezahlen", "zahlung", "zahlen", "geld", "abo", "gratis", "kostenlos", "umsonst", "euro", "3", "399", "3 99"],
    label: "Was kostet es?",
    answer:
      "memoly ist kostenlos zum Ausprobieren. Du zahlst nur einmalig 3,99 € pro Erinnerung — und zwar genau dann, " +
      "wenn du sie als PDF exportieren möchtest. Kein Abo, keine gespeicherte Karte, keine monatliche Abbuchung.",
  },
  {
    id: "account",
    keys: ["konto", "account", "anmelden", "registrieren", "registrierung", "login", "einloggen", "email noetig"],
    label: "Brauche ich ein Konto?",
    answer:
      "Nein. Du kannst sofort einen Trip anlegen — kein Konto, keine E-Mail nötig. Erst wenn du exportieren " +
      "möchtest, geht es weiter zur Zahlung.",
  },
  {
    id: "export",
    keys: ["export", "exportieren", "pdf", "format", "drucken", "speichern", "datei", "herunterladen", "download"],
    label: "Wie exportiere ich?",
    answer:
      "Am Ende deiner Reise exportierst du alles mit einem Tap als PDF in Druckqualität — ein echtes Dokument zum " +
      "Öffnen, Drucken oder Verschicken. Weitere Formate sind in Planung.",
  },
  {
    id: "offline",
    keys: ["offline", "internet", "verbindung", "ohne netz", "ohne internet"],
    label: null,
    answer:
      "Noch nicht — aktuell brauchst du eine Internetverbindung. Offline-Unterstützung ist geplant, aber noch nicht verfügbar.",
  },
  {
    id: "collab",
    keys: ["zusammen", "gemeinsam", "teilen", "kollaboration", "freunde", "andere", "geteilt", "mehrere"],
    label: null,
    answer:
      "Aktuell legt jede Person ihren eigenen Trip an. Gemeinsames Sammeln mit anderen kommt in einer späteren Version.",
  },
  {
    id: "privacy",
    keys: ["foto", "fotos", "daten", "datenschutz", "privat", "sicher", "sicherheit", "ki training", "werbung", "loeschen", "server"],
    label: "Was passiert mit meinen Fotos?",
    answer:
      "Deine Fotos liegen auf Servern innerhalb der EU. Wir verwenden sie nicht für KI-Training, Werbung oder " +
      "Empfehlungen. Du kannst alles jederzeit löschen.",
  },
  {
    id: "access",
    keys: ["wann", "launch", "verfuegbar", "zugang", "warteliste", "fruehzugang", "early access", "freischalten", "wann kann ich"],
    label: "Wann kann ich starten?",
    answer:
      "memoly ist gerade in der Pre-Launch-Phase. Trag dich auf die Warteliste ein (Button „Eintragen“ weiter unten auf " +
      "der Seite) — wir laden alle zwei Wochen neue Reisende ein und melden uns, sobald dein Platz frei ist.",
  },
  {
    id: "contact",
    keys: ["kontakt", "email", "mail", "erreichen", "support", "schreiben", "ansprechpartner"],
    label: null,
    answer:
      "Du erreichst uns jederzeit unter hi@memoly.app — schreib uns einfach, wenn deine Frage hier nicht dabei war.",
  },
  {
    id: "thanks",
    keys: ["danke", "dankeschoen", "merci", "thx", "super", "top", "cool"],
    label: null,
    answer: "Gern geschehen! 🙂 Wenn du noch etwas wissen willst, frag einfach.",
  },
];

const CHAT_FALLBACK =
  "Das weiß ich leider nicht sicher. Du kannst mir eine der Vorschlags-Fragen stellen — oder schreib uns direkt " +
  "an hi@memoly.app, wir helfen dir gern weiter.";

const CHAT_GREETING =
  "Hi! Ich bin Lumi, dein memoly-Helfer. Frag mich, was du über memoly wissen willst — oder tipp auf eine der Fragen unten. 👇";

// ─── Matching-Logik ──────────────────────────────────────────────────────────
function normalizeText(s) {
  return (s || "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/€/g, " euro ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findAnswer(rawInput) {
  const text = normalizeText(rawInput);
  if (!text) return CHAT_FALLBACK;
  let best = null;
  let bestScore = 0;
  for (const intent of MEMOLY_KB) {
    let score = 0;
    for (const key of intent.keys) {
      // Mehrwort-Stichwort: ganze Phrase muss vorkommen (zählt stärker).
      // Einwort-Stichwort: als eigenes Wort vorhanden.
      if (key.includes(" ")) {
        if (text.includes(key)) score += 2;
      } else if (text.split(" ").includes(key)) {
        score += 1;
      }
    }
    if (score > bestScore) { bestScore = score; best = intent; }
  }
  return best ? best.answer : CHAT_FALLBACK;
}

// ─── CSS Styles ──────────────────────────────────────────────────────────────
const CHATBOT_CSS = `
  .mly-cb-container {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 9000;
    font-family: var(--sans);
  }
  .mly-cb-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 52px;
    padding: 0 20px;
    width: auto;
    border-radius: 999px;
    background: var(--ink);
    color: var(--bg);
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 26px -8px rgba(40,30,15,.4);
    transition: all .2s ease;
    cursor: pointer;
    border: 0;
  }
  .mly-cb-trigger:hover {
    background: #000;
    transform: translateY(-1.5px);
    box-shadow: 0 12px 30px -8px rgba(0,0,0,.5);
  }
  .mly-cb-trigger:active {
    transform: translateY(0);
  }
  .mly-cb-trigger:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }
  .mly-cb-trigger.open {
    width: 52px;
    padding: 0;
  }
  .mly-cb-window {
    position: absolute;
    bottom: 64px;
    right: 0;
    width: min(380px, calc(100vw - 32px));
    height: min(560px, calc(100vh - 120px));
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: 0 30px 60px -20px rgba(40,30,15,.28), 0 12px 24px -12px rgba(40,30,15,.16);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: mly-cb-fade-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  @keyframes mly-cb-fade-in {
    from { opacity: 0; transform: translateY(12px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .mly-cb-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line-soft);
  }
  .mly-cb-header-title {
    font-family: var(--serif);
    font-size: 19px;
    line-height: 1;
  }
  .mly-cb-header-subtitle {
    font-size: 11px;
    color: var(--mute);
    margin-top: 3px;
  }
  .mly-cb-close-btn {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-2);
    cursor: pointer;
    background: transparent;
    transition: all 0.2s ease;
  }
  .mly-cb-close-btn:hover {
    background: var(--bg-soft);
    border-color: var(--ink-2);
    color: var(--ink);
  }
  .mly-cb-close-btn:focus-visible {
    outline: 2px solid var(--ink);
  }
  .mly-cb-tabs {
    display: flex;
    border-bottom: 1px solid var(--line-soft);
    background: var(--bg-soft);
  }
  .mly-cb-tab {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--mute);
    cursor: pointer;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    transition: all 0.15s ease;
    border-radius: 0;
  }
  .mly-cb-tab:hover {
    color: var(--ink);
    background: rgba(0, 0, 0, 0.02);
  }
  .mly-cb-tab.active {
    color: var(--ink);
    border-bottom-color: var(--ink);
    font-weight: 600;
    background: var(--card);
  }
  .mly-cb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 16px 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .mly-cb-msg {
    max-width: 85%;
    border-radius: 14px;
    padding: 10px 13px;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-line;
  }
  .mly-cb-msg.bot {
    align-self: flex-start;
    background: var(--bg-soft);
    color: var(--ink-2);
    border: 1px solid var(--line-soft);
  }
  .mly-cb-msg.user {
    align-self: flex-end;
    background: var(--ink);
    color: var(--bg);
    border: none;
  }
  .mly-cb-msg.error {
    align-self: center;
    background: #fdf2f2;
    color: #9b1c1c;
    border: 1px solid #f8b4b4;
    font-size: 12px;
    max-width: 90%;
    border-radius: 10px;
    white-space: normal;
  }
  .mly-cb-typing {
    align-self: flex-start;
    background: var(--bg-soft);
    border: 1px solid var(--line-soft);
    color: var(--mute);
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .mly-cb-dot {
    width: 6px;
    height: 6px;
    background: var(--mute);
    border-radius: 50%;
    animation: mly-bounce 1.4s infinite ease-in-out both;
  }
  .mly-cb-dot:nth-child(1) { animation-delay: -0.32s; }
  .mly-cb-dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes mly-bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.0); }
  }
  .mly-cb-suggestions {
    padding: 8px 12px 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .mly-cb-chip {
    border: 1px dashed var(--line);
    color: var(--ink-2);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12.5px;
    line-height: 1;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .mly-cb-chip:hover {
    border-color: var(--ink-2);
    color: var(--ink);
    background: rgba(0, 0, 0, 0.03);
    transform: translateY(-0.5px);
  }
  .mly-cb-chip:active {
    transform: translateY(0);
  }
  .mly-cb-chip:focus-visible {
    outline: 2px solid var(--ink);
  }
  .mly-cb-form {
    display: flex;
    gap: 6px;
    padding: 12px;
    border-top: 1px solid var(--line-soft);
  }
  .mly-cb-input {
    flex: 1;
    height: 42px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--bg-soft);
    outline: none;
    font-family: var(--sans);
    font-size: 14px;
    color: var(--ink);
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }
  .mly-cb-input:focus {
    border-color: var(--ink-2);
    background: var(--card);
  }
  .mly-cb-send-btn {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 0;
  }
  .mly-cb-send-btn:hover {
    background: #000;
    transform: scale(1.04);
  }
  .mly-cb-send-btn:active {
    transform: scale(1);
  }
  .mly-cb-send-btn:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }
`;

// ─── UI-Komponente ───────────────────────────────────────────────────────────
function ChatBot() {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("simple"); // "simple" oder "smart"

  // Getrennte Nachrichtenverläufe für beide Bots
  const [messagesSimple, setMessagesSimple] = React.useState([
    { role: "bot", text: CHAT_GREETING }
  ]);
  const [messagesSmart, setMessagesSmart] = React.useState([
    { role: "bot", text: "Hi! Ich bin dein memoly KI-Assistent ✨\n\nFrag mich gerne alles zu memoly – ich helfe dir bei allen Fragen rund um deine Erinnerungs-Booklets." }
  ]);

  const [input, setInput] = React.useState("");
  const [loadingSmart, setLoadingSmart] = React.useState(false);
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Vorschlags-Chips: alle Intents mit Label
  const suggestions = MEMOLY_KB.filter((i) => i.label);

  const activeMessages = activeTab === "simple" ? messagesSimple : messagesSmart;

  // Auto-Scroll nach unten bei neuen Nachrichten
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messagesSimple, messagesSmart, open, activeTab, loadingSmart]);

  // Auto-Focus auf das Input-Feld, wenn der Chatbot geöffnet oder der Tab gewechselt wird
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, activeTab]);

  // Escape-Taste zum Schließen des Chatfensters
  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function ask(question) {
    const q = question.trim();
    if (!q) return;

    if (activeTab === "simple") {
      const answer = findAnswer(q);
      setMessagesSimple((m) => [...m, { role: "user", text: q }, { role: "bot", text: answer }]);
      setInput("");
    } else {
      if (loadingSmart) return;

      setMessagesSmart((m) => [...m, { role: "user", text: q }]);
      setInput("");
      setLoadingSmart(true);

      // Verlauf mitsenden (ohne den ersten Begrüßungs-Post und ohne Fehler)
      const historyPayload = messagesSmart
        .slice(1)
        .filter((m) => m.role !== "error")
        .map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text
        }));

      fetch("https://vddmjeihfsmibtcwxaaa.supabase.co/functions/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: q,
          history: historyPayload
        })
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data) => {
              throw new Error(data.detail || "Verbindung zum Backend fehlgeschlagen.");
            });
          }
          return res.json();
        })
        .then((data) => {
          setMessagesSmart((m) => [...m, { role: "bot", text: data.response }]);
        })
        .catch((err) => {
          console.error("Smart chatbot error:", err);
          setMessagesSmart((m) => [
          ...m,
          {
            role: "error",
            text: "⚠️ Verbindung zum Support-Assistenten fehlgeschlagen. Bitte versuche es später noch einmal oder wende dich an hi@memoly.app."
          }
        ]);
        })
        .finally(() => {
          setLoadingSmart(false);
        });
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    ask(input);
  }

  return (
    <>
      <style>{CHATBOT_CSS}</style>
      <div className="mly-cb-container">
        {/* Chat-Fenster */}
        {open && (
          <div className="mly-cb-window">
            {/* Kopfzeile */}
            <div className="mly-cb-header">
              <img src="/logo.png" alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
              <div style={{ flex: 1 }}>
                <div className="mly-cb-header-title">Lumi</div>
                <div className="mly-cb-header-subtitle">Support-Assistent</div>
              </div>
              <button onClick={() => setOpen(false)} className="mly-cb-close-btn" aria-label="Chat schließen">
                <ChatIconClose />
              </button>
            </div>

            {/* Umschalt-Tabs */}
            <div className="mly-cb-tabs">
              <button
                type="button"
                onClick={() => setActiveTab("simple")}
                className={`mly-cb-tab ${activeTab === "simple" ? "active" : ""}`}
              >
                FAQ-Bot (Klassisch)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("smart")}
                className={`mly-cb-tab ${activeTab === "smart" ? "active" : ""}`}
              >
                KI-Support (Smart)
              </button>
            </div>

            {/* Nachrichten */}
            <div ref={scrollRef} className="mly-cb-messages">
              {activeMessages.map((m, i) => (
                <div key={i} className={`mly-cb-msg ${m.role}`}>
                  {m.text}
                </div>
              ))}
              {activeTab === "smart" && loadingSmart && (
                <div className="mly-cb-typing">
                  <div className="mly-cb-dot"></div>
                  <div className="mly-cb-dot"></div>
                  <div className="mly-cb-dot"></div>
                  <span style={{ marginLeft: 4 }}>Bot schreibt...</span>
                </div>
              )}
            </div>

            {/* Vorschlags-Chips */}
            <div className="mly-cb-suggestions">
              {suggestions.map((s) => (
                <button key={s.id} onClick={() => ask(s.label)} className="mly-cb-chip">
                  {s.label}
                </button>
              ))}
            </div>

            {/* Eingabe */}
            <form onSubmit={onSubmit} className="mly-cb-form">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Frag etwas über memoly…"
                className="mly-cb-input"
              />
              <button type="submit" className="mly-cb-send-btn" aria-label="Senden">
                <ChatIconSend />
              </button>
            </form>
          </div>
        )}

        {/* Schwebender Auslöse-Button */}
        <button onClick={() => setOpen((o) => !o)} className={`mly-cb-trigger ${open ? 'open' : ''}`} aria-label={open ? "Chat schließen" : "Hilfe öffnen"}>
          {open ? <ChatIconClose light /> : <><ChatIconChat /> Hilfe</>}
        </button>
      </div>
    </>
  );
}

// ─── Icons (inline, ohne Abhängigkeit von sections.jsx) ──────────────────────
function ChatIconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5.5A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
function ChatIconSend() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
function ChatIconClose({ light }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

Object.assign(window, { ChatBot });
