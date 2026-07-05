# ValCrypta — Sicherheitsprüfung & Review-Plan

**Prüfgegenstand:** Der aktuell deployte Stand (`main`, Vercel-Auto-Deploy)
**Datum:** 2026-07-05
**Art:** Whitebox-Code-Review des Client-Codes + DB-Schema/RLS aus `supabase/`
**Selbstbeschreibung der App:** Ende-zu-Ende-verschlüsselter Messenger; „Der Server speichert nur Chiffretext."

> Dieses Dokument ist zweigeteilt:
> **Teil A** – konkrete Befunde aus dem Code-Review (was ich verifizieren konnte).
> **Teil B** – Prüfplan für alles, was nur an der laufenden Supabase-Instanz / im Betrieb verifizierbar ist (Serverkonfiguration, produktive Tabellen, die nicht im Repo liegen).

---

## 0. Bedrohungsmodell (Scope)

Die App verspricht E2E-Verschlüsselung. Der relevante Angreifer ist daher **nicht nur der externe Netzwerk-Angreifer, sondern der Betreiber/kompromittierte Server selbst** (Supabase-Backend). Ein E2E-Versprechen ist nur so viel wert, wie es genau gegen diesen Angreifer schützt.

Betrachtete Angreifer:
1. **Passiver Server / Datenbank-Leak** – liest alle gespeicherten Daten (Chiffretext, Metadaten, Key-Backups).
2. **Aktiver/bösartiger Server** – kann Datensätze verändern/einfügen (Public Keys, Nachrichten).
3. **Anderer authentifizierter Nutzer** – versucht, über RLS-Lücken an fremde Daten zu kommen.
4. **Angreifer mit Client-Zugriff** – XSS, bösartige Browser-Extension, Malware, physischer Gerätezugriff.
5. **Offline-Angreifer** – hat ein Key-Backup-Blob erbeutet und bruteforced das Passwort.

Architektur in einem Satz: RSA-OAEP-2048-Langzeitschlüssel pro Nutzer; Nachrichten hybrid (zufälliger AES-GCM-Key, RSA-gewrappt für Empfänger `rk` und Sender `sk`); Private Key wird per PBKDF2(Passwort)+AES-GCM gewrappt lokal (IndexedDB) und optional in `key_backups` in der Cloud abgelegt.

---

## Teil A — Befunde aus dem Code-Review

Schweregrade: **Kritisch** · **Hoch** · **Mittel** · **Niedrig** · **Info**

### A-1 · Hoch · Keine Schlüssel-Authentifizierung → Server-MITM bricht das E2E-Versprechen
**Ort:** `src/components/Chat/ChatArea.tsx:166` (`importPublicKey(activeContact.public_key)`), `supabase/init.sql` (`users.public_key`, UPDATE-Policy)

Beim Senden wird der Public Key des Empfängers **direkt aus der `users`-Tabelle** geladen und ohne jede Prüfung zum Verschlüsseln benutzt. Es gibt kein Fingerprint-/Safety-Number-Verfahren, keine „Schlüssel hat sich geändert"-Warnung, kein TOFU-Pinning. Ein bösartiger oder kompromittierter Server (bzw. jemand mit Schreibrechten auf `users`) kann den Public Key eines Kontakts durch einen selbst kontrollierten Schlüssel ersetzen und damit **alle Nachrichten unbemerkt mitlesen** (klassischer MITM). Genau gegen diesen Angreifer soll E2E schützen.

**Empfehlung:** Schlüssel-Fingerprint (z. B. SHA-256 des SPKI) in der UI anzeigen und einen manuellen Vergleich / Safety-Numbers-Flow anbieten; Schlüsseländerungen eines Kontakts erkennen (lokales Pinning) und deutlich warnen.

### A-2 · Hoch · Keine Nachrichten-Signatur → Server kann Nachrichten fälschen/einschleusen
**Ort:** `src/lib/crypto.ts:147` (`encryptMessage`), gesamte Nachrichtenkette

Nachrichten werden verschlüsselt, aber **nicht signiert**. Die Urheberschaft hängt ausschließlich an der DB-Spalte `sender_id`, die nur durch RLS (`auth.uid() = sender_id`) geschützt ist. Ein normaler Client kann daher zwar nicht fälschen — der **Server / Service-Role umgeht RLS jedoch** und kann Nachrichten mit beliebigem `sender_id` einfügen. Es gibt keine kryptografische Bindung von Chiffretext an den echten Absender (keine Authentizität/Integrität auf E2E-Ebene, kein Schutz vor Einschleusen).

