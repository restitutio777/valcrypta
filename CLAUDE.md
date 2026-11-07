<!-- BEGIN CODE-MAP -->
# valcrypta — Code-Map
React 18 + TypeScript + Vite SPA, Supabase (Auth/Postgres/Realtime) backend, client-side E2E encryption via Web Crypto API. Build: `npm run build`. Check: `npm run typecheck` / `npm run lint`. Dev: `npm run dev`.

## Where things live
- Entry point: [src/main.tsx](src/main.tsx) -> [src/App.tsx](src/App.tsx) — top-level auth/session routing (landing/login/signup vs chat)
- Crypto core: [src/lib/crypto.ts](src/lib/crypto.ts) — RSA-OAEP 2048 keypair gen, PBKDF2+AES-GCM private-key wrapping, hybrid message encryption (AES-GCM content key RSA-wrapped for recipient `rk` and sender `sk`; legacy v1 = RSA-direct)
- Local key storage: [src/lib/storage.ts](src/lib/storage.ts) — IndexedDB wrapper for the encrypted private key blob
- Supabase client + DB types: [src/lib/supabase.ts](src/lib/supabase.ts) — `users`/`messages`/`contacts` table types
- State (Zustand): [src/stores/auth-store.ts](src/stores/auth-store.ts) (user/keys), [src/stores/chat-store.ts](src/stores/chat-store.ts) (messages/contacts), [src/stores/ui-store.ts](src/stores/ui-store.ts) (dark mode/sidebar/notifications/language, persisted)
- Translations: [src/locales/](src/locales) — `de.ts` (canonical `Copy` shape), `en.ts`, `fr.ts`, aggregated in `index.ts`; components read the active language via `useCopy()` in [src/lib/use-copy.ts](src/lib/use-copy.ts), which pulls the `language` field from `ui-store.ts`
- Auth screens: [src/components/Auth/SignupPage.tsx](src/components/Auth/SignupPage.tsx), [src/components/Auth/LoginPage.tsx](src/components/Auth/LoginPage.tsx)
- Chat UI: [src/components/Chat/ChatLayout.tsx](src/components/Chat/ChatLayout.tsx) (shell), [src/components/Chat/Sidebar.tsx](src/components/Chat/Sidebar.tsx) (contacts/search), [src/components/Chat/ChatArea.tsx](src/components/Chat/ChatArea.tsx) (send/receive + Realtime subscription), [src/components/Chat/TopBar.tsx](src/components/Chat/TopBar.tsx)
- DB schema: [supabase/init.sql](supabase/init.sql) — base tables + RLS policies, plus incremental hardening in `supabase/migrations/`; applied via the Supabase SQL editor (see [SETUP.md](SETUP.md))
- Env vars: `.env.example` lists required `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (actual `.env` is gitignored)

## Common tasks -> start here
- Change encryption/key-wrapping logic -> [src/lib/crypto.ts](src/lib/crypto.ts)
- Change DB schema/RLS -> [supabase/init.sql](supabase/init.sql), apply via Supabase SQL editor
- Add/modify a table's TS shape -> [src/lib/supabase.ts](src/lib/supabase.ts) `Database` type
- Message send/receive/decrypt flow -> [src/components/Chat/ChatArea.tsx](src/components/Chat/ChatArea.tsx)
- Contact search/add -> [src/components/Chat/Sidebar.tsx](src/components/Chat/Sidebar.tsx)
- Signup/login key handling -> [src/components/Auth/SignupPage.tsx](src/components/Auth/SignupPage.tsx) / [src/components/Auth/LoginPage.tsx](src/components/Auth/LoginPage.tsx)
- Global/session state -> [src/stores/](src/stores)
- Deployment: `main` auto-deploys to Vercel from the GitHub repo
<!-- END CODE-MAP -->

<!-- cloud-local-sync -->
## Cloud ↔ Local: immer überall up to date

Der Betreiber arbeitet in diesem und anderen Projekten mal lokal, mal als Cloud-Session (Claude Code on the web). Beide Seiten sollen immer denselben Stand haben:

- Am Session-Start `git pull` — auf dem neuesten Stand beginnen.
- Am Ende jeder Arbeitsphase / vor Sessionende alles committen und pushen. Nichts Wichtiges nur uncommitted lokal liegen lassen.
- Cloud-Sessions sehen NUR den Git-Stand: keine uncommitteten Änderungen, NICHT das lokale Auto-Memory unter `~/.claude/`. Was die andere Seite wissen muss, gehört committet in versionierte Dateien (CLAUDE.md, ggf. `memory/`, Docs, Code).

## Marke / Logo
- Logo = Eulen-Stich "Perched owl" (Baltimore 1832) von font-revival.com, MIT, (c) 2026 Harold Lehmann. Quelle: [public/owl.svg](public/owl.svg) (einfarbig, `<metadata>` mit Copyright drinlassen). Credit steht im Landing-Footer (`landing.credits` in den Locales).
- Daraus generiert: `public/favicon.svg` (zugleich Logo-Bild in [ValCryptaLogo.tsx](src/components/ValCryptaLogo.tsx)) und alle PWA-PNGs: `npm i --no-save sharp && node scripts/generate-icons.mjs`. Farben: Messing-Verlauf `#ECD7A6 -> #B8924A` auf Tinte `#0B0F19..#222B40`.
- Hero-Wasserzeichen: `.owl-watermark` in [src/index.css](src/index.css) nutzt `owl.svg` als CSS-Maske (Deckkraft 5,5 % hell / 5 % dunkel).
- Icon-Wechsel: Query `?v=N` in `index.html`, `manifest.webmanifest`, `ValCryptaLogo.tsx` hochzählen und `CACHE` in `public/sw.js` bumpen, sonst liefert der Cache-first-Service-Worker die alten Icons weiter.
