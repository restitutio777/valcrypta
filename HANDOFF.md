# ValCrypta — Security-Work Handoff (für neue Session)

**Stand:** 2026-07-05 · Vollständiges Review: [`SECURITY-REVIEW.md`](SECURITY-REVIEW.md)

---

## Teil 1 — Erkenntnisse & Status

### Projekt-Fakten
- **Repo:** `restitutio777/valcrypta` · deployt wird `main` → Vercel (`bolteds-projects/valcrypta`) · live: `https://valcrypta.vercel.app`
- **Stack:** React 18 + TS + Vite, Supabase (Auth/Postgres/Realtime/Storage), E2E via Web Crypto (RSA-OAEP-2048 + hybrid AES-GCM).
- **Review-Dokument:** `SECURITY-REVIEW.md` (Befunde A-1…A-12 + Prüfplan B-1…B-7, mit Live-Verifikation).

### ⚠️ Kritische operative Gotchas
1. **Richtiges Supabase-Projekt:** ValCryptas echtes Backend ist Ref **`kxbllpwcsqbmqnmwuqyw`** (`https://kxbllpwcsqbmqnmwuqyw.supabase.co`). Im MCP-Zugriff existiert ein **Täuschungs-Projekt** `auvmdkzulyrvhfylfjpy` (eine *fremde* App, 42 Tabellen) — **nicht benutzen**. Verifizieren: das echte hat `messages/users/contacts/key_backups`.
2. **Spalte verstecken in Postgres:** Ein spaltenweiser `REVOKE SELECT (col)` ist **wirkungslos**, solange die Rolle ein tabellenweites `GRANT SELECT` hat. Korrekt: `REVOKE SELECT ON t FROM authenticated; GRANT SELECT (erlaubte_spalten) ON t TO authenticated;`
3. **Deploy-Reihenfolge:** Jede DB-Migration, die ein Privileg entzieht, das der **aktuell live laufende** Client noch nutzt (z. B. `select('*')`), **bricht** die Live-App. Regel: **erst Frontend deployen, dann Migration** (live verifiziert: `select('*')` → `42501`).
4. **KDF-Blob-Format** (`src/lib/crypto.ts`): neu = JSON `{v:2, iter, salt, iv, ct}`; legacy = base64(`salt|iv|ct`)@100k. `decryptPrivateKey` behandelt beide — **nicht brechen**, sonst Lockout bestehender Accounts.
5. **Gemergter Branch:** PRs #10 & #11 sind gemergt. Für neue Arbeit den Branch **frisch von `main`** aufsetzen (`git fetch origin main && git checkout -B claude/security-review-plan-jjmqlw origin/main`); `--force-with-lease`-Push ist ok (alte History bereits gemergt). Draft-PR erstellen.

### ✅ Erledigt, live & in Prod verifiziert
| Fix | Inhalt |
|---|---|
| **A-4** | E-Mail-PII: Frontend liest nur `id, username, public_key, created_at`; Migration entzieht tabellenweites SELECT auf `users`, grantet nur diese Spalten. `email` → `42501`. |
| **A-6** | `vercel.json`: strikte CSP + HSTS + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy (alle live bestätigt). |
| **A-5** | PBKDF2 100k → **600k** für neue Wraps, versioniertes abwärtskompatibles Blob-Format (Legacy-100k entschlüsselt weiter, per Node-Test bewiesen), Passwort-Mindestlänge **12**. |
| **A-8** | Migration: `messages`-UPDATE auf Spalte `read_at` beschränkt (App macht kein `.update`). Als `authenticated` verifiziert. |
| **A-9** | Download-Dateiname (`FileMessage.tsx`) sanitisiert. |
| **A-12** | `has_file_access` nutzt intern `auth.uid()` statt Parameter (Orakel geschlossen); Storage-Policy + `init.sql` angepasst; alte 2-arg-Funktion entfernt. |
| **A-3** | Entsperrter Key nie mehr Klartext at rest: `persistUnlockedKey` nimmt PKCS8-String; In-Memory-Keys non-extractable; comfort = non-extractable `CryptoKey` in IndexedDB, balanced = AES-GCM-Split (Ciphertext in sessionStorage + non-extractable Wrapping-Key `wrap_<uid>` in IndexedDB); Stufenwechsel fragt Passwort neu ab; Legacy-Klartext wird beim Restore migriert (kein Lockout). |
| **B-3** | Defense-in-Depth-Grants: `email_notification_queue` alle Client-Grants weg; `key_backups` für `authenticated` nur noch SELECT/INSERT/UPDATE/DELETE (App braucht alle vier — SELECT NICHT entziehen, sonst bricht `fetchKeyBackup`); schemaweit TRUNCATE/REFERENCES/TRIGGER von `anon`/`authenticated` entzogen (TRUNCATE unterliegt nicht RLS); RPC-EXECUTE (`has_file_access`, `reset_unread_count`) von `anon`/`public` weg. Als `authenticated` gegengeprüft. |

| **A-1** | TOFU-Key-Pinning (`src/lib/key-pinning.ts`, IndexedDB `pinned_keys`, gerätelokal pro Nutzer; Mismatch überschreibt Pin NICHT); „Schlüssel geändert"-Warnbanner in `ChatArea` mit Sende-Sperre bis zur expliziten Bestätigung; Fingerprint-Prüfmodal in `TopBar` (SHA-256 über SPKI, 16 Hex-Vierergruppen). IndexedDB jetzt v3 über gemeinsamen Öffner `src/lib/db.ts` (Upgrade erhält Bestandsdaten, 34 Browser-Tests). |

