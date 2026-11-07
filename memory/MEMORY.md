# valcrypta — Memory

## Projektziel
E2E-verschlüsselter Messenger (React/Vite SPA, Supabase), öffentlich unter AGPL-3.0, `main` deployt automatisch auf Vercel. Code-Map in `CLAUDE.md`.

## Aktueller Stand (2026-11-07)
- Neues Logo: Eulen-Stich (font-revival, MIT) als rundes Favicon/In-App-Logo, PWA-Icon (quadratisch, OS maskiert), Hero-Wasserzeichen und Footer-Ornament. Details und Regeneration: `CLAUDE.md` Abschnitt "Marke / Logo".
- Scroll-Reset beim Wechsel Landing/Login/Signup in `App.tsx`.
- Hero-Untertitel hell auf `porcelain-700` (vorher 600, Kontrast lag unter AA, mit Eule ~3,5:1; jetzt ~5,4:1).
- Chat-Innenraum neu (2026-11-07): Sidebar-Kopf nur Logo + Info + Theme; Einstellungen, Abmelden, Sprache und eigener Nutzername unten in einer Kontozeile. Kontaktliste mit Abschnittslabel und farbigen `Avatar`-Initialen (`src/components/Chat/Avatar.tsx`, Ton aus Nutzername gehasht). TopBar ohne offenen Chat ausgeblendet (nur Admin-Button schwebt rechts oben). Leerzustände zeigen die Eule (`.owl-mark`) statt Icon-Kachel. Platzhalter gekürzt (Suche, Composer).

## Entscheidungen
- Logo-Komponente zeigt `/favicon.svg` als `<img>` (eine Quelle für Tab und App), statt das 23-KB-Pfad-SVG ins JS-Bundle zu ziehen.
- Wasserzeichen per CSS-Maske, damit die Farbe dem Theme folgt; liegt unter dem Bodennebel.
- Features laufen über PRs (Vercel-Preview), nicht direkt auf `main`.
- Kein Seitenstreifen als Aktiv-Markierung (Kontaktliste): aktiver Eintrag = helle Fläche + Hairline-Ring.
- Chat-UI lokal ohne Login prüfen: im Dev-Server per `await import('/src/stores/auth-store.ts')` Store-State setzen (Fake-User + generierter RSA-Key), Kontakte über `chat-store` setzen. Supabase antwortet dann 401, das ist erwartbar.

## Offene Punkte
- `npm audit`: `ws` (über `@supabase/realtime-js`) hat High-Advisories. Nur Node-seitig, nicht im Browser-Bundle. Behebung kommt mit einem Supabase-Update; `npm audit fix` würde die Lockfile breit umwerfen, daher bewusst nicht gemacht.
- 3 alte `react-hooks/exhaustive-deps`-Warnungen (App, ChatArea, Sidebar).
- `.haze-hero::after` (Bodennebel) wird von `.grain::after` überschrieben (gleiches Element, gleiche Spezifität). Optisch derzeit unauffällig, weil `MistHills` den Horizont trägt.

## Stolpersteine
- Cache-first-Service-Worker: nicht gehashte Dateien in `public/` (Icons) brauchen Cache-Bump + `?v=`.
- `.claude/worktrees/` wird von ESLint jetzt ignoriert (sonst doppelte Warnungen aus fremden Worktrees).
