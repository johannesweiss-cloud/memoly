# Bug-Liste — memoly

Status-Konventionen: `[ ]` offen · `[x]` erledigt · `[~]` in Arbeit

Reihenfolge: kritische Bugs zuerst, dann fragile Patterns, dann Kleinkram. Empfehlung: Bug #1 + #2 zusammen anfassen (gleicher Fix), dann der Reihe nach abarbeiten.

---

## 🔴 1. `supabase.rest.headers[...]` setzt keinen HTTP-Header

- [x] **Status:** erledigt — Headers werden jetzt per `createClient({ global: { headers } })` gesetzt, Client wird in `setEditToken` neu gebaut.
- **Datei:** `src/api.js` — Zeilen 97, 105, 115, 123, 133, 140, 163, 170, 180, 187
- **Schwere:** Kritisch (alle Schreibzugriffe sind tot)

### Symptom
Jedes `createMoment`, `updateMoment`, `deleteMoment`, `createExtra`, `deleteExtra` wird von der RLS-Policy abgelehnt — die DB sieht den `X-Edit-Token`-Header nie.

### Ursache
In `@supabase/postgrest-js` 2.105.4 ist `this.headers` ein DOM-`Headers`-Objekt, kein Plain-Object:

```ts
// node_modules/@supabase/postgrest-js/src/PostgrestClient.ts:105
this.headers = new Headers(headers)
```

Zuweisungen per Indexer (`headers['X-Edit-Token'] = value`) setzen nur eine JS-Property auf dem Objekt — der HTTP-Header wird **nicht** gesetzt. Beim Senden ruft Postgrest `new Headers(this.headers)` auf, was via Iterator nur die echten Header übernimmt. Die Property wird ignoriert.

### Fix
Headers per `createClient`-Option setzen und den Client neu bauen, wenn sich der Token ändert. Beispiel:

```js
// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _client = createClient(url, key);

export function getClient() {
  return _client;
}

export function setEditToken(token) {
  _client = createClient(url, key, {
    global: { headers: token ? { 'X-Edit-Token': token } : {} }
  });
}
```

Dann in `src/api.js` alle `supabase.rest.headers[...]`-Zeilen entfernen und die Funktionen `getClient()` benutzen.

### Akzeptanzkriterium
Insert/Update/Delete auf `moments` und `extras` funktioniert mit gültigem Token; ohne Token kommt ein RLS-Fehler aus Supabase (kein stilles Scheitern).

---

## 🔴 2. `updateEvent` setzt überhaupt keinen Header