**Empfehlung:** Signatur-Schlüsselpaar pro Nutzer (z. B. Ed25519/ECDSA über WebCrypto) einführen und jede Nachricht signieren; empfängerseitig gegen den (verifizierten, s. A-1) Public Key prüfen. Perspektivisch ein authentifiziertes Schlüsselaustausch-Protokoll (X3DH/Double Ratchet) erwägen.

### A-3 · Hoch · Entsperrter Private Key liegt im Klartext (unverschlüsselt) at rest — ✅ behoben
**Ort:** `src/lib/key-session.ts:79-93` (`persistUnlockedKey`)

> **Status (behoben):** `persistUnlockedKey` nimmt jetzt den PKCS8-String statt eines CryptoKey; der In-Memory-Key ist überall **non-extractable** (`importPrivateKey` mit `extractable: false`). At rest: „comfort" speichert ein non-extractable `CryptoKey`-Objekt in IndexedDB; „balanced" splittet — AES-GCM-Ciphertext des PKCS8 in `sessionStorage`, non-extractable AES-Wrapping-Key in IndexedDB (`wrap_<userId>`); jede Hälfte allein ist nutzlos. Der Stufenwechsel fragt das Passwort erneut ab und entschlüsselt den gespeicherten Blob. Alt-Einträge (Klartext-PKCS8) werden beim Restore einmalig ins neue Format migriert — kein Lockout.

Bei den Stufen **„balanced"** und **„comfort"** wird der Private Key per `exportPrivateKey` als **unverschlüsseltes PKCS8** abgelegt:
- `balanced` → `sessionStorage` (Klartext, für die Tab-Lebensdauer)
- `comfort` → IndexedDB `unlocked_keys` (Klartext, **dauerhaft auf der Platte**)