Fünf DB-Migrationen sind in Prod angewendet und einzeln als `authenticated`-Rolle gegengeprüft. Bestandskonten können sich weiter anmelden (Legacy-Kompatibilität bewiesen; beide `key_backups`-Blobs sind Legacy-100k-Format, `decryptPrivateKey` liest das weiter).

### 🔓 Offen (nach Priorität)
- **A-2 (Mittel-Hoch, bewusst zurückgestellt 2026-07-05)** — Nachrichten unsigniert → wer Datenbank-Vollzugriff hat (kompromittiertes Supabase-Konto; normale Nutzer nicht, RLS verhindert das), kann Nachrichten einschleusen, die aussehen, als kämen sie vom Kontakt (Social-Engineering-Szenario). **Sinn:** letzter Baustein, damit E2E auch gegen einen komplett übernommenen Server hält (mitlesen ist seit A-1 abgedeckt, fälschen noch nicht). **Einordnung:** Für den privaten 2-Personen-Betrieb Kür, nicht Pflicht — Entscheidung des Betreibers vom 2026-07-05: später. **Aufwand:** ≈ A-3 + A-1 zusammen (eine volle Session): zweites Keypair pro Nutzer (ECDSA P-256), Schlüssel-Blob-Format v3 (beide Keys, abwärtskompatibel!), A-3-Persistenz auf zwei Keys erweitern, Nachrichten-/Datei-Format v3 mit Signatur (alte bleiben lesbar), DB-Migration (users-Spalte für Public-Signing-Key), Signing-Key ins A-1-Pinning aufnehmen, Bestandskonten beim nächsten Login/Unlock nachrüsten (Lockout-Risiko → Versionierung + Browser-Tests wie bisher). Fertiger Start-Prompt: siehe Teil 2.
- **A-7** Forward Secrecy (Design-Grenze) · **A-10** Metadaten serverseitig sichtbar (dokumentieren).
- **B-2** Auth-Dashboard: E-Mail-Bestätigung/Rate-Limits (nur manuell im Supabase-Dashboard; Leaked-Password-Schutz ist Pro-only → auf Free n/a).
- **A-5 optional** HIBP-Passwortabgleich (braucht `connect-src`-Ausnahme für `api.pwnedpasswords.com`).

---

## Teil 2 — Prompt für die neue Session (kopierbar)

```
Kontext: valcrypta ist ein E2E-verschlüsselter Messenger (React/TS/Vite +
Supabase). Ich arbeite an der deployten Version (main → Vercel,
https://valcrypta.vercel.app). Lies zuerst CLAUDE.md, HANDOFF.md und
SECURITY-REVIEW.md im Repo — dort steht das komplette Security-Review
(Befunde A-1…A-12) und der Übergabestand.

Wichtige Fakten, die du übernehmen musst:
- Echtes Supabase-Projekt: Ref kxbllpwcsqbmqnmwuqyw (kxbllpwcsqbmqnmwuqyw.supabase.co).
  Verifiziere über die Supabase-MCP, dass dort die Tabellen messages/users/
  contacts/key_backups liegen. Falls list_projects ein Projekt
  "auvmdkzulyrvhfylfjpy" zeigt: das ist eine FREMDE App, NICHT benutzen.
- Bereits live & verifiziert: A-4, A-5, A-6, A-8, A-9, A-12 (Details + drei
  angewendete DB-Migrationen stehen in SECURITY-REVIEW.md / HANDOFF.md).
- Regel Deploy-Reihenfolge: jede DB-Migration, die ein Privileg entzieht, das
  der Live-Client noch braucht, ERST nach dem Frontend-Deploy anwenden.
- KDF-Blob-Format in src/lib/crypto.ts ist versioniert + abwärtskompatibel
  (v2 JSON vs. legacy base64@100k) — nicht brechen.
- Branch claude/security-review-plan-jjmqlw: PRs #10/#11 sind gemergt; für
  neue Arbeit frisch von origin/main aufsetzen, Draft-PR erstellen.

Aufgabe: Nimm dir A-2 vor (Nachrichten unsigniert → Server kann Nachrichten
im Namen eines Kontakts fälschen/einschleusen). Benötigt: Signatur-Keypair
pro Nutzer (z. B. ECDSA P-256 über WebCrypto, da Ed25519 nicht überall
verfügbar), Public-Signing-Key in `users` veröffentlichen und ins A-1-Pinning
einbeziehen, jede Nachricht signieren, empfängerseitig prüfen; Bestands-
nachrichten bleiben unsigniert lesbar (versioniertes Format wie bisher).
Achtung: Bestandskonten haben noch kein Signatur-Keypair — Erzeugung beim
nächsten Login/Unlock nachziehen. Entwirf zuerst einen Plan und zeig ihn mir
zur Freigabe, bevor du implementierst. Danach: implementieren, typecheck+
build+Test, Draft-PR, mergen, deployen, live verifizieren (Login der 2
Bestandskonten darf NICHT brechen).
```