- [x] **Status:** erledigt (Seiteneffekt von Fix #1) — `updateEvent` nutzt jetzt denselben Client und bekommt den Header automatisch. TODO-Kommentarblock ist raus.
- **Datei:** `src/api.js:59-75`
- **Schwere:** Kritisch (blockiert den Paywall-Flow)

### Symptom
`is_paid = true` zu setzen (oder Titel/Subtitle/Tag zu ändern) schlägt immer fehl — selbst wenn Bug #1 gefixt ist, ruft diese Funktion die Header-Logik nie auf, sondern hat nur einen TODO-Kommentar.

### Fix
Wird mit Bug #1 in einem Aufwasch gelöst — sobald Headers per `createClient` mitgegeben werden, gilt das automatisch auch für `updateEvent`. Den Workaround-Kommentar-Block (Zeilen 67–72) ersatzlos löschen.

### Akzeptanzkriterium
`updateEvent(id, { is_paid: true })` aktualisiert die Zeile in Supabase und gibt das aktualisierte Event zurück.

---

## 🟠 3. Nur ein `edit_token` pro Gerät möglich

- [x] **Status:** erledigt — Tokens werden jetzt in einer JSON-Map unter `localStorage['memoly_edit_tokens']` pro `eventId` gespeichert. Aktiver Client wird per `setActiveEvent(eventId)` umgeschaltet, `createEvent` macht das für neu angelegte Events automatisch.
- **Datei:** `src/api.js:4`
- **Schwere:** Hoch (Datenverlust auf Editor-Seite)

### Symptom
Wer zwei Events anlegt, verliert den Edit-Token des ersten beim Anlegen des zweiten — der LocalStorage-Key `memoly_edit_token` ist global. Da Supabase die Tokens nur einmal beim INSERT liefert, ist das Edit-Recht für das erste Event danach unwiederbringlich weg.

### Fix
Token pro Event keyen. Zwei Optionen:

**Option A — Key pro Event:**
```js
function tokenKey(eventId) { return `memoly_edit_token_${eventId}`; }
export function getEditToken(eventId) { return localStorage.getItem(tokenKey(eventId)); }
export function setEditToken(eventId, token) { localStorage.setItem(tokenKey(eventId), token); }
```

**Option B — Eine JSON-Map:**
```js
function readMap() { return JSON.parse(localStorage.getItem('memoly_edit_tokens') || '{}'); }
function writeMap(m) { localStorage.setItem('memoly_edit_tokens', JSON.stringify(m)); }
```

Option A ist simpler, Option B macht es leichter, später eine „Meine Events"-Übersicht zu bauen. Empfehlung: B.

### Akzeptanzkriterium
Zwei Events nacheinander anlegen → für beide kann man danach noch Moments anlegen.

---

## 🟠 4. Race-Condition-Risiko im Header-Set/Delete-Pattern

- [x] **Status:** erledigt (Seiteneffekt von Fix #1) — kein globaler Side-Channel mehr; der Token hängt an der Client-Instanz.
- **Datei:** `src/api.js` (alle Write-Funktionen)
- **Schwere:** Mittel (greift erst nach Fix #1, dann aber sofort)

### Symptom
Selbst nach Fix #1 — falls man das alte Muster („global setzen → await → global löschen") behalten würde — schickt ein paralleler `Promise.all` über zwei Events mit unterschiedlichen Tokens potenziell den falschen Token mit.

### Fix
Wird durch Fix #1 (Headers per `createClient` + Client-Reinit bei Token-Wechsel) erledigt. Wenn der Token an der Client-Instanz hängt, gibt es keinen globalen Side-Channel mehr.

### Akzeptanzkriterium
Keiner — wenn #1 sauber umgesetzt ist, ist auch #4 weg.

---

## 🟠 5. Frontend hängt nicht am Backend

- [x] **Status:** erledigt — neue `src/main.js` als ES-Module, Hash-Routing (`#/event/<id>`), Mutationen via `api.js`, Storage-Upload für Bilder, Edit-vs-View-Mode anhand des Tokens. localforage-Script und alter Inline-Code aus `index.html` entfernt. Setup-Modal funktioniert jetzt als Create- (Home) und Edit-Modus (`updateEvent`).
- **Datei:** `index.html` vs. `src/api.js`
- **Schwere:** Hoch (blockiert Release als „echtes Produkt")

### Symptom
`index.html` importiert nichts aus `src/`. Die komplette Backend-Logik in `src/api.js` und `src/supabase.js` ist toter Code, das Frontend nutzt weiter localforage + URL-Hash.

### Fix (Schritte)
1. `index.html` so umbauen, dass es ein ES-Module-`<script type="module">` lädt, das `src/api.js` importiert.
2. State-Verwaltung umstellen:
   - `loadState()` → `getEvent(id)` + `getMoments(id)` + `getExtras(id)`
   - `saveState()` ersatzlos streichen; stattdessen einzelne `createMoment`/`updateMoment`/etc. bei jeder Mutation.
3. Bilder-Upload: statt `dataUrl` in localforage → `supabase.storage.from('event-images').upload(...)` und nur den Pfad in `moments.image_path` speichern.
4. URL-Schema: statt `#data=<base64>` echte Route `/event/<id>`.
5. Die `localforage`-CDN-Zeile und `generateLink`-Funktion entfernen.

### Akzeptanzkriterium
Ein Event anlegen, Browser-Tab schließen, in einem anderen Browser/Inkognito mit der `/event/<id>`-URL öffnen, Inhalte sehen (nur Editor mit Token kann ändern).

---

## 🟡 6. URL-Hash-Länge wird nicht geprüft

- [x] **Status:** erledigt (Seiteneffekt von Fix #5) — `generateLink` und das `#data=<base64>`-Schema sind ersatzlos weg.
- **Datei:** `index.html:1119`
- **Schwere:** Niedrig (verschwindet mit Backend-Migration)

### Symptom
`generateLink` baut `#data=<base64>` aus allen Dates. Bei vielen Einträgen mit langen Beschreibungen kann die URL die Browser-Limits (~2k–32k je nach Browser) sprengen. Keine Längenprüfung.

### Fix
Wird durch Fix #5 obsolet (kein Hash-Sharing mehr). Bis dahin optional: `if (base64.length > 2000) showToast('Zu viele Daten für den Link…')`.

---

## 🟡 7. Verwaiste localforage-Daten beim Wechsel von `default`

- [x] **Status:** erledigt (Seiteneffekt von Fix #5) — localforage ist komplett entfernt; State wird ausschließlich aus Supabase geladen.
- **Datei:** `index.html:1145-1175`
- **Schwere:** Niedrig

### Symptom
Wenn `eventId` von `'default'` zu einem echten Wert wechselt (über `generateLink`), bleiben die Daten unter dem Default-Key in localforage liegen.

### Fix
Wird durch Fix #5 obsolet. Falls die localforage-Phase noch lange läuft: nach erfolgreichem `generateLink` den alten Key explizit löschen.

---

## 🟡 8. `getRoundedImgData` — Naht-Risiko bei Farbänderung

- [ ] **Status:** offen
- **Datei:** `index.html:866-900` und Aufruf in `index.html:1063-1065`
- **Schwere:** Niedrig (aktuell nur latent)

### Symptom
Der `bgColor` füllt das Canvas *vor* dem Clip — die Ecken außerhalb des Radius bleiben in dieser Farbe und werden im PDF sichtbar. Aktuell passen die Farben (`#f5f5f3` in `setFillColor(245,245,243)` und im `bgColor`-Argument), aber wenn jemand nur eine Stelle ändert, sieht man eine Naht.

### Fix
Eine Konstante extrahieren, damit beide Stellen automatisch synchron bleiben:
```js
const EXTRA_SLOT_BG = '#f5f5f3';
// ... setFillColor aus EXTRA_SLOT_BG ableiten, getRoundedImgData mit EXTRA_SLOT_BG aufrufen
```

---

## 🟡 9. `puppeteer` in `dependencies` statt `devDependencies`

- [ ] **Status:** offen
- **Datei:** `package.json:13`
- **Schwere:** Niedrig (kostet Build-Zeit und MB im Production-Install)

### Fix
```bash
npm uninstall puppeteer
npm install --save-dev puppeteer
```

### Akzeptanzkriterium
`npm install --omit=dev` zieht puppeteer nicht mehr mit rein.

---

## 🟡 10. CDN-only Abhängigkeiten im Frontend

- [~] **Status:** teilweise — `localforage` ist raus (mit #5). `jspdf` lädt weiterhin vom Cloudflare-CDN; lokal bündeln via `npm install jspdf` ist noch offen.
- **Datei:** `index.html:639-640`
- **Schwere:** Niedrig (Verfügbarkeitsrisiko, kein Funktionsbug)

### Symptom
`localforage` und `jspdf` kommen vom Cloudflare-CDN. Bei Offline-Fall oder CDN-Ausfall bricht die App komplett. Für eine Bezahl-App, die User in „Erinnerungs-Momenten" nutzen, riskant.

### Fix
Nach Backend-Migration (#5): `localforage` fliegt raus. `jspdf` via `npm install jspdf` lokal bündeln (Vite kümmert sich um den Rest).

---

## 🟢 11. Code-Hygiene

- [ ] **Status:** offen
- **Schwere:** Trivial

### Sammelpunkte
- `src/api.js:67-72` — Verwaister TODO-Kommentarblock in `updateEvent`. Mit Fix #1/#2 löschen.
- `check.cjs` — Prüft nur `new Function(code)` (Syntax). Ersetzen durch `node --check` oder echten ESLint-Lauf, sobald die Codebase modularer ist.
- `src/supabase.js:4-5` — Platzhalter-Strings `'YOUR_SUPABASE_URL'`. Beim Fehlen der env-Variable sollte hart abgebrochen werden statt einen unbrauchbaren Client zu erzeugen:
  ```js
  if (!url || !key) throw new Error('Supabase env vars missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  ```

---

## Empfohlene Reihenfolge

1. **#1 + #2** (zusammen, ein Fix) — Headers via `createClient` + Client-Reinit
2. **#3** — Token pro Event keyen
3. **#5** — Frontend an Backend anschließen (größter Brocken, danach erledigen sich #6, #7, #10 teilweise von selbst)
4. **#8, #9, #11** — Kleinkram, jederzeit nebenher