Damit wird der eigentliche Zweck der passwortbasierten Schlüsselverpackung ausgehebelt: Wer Lesezugriff auf den Origin-Storage bekommt (XSS, bösartige Extension, lokaler/forensischer Plattenzugriff bei „comfort"), erhält den **rohen Private Key** und kann sämtliche Nachrichten entschlüsseln. Verschärfend kommt hinzu, dass alle Schlüssel als `extractable: true` erzeugt/importiert werden (`src/lib/crypto.ts:13,37,51`), sodass der In-Memory-Schlüssel per `exportKey` abgezogen werden kann.

**Empfehlung:** Entsperrten Schlüssel nicht als extrahierbares Klartext-Blob persistieren. Optionen: (a) als **non-extractable `CryptoKey`** direkt in IndexedDB speichern (WebCrypto erlaubt das Speichern von `CryptoKey`-Objekten, ohne Rohbytes preiszugeben); (b) mit einem geräte-/passkeygebundenen Schlüssel umschlüsseln. Mindestens die Stufe „comfort" (Klartext dauerhaft auf Platte) klar als Risiko kennzeichnen.

### A-4 · Hoch/Mittel · `users`-SELECT-Policy legt E-Mail-Adressen aller Nutzer offen
**Ort:** `supabase/init.sql:14-19`

```sql
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT TO authenticated USING (true);
```

Jeder eingeloggte Nutzer darf `select *` auf `users` — inklusive **`email` aller anderen Nutzer**. Die Public Keys müssen zwar lesbar sein (fürs Verschlüsseln), die **E-Mail-Adressen (PII) aber nicht**. Ein beliebiger registrierter Account kann die gesamte E-Mail-Liste abziehen (`supabase.from('users').select('email')`). Das ist ein konkreter Datenschutz-/PII-Verstoß, kein theoretischer.

**Empfehlung:** E-Mail nicht über die breite Policy exponieren. Z. B. Public-Profil auf `id, username, public_key` reduzieren (separate View mit Spaltenrechten, oder E-Mail-Spalte per Column-Privileges/`GRANT` von `authenticated` entziehen und nur die eigene Zeile lesbar machen). Suche/Anzeige braucht nur `username` + `public_key`.

### A-5 · Mittel · Schwache KDF-Parameter + laxe Passwortregel → Offline-Bruteforce des Cloud-Key-Backups
**Ort:** `src/lib/crypto.ts:1` (`PBKDF2_ITERATIONS = 100000`), `src/lib/crypto.ts:342` (`calculatePasswordStrength`), `src/components/Auth/SignupPage.tsx:44` (`score < 3`)

Der Private Key wird mit **PBKDF2-HMAC-SHA256, 100 000 Iterationen** gewrappt. Das liegt deutlich unter aktuellen Empfehlungen (OWASP 2024/25: ≥ 600 000 für PBKDF2-SHA256). Dieses **gewrappte Blob wird für „balanced"/„comfort" in `key_backups` in die Cloud geladen** — ein Server-Leak oder Zugriff auf diese Zeile ermöglicht einen **Offline-Angriff**. Zugleich ist die Passwortregel schwach: `score ≥ 3` ist bereits mit z. B. 12 Zeichen Kleinbuchstaben oder 8 Zeichen (Klein+Groß) erfüllt; kein Entropie-Minimum, kein Abgleich gegen geleakte Passwörter. Schwaches Passwort + niedrige Iterationszahl + Cloud-Backup = realistisches Offline-Cracking.

**Empfehlung:** Iterationszahl erhöhen (≥ 600 000) oder auf **Argon2id** (WASM) wechseln; Salt-Länge ist mit 16 Byte ok. Passwortpolicy verschärfen (Mindestlänge ~12), und Nutzer bei aktivem Cloud-Backup gezielt auf die Passwortstärke hinweisen. Ein Abgleich gegen geleakte Passwörter ist hier besonders sinnvoll, weil Supabases serverseitiger Leaked-Password-Schutz ein **Pro-Feature** ist und im genutzten **Free-Plan nicht verfügbar** — der Abgleich lässt sich aber kostenlos **clientseitig** über die HIBP-Range-API (k-Anonymity, nur SHA-1-Präfix wird gesendet) umsetzen.

### A-6 · Mittel · Keine Content-Security-Policy; Runtime-Abhängigkeit von externen CDNs
**Ort:** `index.html` (kein CSP-Meta), kein `vercel.json`/`public/_headers`; externe Fonts von `api.fontshare.com`, `cdn.fontshare.com`, `fonts.googleapis.com`, `fonts.gstatic.com`
**Live bestätigt (2026-07-05, `curl -I https://valcrypta.vercel.app`):** Von den Security-Headern ist **nur `Strict-Transport-Security`** gesetzt (`max-age=63072000; includeSubDomains; preload` — gut). **Fehlend: `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.** Zusätzlich liefert die HTML-Antwort `access-control-allow-origin: *`.

Es gibt **keinerlei CSP** (weder Header noch Meta) und keine Trusted-Types. In Kombination mit den extrahierbaren In-Memory-Schlüsseln (A-3) bedeutet jede XSS- oder Supply-Chain-Kompromittierung (auch über die eingebundenen Dritt-CDNs) potenziell **vollständige Schlüssel-Exfiltration**. Positiv: Im aktuellen Code fand ich **keine gefährlichen Sinks** (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `document.write` — alle nicht vorhanden), und React escaped Standardausgaben. Das Risiko ist also v. a. Defense-in-Depth und Supply-Chain, nicht ein akuter reflektierter XSS.

**Empfehlung:** Strikte CSP setzen (per `vercel.json`-Headers oder `public/_headers`): `default-src 'self'`, Connect nur zur Supabase-URL, `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`. Fonts idealerweise selbst hosten, um die Dritt-Origins zu eliminieren. Zusätzlich Standard-Security-Header (`X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS).

### A-7 · Mittel (Design) · Keine Forward Secrecy
**Ort:** `src/lib/crypto.ts` (statische RSA-Langzeitschlüssel)

Es werden statische RSA-Langzeitschlüssel ohne Ratcheting verwendet. Kompromittierung des Private Keys (oder des Passworts, s. A-5) entschlüsselt **rückwirkend und zukünftig alle** Nachrichten. Kein Signal-artiges Double-Ratchet. Für die aktuelle Architektur erwartbar, aber für ein „niemand liest mit"-Versprechen eine relevante Grenze.

**Empfehlung:** Als bewusste Design-Grenze dokumentieren; mittelfristig ephemere Session-Keys / Ratcheting erwägen.

