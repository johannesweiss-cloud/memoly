# memoly — Produkt-Wissensdatenbank (RAG)

Diese Datei dient als offizielle Datenbasis für den Kundensupport-Chatbot von memoly. Sie enthält alle wichtigen Informationen zu Funktionen, Preisen, Datenschutz und dem aktuellen Projektstatus.

---

## 1. Was ist memoly?
memoly ist eine Web-App, die gemeinsame Erlebnisse (wie Urlaube, Ausflüge, Hochzeiten, Dates oder Familienfeste) in ein wunderschön kuratiertes Erinnerungs-Booklet verwandelt. 
* **Das Problem:** Menschen machen hunderte Handyfotos, die danach ungesehen in der Galerie verstauben.
* **Die Lösung:** memoly regt zur bewussten Auswahl (Kuration) an. Jeder Moment besteht aus einem Foto, einem Titel und einer kurzen Geschichte/Beschreibung. Am Ende entsteht ein strukturiertes Dokument, das die Erinnerungen greifbar macht.

---

## 2. Funktionsweise (In 3 Schritten)
1. **Trip / Event erstellen:** Dem gemeinsamen Erlebnis einen Namen geben (z. B. „Wochenende in Paris“). Kein Account-Zwang für den Einstieg.
2. **Momente festhalten:** Momente hinzufügen, indem man ein Foto hochlädt, einen prägnanten Titel eingibt und die Story dazu aufschreibt.
3. **Exportieren:** Die fertige Erinnerung mit einem Klick als hochwertiges, druckfertiges PDF herunterladen.

---

## 3. Preise & Abrechnung
* **Kostenlos ausprobieren:** Das Erstellen des Events und das Hinzufügen von Momenten ist komplett kostenlos.
* **Einmalige Zahlung:** Bezahlt wird erst beim Exportieren des fertigen PDFs.
* **Preis:** Einmalig **3,99 € pro Event**.
* **Kein Abonnement (Abo):** Es gibt keine monatliche Grundgebühr und keine versteckten Kosten. Man zahlt nur, wenn man das fertige Booklet wirklich als Datei haben möchte.
* **Zahlungsabwickler:** Die Zahlung erfolgt sicher über **Lemon Squeezy**. Lemon Squeezy fungiert als *Merchant of Record* (Zahlungsempfänger im rechtlichen Sinne). Das bedeutet, dass Lemon Squeezy die MwSt.-Berechnung (auch länderübergreifend in der EU) und die Rechnungsstellung komplett übernimmt. Für Kunden ist dies absolut sicher und transparent.

---

## 4. Benutzerkonto & Registrierung
* **Kein Login nötig:** Für die Erstellung eines Booklets muss man sich nicht registrieren und kein Konto anlegen.
* **Bearbeitungsrechte (Tokens):** Die Berechtigung, ein Event zu bearbeiten, wird über ein sicheres Token (`edit_token`) geregelt, das lokal im Browser (`LocalStorage` unter dem Schlüssel `memoly_edit_tokens`) als JSON-Map abgelegt wird. So kann man seine Trips auch ohne Login bearbeiten.
* **Teilen:** Man kann den Link zu einem Trip teilen. Andere Personen sehen das Booklet standardmäßig im schreibgeschützten Modus (Read-Only), es sei denn, sie besitzen den Bearbeitungs-Token.

---

## 5. Datenschutz & Sicherheit
* **Server-Standort:** Alle Fotos und Daten werden sicher in der Cloud auf Servern innerhalb der Europäischen Union (Supabase Storage / Database) gehostet.
* **Kein KI-Training:** Fotos und persönliche Geschichten der Nutzer werden unter keinen Umständen für das Training von KI-Modellen verwendet.
* **Keine Werbung:** Daten werden niemals an Werbenetzwerke verkauft oder weitergegeben.
* **Löschung:** Nutzer können ihre Events samt aller hochgeladenen Fotos jederzeit eigenständig und vollständig löschen.

---

## 6. Aktueller Projektstatus (Pre-Launch & Warteliste)
* **Pre-Launch-Phase:** Die Hauptanwendung ist technisch fertig entwickelt und getestet, aber derzeit noch nicht öffentlich freigeschaltet.
* **Warteliste:** Auf der Landingpage befindet sich ein Wartelisten-Formular. Interessierte Nutzer können sich mit ihrer E-Mail-Adresse eintragen. Neue Nutzer werden schrittweise alle zwei Wochen eingeladen und freigeschaltet.
* **Freischaltung:** Sobald der offizielle Launch stattfindet, wird der Vercel-Redirect entfernt und die echte Web-App (`app.html`) ist für alle über die CTAs erreichbar.

---

## 7. Technische Details & Einschränkungen
* **Internetverbindung:** Eine aktive Internetverbindung ist derzeit zwingend erforderlich. Ein Offline-Modus ist in Planung, aber noch nicht verfügbar.
* **Gemeinsames Bearbeiten (Kollaboration):** Derzeit kann ein Trip nur von dem Gerät aus bearbeitet werden, auf dem er erstellt wurde (bzw. auf dem der Bearbeitungs-Token importiert wurde). Ein gemeinsames Befüllen in Echtzeit durch mehrere Nutzer ist für eine spätere Version geplant.
* **PDF-Format:** Der Export erzeugt ein standardisiertes PDF-Dokument in Druckqualität. Weitere Exportformate sind geplant.

---

## 8. Kontakt & Support
* **E-Mail-Adresse:** Bei Fragen, Feedback oder Problemen erreicht man das Team direkt unter **hi@memoly.app**.
