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

Drei DB-Migrationen sind in Prod angewendet und einzeln als `authenticated`-Rolle gegengeprüft. Bestandskonten können sich weiter anmelden (Legacy-Kompatibilität bewiesen).

### 🔓 Offen (nach Priorität)
- **A-1 (Hoch)** — Kein Key-Verify → Server-MITM. Kontakt-Public-Key wird in `ChatArea.tsx` ungeprüft aus `users` geladen. Braucht Fingerprint-UI + lokales Pinning + „Schlüssel geändert"-Warnung.
- **A-2 (Mittel-Hoch)** — Nachrichten unsigniert → Server kann fälschen/einschleusen. Braucht Signatur-Keypair pro Nutzer + Nachrichtenformat-Migration.
- **A-7** Forward Secrecy (Design-Grenze) · **A-10** Metadaten serverseitig sichtbar (dokumentieren).
- **B-2** Auth-Dashboard: E-Mail-Bestätigung/Rate-Limits (nur manuell im Supabase-Dashboard; Leaked-Password-Schutz ist Pro-only → auf Free n/a).
- **B-3** Defense-in-Depth: `REVOKE SELECT` auf `key_backups`/`email_notification_queue` von `authenticated`.
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

Aufgabe: Nimm dir A-3 vor (Private Key im Klartext at rest). Beachte den
Design-Blocker: persistUnlockedKey (src/lib/key-session.ts) braucht aktuell
einen extrahierbaren In-Memory-Key für den Stufenwechsel-Flow
(SecuritySettingsModal → persistUnlockedKey → exportPrivateKey). Entwirf zuerst
einen Plan, wie der entsperrte Key non-extractable at rest gespeichert werden
kann, ohne den Stufenwechsel zu brechen (z. B. non-extractable CryptoKey-Objekt
in IndexedDB für "comfort" + Passwort-Neueingabe/Re-Wrap beim Stufenwechsel;
"balanced" separat, da sessionStorage kein CryptoKey speichern kann). Zeig mir
den Plan zur Freigabe, bevor du implementierst. Danach: implementieren,
typecheck+build+Test, Draft-PR, mergen, deployen, live verifizieren (Login der
2 Bestandskonten darf NICHT brechen).
```