### A-8 · Niedrig · `messages`-UPDATE-Policy ist zu breit
**Ort:** `supabase/init.sql:95-101`

Die Policy erlaubt dem Empfänger UPDATE auf empfangene Nachrichten mit `WITH CHECK (auth.uid() = recipient_id)`, ohne die Spalten einzuschränken. Gedacht ist sie nur fürs Setzen von `read_at`. Ein Empfänger kann damit **beliebige Spalten seiner empfangenen Zeilen ändern** (z. B. `encrypted_content` überschreiben). Impact gering (betrifft die eigene Sicht/Kopie, Sender bleibt unveränderbar), aber unnötig weit.

**Empfehlung:** UPDATE auf `read_at` beschränken (Trigger/`GRANT ... (read_at)` oder Spaltenprüfung), oder Read-Receipts über eine separate Tabelle lösen.

### A-9 · Niedrig · Dateiname aus entschlüsselten Metadaten steuert `a.download`
**Ort:** `src/components/Chat/FileMessage.tsx:81-82`

Der (vom Sender kontrollierte) entschlüsselte Dateiname wird als `a.download` gesetzt. Vom Browser wird das weitgehend neutralisiert (kein echter Pfad-Traversal beim Download), und der Blob-`type` kommt aus den Metadaten. Kein XSS, da nur als Attribut/`alt` genutzt. Rest-Risiko: irreführende Dateinamen/-endungen (Social Engineering).

**Empfehlung:** Dateinamen beim Download sanitisieren (Pfadtrenner/Steuerzeichen entfernen, Länge begrenzen).

