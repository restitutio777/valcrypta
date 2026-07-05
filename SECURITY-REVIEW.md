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

### A-3 · Hoch · Entsperrter Private Key liegt im Klartext (unverschlüsselt) at rest
**Ort:** `src/lib/key-session.ts:79-93` (`persistUnlockedKey`)

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

**Empfehlung:** Iterationszahl erhöhen (≥ 600 000) oder auf **Argon2id** (WASM) wechseln; Salt-Länge ist mit 16 Byte ok. Passwortpolicy verschärfen (Mindestlänge ~12, Bruch-Check via k-Anonymity/HIBP-Range-API oder lokale Liste), und Nutzer bei aktivem Cloud-Backup gezielt auf die Passwortstärke hinweisen.

### A-6 · Mittel · Keine Content-Security-Policy; Runtime-Abhängigkeit von externen CDNs
**Ort:** `index.html` (kein CSP-Meta), kein `vercel.json`/`public/_headers`; externe Fonts von `api.fontshare.com`, `cdn.fontshare.com`, `fonts.googleapis.com`, `fonts.gstatic.com`

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

---

## Teil B — Prüfplan (nur an laufender Instanz / im Betrieb verifizierbar)

Diese Punkte lassen sich aus dem Repo **nicht** abschließend beurteilen und müssen aktiv verifiziert werden. Empfohlen: über die Supabase-MCP-Tools bzw. das Dashboard.

### B-1 · RLS der produktiven Zusatztabellen (hohe Priorität)
`supabase/init.sql:253-256` weist ausdrücklich darauf hin, dass in Produktion weitere Tabellen existieren, die **nicht im Repo** sind:
`typing_status`, `unread_counts`, `notification_settings`, `email_notification_queue`.
Diese sind **ungeprüft**. Besonders `email_notification_queue` kann Metadaten (wer-schrieb-wem, wann) und E-Mail-Adressen enthalten.
**Zu tun:** `list_tables` + `get_advisors(type=security)`; für jede Tabelle prüfen: RLS aktiv? Policies korrekt (owner-scoped)? Trigger/Funktionen `SECURITY DEFINER` mit gepinntem `search_path`? Wird dort Klartext gespeichert?

### B-2 · Supabase-Auth-Konfiguration
- E-Mail-Bestätigung aktiv? (Der Signup-Code erwartet eine sofortige Session — deutet auf **deaktivierte Bestätigung** hin → Account-Squatting/Spam möglich.)
- „Leaked Password Protection" aktiv?
- Rate-Limits für Login/Signup/OTP.
- JWT-Ablaufzeit, Refresh-Token-Rotation.
- Zulässige Redirect-URLs / Site-URL korrekt eingegrenzt.

### B-3 · Supabase Security Advisors
`get_advisors(type=security)` und `(type=performance)` laufen lassen; alle „security"-Findings adressieren (fehlende RLS, `SECURITY DEFINER`-Views, exponierte Extensions etc.).

### B-4 · HTTP-Security-Header live prüfen
Response-Header der Vercel-Deployment prüfen (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`). Aktuell erwartungsgemäß **nicht gesetzt** (kein `vercel.json`/`_headers`) — s. A-6.

### B-5 · Dependency-/Supply-Chain-Audit
`npm audit` / `npm outdated` ausführen; `@supabase/supabase-js`, `vite`, `zustand`, `lucide-react`, `react` auf bekannte CVEs prüfen. Lockfile-Integrität sicherstellen. Externe Font-CDNs (A-6) als Supply-Chain-Fläche bewerten.

### B-6 · Storage-Bucket-Einstellungen
Bestätigen, dass `encrypted_files` **privat** ist (SQL sagt `public=false`) und keine öffentlichen/signierten URLs mit zu langer Gültigkeit erzeugt werden. Max. Objektgröße/Bucket-Limits serverseitig (Client erzwingt nur 25 MB).

### B-7 · Geheimnis-/Konfig-Hygiene
Sicherstellen, dass in Vercel nur `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (öffentlich) gesetzt sind und **kein `service_role`-Key** o. Ä. clientseitig landet. `.env` ist gitignored — Git-History auf versehentlich committete Secrets prüfen.

---

## Priorisierte Remediation-Roadmap

| Prio | Maßnahme | Bezug |
|------|----------|-------|
| 1 | E-Mail-PII aus der breiten `users`-SELECT-Policy entfernen | A-4 |
| 1 | RLS der produktiven Zusatztabellen prüfen/absichern | B-1 |
| 1 | Strikte CSP + Security-Header (`vercel.json`/`_headers`) | A-6, B-4 |
| 2 | Entsperrten Key non-extractable speichern statt Klartext-PKCS8 | A-3 |
| 2 | Schlüssel-Fingerprint/Verify-Flow gegen Server-MITM | A-1 |
| 2 | KDF härten (≥600k PBKDF2 / Argon2id) + Passwortpolicy | A-5 |
| 2 | Supabase-Auth-Konfig + Advisors prüfen | B-2, B-3 |
| 3 | Nachrichten signieren (Authentizität) | A-2 |
| 3 | `messages`-UPDATE auf `read_at` einschränken | A-8 |
| 3 | Dependency-Audit, Dateinamen sanitisieren, Metadaten-Grenze dokumentieren | B-5, A-9, A-10 |
| 4 | Forward Secrecy / Ratcheting evaluieren | A-7 |

---

## Methodik & Umfang

Geprüft wurde der Quellcode des deployten Stands (`main`): `src/lib/crypto.ts`, `src/lib/key-session.ts`, `src/lib/storage.ts`, `src/lib/files.ts`, `src/lib/supabase.ts`, die Auth-Screens, `ChatArea`/`Sidebar`/`FileMessage`, `App.tsx`, die Stores sowie `supabase/init.sql` und die Migrationen. Nicht geprüft (weil nicht im Repo bzw. nur live verifizierbar): produktive Zusatztabellen, Supabase-Projektkonfiguration, Vercel-Header, installierte Dependency-Versionen — siehe Teil B.

*Dieses Dokument ist eine Momentaufnahme des Code-Reviews und ersetzt keine dynamische Prüfung (Pentest) der laufenden Instanz.*