### A-10 · Info · Metadaten sind serverseitig sichtbar
`sender_id`, `recipient_id`, Zeitstempel, `file_size`, `extension` liegen im Klartext. Wer-mit-wem-wann und Dateigrößen sind für den Server also einsehbar. Architekturbedingt; sollte im Sicherheitsversprechen ehrlich benannt werden („Inhalte E2E, Metadaten nicht").

### A-11 · Info · Positiv verifiziert
- **Storage-RLS sauber:** Upload nur in eigenen `{uid}/`-Ordner; Download nur, wenn eine `messages`-Zeile die Datei referenziert und den Nutzer als Sender/Empfänger nennt (`has_file_access`, SECURITY DEFINER mit gepinntem `search_path`) — kein offensichtliches IDOR.
- **Datei-Löschreihenfolge** (Objekt vor Zeile) ist korrekt begründet und implementiert (`src/lib/files.ts:117`).
- **Key-Backup korrekt getrennt** von `users` (eigene Tabelle, eigene Owner-only-RLS) — das gewrappte Blob ist nie über die breite Profil-SELECT-Policy erreichbar.
- **Anon Key im Client** ist by-design öffentlich; keine `service_role`-Leaks im Code gefunden.
- Object-URLs für entschlüsselte Bilder werden getrackt und beim Unmount revoked.

### A-12 · Niedrig · `has_file_access(path, user_id)` als RPC-Orakel aufrufbar
**Ort:** `supabase/init.sql:208` (Funktion), Live-Advisor `authenticated_security_definer_function_executable`

Die `SECURITY DEFINER`-Funktion `has_file_access(file_path text, user_id uuid)` ist für die `authenticated`-Rolle direkt über `/rest/v1/rpc/has_file_access` aufrufbar und nimmt die **`user_id` als Parameter** (statt intern `auth.uid()` zu verwenden). Ein eingeloggter Nutzer kann damit `has_file_access('<pfad>', '<fremde_uid>')` aufrufen und erhält ein Ja/Nein, **ob eine fremde UID Sender/Empfänger eines bestimmten Objektpfads ist** — ein Informations-Orakel. Praktisch begrenzt, weil Objektpfade `{senderId}/{uuid}` einen nicht erratbaren UUID enthalten; wer den Pfad aber kennt (z. B. aus einer geteilten Nachricht), kann Beziehungen bestätigen.

**Empfehlung:** Den `user_id`-Parameter entfernen und in der Funktion `auth.uid()` verwenden; die Storage-SELECT-Policy entsprechend auf `has_file_access(name)` umstellen. Dadurch ist kein Abfragen fremder UIDs mehr möglich.

---

## Teil B — Prüfplan (nur an laufender Instanz / im Betrieb verifizierbar)

Diese Punkte lassen sich aus dem Repo **nicht** abschließend beurteilen und müssen aktiv verifiziert werden. Empfohlen: über die Supabase-MCP-Tools bzw. das Dashboard.

> **✅ Live gegen das echte ValCrypta-Backend verifiziert (2026-07-05, Projekt `kxbllpwcsqbmqnmwuqyw`).** Die MCP-Verbindung wurde auf das korrekte Projekt umgestellt; alle 8 erwarteten Tabellen (`users`, `messages`, `contacts`, `key_backups`, `typing_status`, `unread_counts`, `notification_settings`, `email_notification_queue`) sind vorhanden, RLS ist überall aktiviert. B-1, B-2, B-3, B-4, B-6 sind damit abgearbeitet (Ergebnisse unten). B-5/B-7 bleiben repo-/betriebsseitig offen.
>
> *Hinweis zur ersten Prüfung: Die anfangs erreichbare MCP-Verbindung zeigte auf ein **fremdes** Projekt (`auvmdkzulyrvhfylfjpy`, 42 Tabellen einer anderen App, 196 Lints). Das war nicht ValCryptas Datenbank und ist hier ohne Belang — nur als Warnung, die MCP stets aufs richtige Projekt zu richten.*

### B-1 · RLS der produktiven Zusatztabellen — ✅ erledigt (unkritisch)
Die vier zuvor ungeprüften Tabellen sind **sauber owner-scoped**, kein Leak:
- `typing_status` — SELECT `auth.uid() = user_id OR auth.uid() = contact_id`; INSERT/UPDATE/DELETE nur eigene Zeile. OK.
- `unread_counts`, `notification_settings` — SELECT/INSERT/UPDATE nur `auth.uid() = user_id`. OK.
- `email_notification_queue` — **nur** eine Policy `Service role can manage email queue` (Rolle `service_role`), **keine** Policy für `authenticated` → bei aktivem RLS für Clients standardmäßig **deny-all**. Die anfängliche Sorge (Metadaten-/E-Mail-Leck über diese Queue) ist damit **entkräftet**: normale Nutzer können sie nicht lesen. (Der Server/Service-Role sieht die Inhalte erwartungsgemäß.)

Zusätzlich live bestätigt: **A-4** (`users`-SELECT `USING (true)` → alle E-Mails für jeden authentifizierten Nutzer lesbar) und **A-8** (`messages`-UPDATE für den Empfänger ohne Spaltenbeschränkung). Beide gelten unverändert.
`supabase/init.sql:253-256` weist ausdrücklich darauf hin, dass in Produktion weitere Tabellen existieren, die **nicht im Repo** sind:
`typing_status`, `unread_counts`, `notification_settings`, `email_notification_queue`.
Diese sind **ungeprüft**. Besonders `email_notification_queue` kann Metadaten (wer-schrieb-wem, wann) und E-Mail-Adressen enthalten.
**Zu tun:** `list_tables` + `get_advisors(type=security)`; für jede Tabelle prüfen: RLS aktiv? Policies korrekt (owner-scoped)? Trigger/Funktionen `SECURITY DEFINER` mit gepinntem `search_path`? Wird dort Klartext gespeichert?

### B-2 · Supabase-Auth-Konfiguration — ✅ teilweise erledigt
- **Anonyme Anmeldungen:** nicht aktiviert (Advisor meldet keinen `auth_allow_anonymous_sign_ins`). Gut.
- **Leaked-Password-Schutz (HIBP):** deaktiviert. **Das ist eine Supabase-Pro-Funktion und steht im Free-Plan nicht zur Verfügung** — daher hier kein Handlungspunkt. Ersatzweise clientseitig lösbar (siehe A-5): der HIBP-Range-API-Abgleich per k-Anonymity ist kostenlos und ohne Supabase-Pro direkt im Browser machbar.
- **Noch manuell im Dashboard zu prüfen** (nicht über MCP-Advisors sichtbar): E-Mail-Bestätigung (der Signup-Code erwartet eine sofortige Session → deutet auf **deaktivierte Bestätigung** hin → Account-Squatting/Spam möglich), Rate-Limits für Login/Signup/OTP, JWT-Ablaufzeit/Refresh-Rotation, zulässige Redirect-/Site-URLs.

### B-3 · Supabase Security Advisors — ✅ erledigt (2026-07-05)
`get_advisors(security)` gegen `kxbllpwcsqbmqnmwuqyw`. Ergebnis (nur WARN/INFO, **keine** ERROR, **keine** fehlende RLS, **keine** `always-true`-Policy):
- **8× „Table exposed in GraphQL"** (`users`, `messages`, `contacts`, `key_backups`, `typing_status`, `unread_counts`, `notification_settings`, `email_notification_queue`) — die `authenticated`-Rolle hat Tabellen-`SELECT`-Grant, wodurch die Tabellen im API-/GraphQL-Schema *auffindbar* sind. **Kein Datenleck**, weil RLS die Zeilen weiterhin filtert (bei `email_notification_queue` = deny-all für Clients). Empfehlung (Defense-in-Depth): auf Tabellen, die kein Client direkt lesen muss (v. a. `key_backups`, `email_notification_queue`), `REVOKE SELECT ... FROM authenticated`.
- **2× „SECURITY DEFINER per RPC ausführbar"**: `has_file_access(file_path, user_id)` und `reset_unread_count(p_contact_id)`. → Neuer Befund **A-12** (unten) zu `has_file_access`.
- **1× Leaked-Password-Schutz aus** — Pro-Feature, im Free-Plan n/a (s. B-2), kein Handlungspunkt.

### B-4 · HTTP-Security-Header live prüfen — ✅ erledigt (2026-07-05)
Live geprüft an `https://valcrypta.vercel.app`. Ergebnis: **nur `Strict-Transport-Security` vorhanden** (2 Jahre, includeSubDomains, preload). **Fehlend: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.** HTML-Antwort mit `access-control-allow-origin: *`. → Umsetzung siehe A-6.

### B-5 · Dependency-/Supply-Chain-Audit — ✅ erledigt (2026-07-05)
`npm audit`: 12 Findings (6 high, 5 moderate, 1 low). **Alle liegen in Build-/Dev-Dependencies** (`vite`, `esbuild`, `rollup`, `@babel/core`, `postcss`, `minimatch`, `picomatch`, `ws`, `flatted`, `ajv`, `js-yaml`, `brace-expansion`) — überwiegend nur den **lokalen Dev-Server** betreffend (z. B. `vite ≤6.4.2` Path-Traversal). Die **Runtime-Dependencies** (`@supabase/supabase-js`, `react`, `react-dom`, `zustand`, `lucide-react`) haben **keine** Advisories; nichts davon landet im ausgelieferten Browser-Bundle. **Priorität niedrig.** Empfehlung: gelegentlich `npm audit fix` / Vite auf eine gepatchte Version heben. Externe Font-CDNs (A-6) bleiben als Supply-Chain-Fläche relevant (idealerweise selbst hosten).

### B-6 · Storage-Bucket-Einstellungen — ✅ erledigt (unkritisch)
Live geprüft: Bucket `encrypted_files` ist **privat** (`public=false`), `file_size_limit = 26214400` (25 MiB, serverseitig — deckt sich mit dem 25-MB-Client-Limit), `allowed_mime_types = null`. Die drei `storage.objects`-Policies sind **deckungsgleich mit `init.sql`** (Upload/Delete nur im eigenen `{uid}/`-Ordner, SELECT via `has_file_access`) — kein Drift. Keine öffentlichen Bucket-Listings. In Ordnung.

### B-7 · Geheimnis-/Konfig-Hygiene
Sicherstellen, dass in Vercel nur `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (öffentlich) gesetzt sind und **kein `service_role`-Key** o. Ä. clientseitig landet. `.env` ist gitignored — Git-History auf versehentlich committete Secrets prüfen.

---

## Priorisierte Remediation-Roadmap

Offene Handlungspunkte (die live-verifizierten B-Punkte B-1/B-4/B-6 waren unkritisch und sind hier nicht mehr gelistet):

| Prio | Maßnahme | Bezug |
|------|----------|-------|
**✅ Erledigt & live in Produktion (PR #10 + dieser PR):**

| Status | Maßnahme | Bezug |
|------|----------|-------|
| ✅ live+verifiziert | **A-4** E-Mail-PII: Frontend liest keine `email` mehr; Migration entzieht tabellenweites SELECT, grantet nur `id, username, public_key, created_at`. Als `authenticated` verifiziert: erlaubte Spalten ok, `email` → `42501`. | A-4 |
| ✅ live | **A-6** `vercel.json` mit strikter CSP + `X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy`/`Permissions-Policy`/HSTS (alle Header live bestätigt) | A-6, B-4 |
| ✅ dieser PR | **A-5** KDF auf 600k PBKDF2 (versioniertes, abwärtskompatibles Blob-Format — Legacy-100k entschlüsselt weiter, per Test verifiziert) + Passwort-Mindestlänge 12 | A-5 |
| ✅ dieser PR | **A-8** `messages`-UPDATE auf Spalte `read_at` eingeschränkt (Migration; App macht kein `.update`) | A-8 |
| ✅ dieser PR | **A-9** Download-Dateiname sanitisiert | A-9 |
| ✅ dieser PR | **A-12** `has_file_access` nutzt intern `auth.uid()` (Orakel geschlossen; Migration + `init.sql`) | A-12 |
| ✅ dieser PR | **A-3** Entsperrter Key nie mehr Klartext at rest: comfort = non-extractable `CryptoKey` in IndexedDB, balanced = AES-GCM-Split (Ciphertext in `sessionStorage`, non-extractable Wrapping-Key in IndexedDB), Stufenwechsel mit Passwort-Neueingabe, Legacy-Migration beim Restore (24 Browser-Tests) | A-3 |
| ✅ live+verifiziert (2026-07-05) | **B-3 Defense-in-Depth**: `email_notification_queue` alle Client-Grants entzogen (RLS war schon deny-all); `key_backups` für `authenticated` auf exakt SELECT/INSERT/UPDATE/DELETE reduziert (owner-scoped via RLS, App braucht alle vier — ein SELECT-Entzug würde `fetchKeyBackup` brechen); schemaweit TRUNCATE/REFERENCES/TRIGGER von `anon`/`authenticated` entzogen (**TRUNCATE unterliegt nicht RLS**); `has_file_access`/`reset_unread_count` EXECUTE von `anon`/`public` entzogen. Als `authenticated` gegengeprüft: `key_backups` weiter abfragbar, Queue-SELECT-Privileg weg, RPCs für `authenticated` intakt. Frischer Advisor-Lauf: keine ERROR, nur bekannte WARNs (GraphQL-Sichtbarkeit RLS-gedeckt, HIBP = Pro-only). | B-3 |

**Noch offen:**

| Prio | Maßnahme | Bezug |
|------|----------|-------|
| 2 | **A-1** Schlüssel-Fingerprint/Verify-Flow gegen Server-MITM (UI + lokales Pinning) | A-1 |
| 3 | **A-2** Nachrichten signieren (Authentizität) — Protokolländerung, neues Signatur-Keypair + Migration | A-2 |
| 3 | Optional HIBP-Passwortabgleich (bräuchte `connect-src`-Ausnahme für `api.pwnedpasswords.com`) | A-5 |
| 3 | E-Mail-Bestätigung/Rate-Limits im Auth-Dashboard prüfen (nur manuell, nicht per MCP sichtbar) | B-2 |
| 4 | Forward Secrecy / Ratcheting evaluieren; Metadaten-Grenze dokumentieren | A-7, A-10 |

---

## Methodik & Umfang

Geprüft wurde der Quellcode des deployten Stands (`main`): `src/lib/crypto.ts`, `src/lib/key-session.ts`, `src/lib/storage.ts`, `src/lib/files.ts`, `src/lib/supabase.ts`, die Auth-Screens, `ChatArea`/`Sidebar`/`FileMessage`, `App.tsx`, die Stores sowie `supabase/init.sql` und die Migrationen. Zusätzlich **live gegen das echte Backend** (Supabase-Projekt `kxbllpwcsqbmqnmwuqyw`, Vercel-Deployment) verifiziert: Security-Advisors, RLS-Policies aller 8 Tabellen, Storage-Bucket/-Policies, HTTP-Header (Teil B, B-1–B-4/B-6). Offen bleiben nur `npm audit`/Dependency-Versionen (B-5), einige Auth-Dashboard-Einstellungen (B-2) und die Secret-Hygiene der Vercel-Env (B-7).

*Dieses Dokument ist eine Momentaufnahme des Code-Reviews und ersetzt keine dynamische Prüfung (Pentest) der laufenden Instanz.*
