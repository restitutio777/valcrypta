# ValCrypta

A browser-based, end-to-end encrypted messenger. Messages and file attachments
are encrypted in the browser with the Web Crypto API before they ever reach the
server, so the backend stores only ciphertext. Built as a learning / hobby
project, not a hardened production communications tool.

**This is not a substitute for an audited, professionally maintained secure
messenger (Signal, etc.). Read the "Security model and its limits" section
below before trusting it with anything sensitive.**

## What it does

- **Client-side E2E encryption.** A per-user RSA-OAEP 2048 keypair is generated
  in the browser. Each message/file gets a fresh AES-GCM-256 content key, which
  is RSA-wrapped separately for the recipient and the sender (hybrid scheme). The
  server sees only ciphertext.
- **Password-protected private key.** The private key is wrapped with a key
  derived from your password via PBKDF2-HMAC-SHA256 (600k iterations) + AES-GCM
  before it is stored or (optionally) backed up. The server never sees your
  password or your unwrapped key.
- **Row-Level Security everywhere.** Postgres RLS restricts every table so a
  signed-in user can only read their own messages, contacts, and key backup.
  Encrypted file objects are gated by a `SECURITY DEFINER` access check.
- **Encrypted file & image sharing**, with the original filename and MIME type
  kept inside the encrypted payload (never in plaintext columns or object paths).

## Security model and its limits

E2E encryption here means: **the server operator cannot read your message
content.** It does **not** mean the tool is safe against all adversaries. Known,
deliberate limitations of the current design:

- **No key verification / no safety numbers.** A contact's public key is fetched
  from the server and trusted as-is. A malicious or compromised server could
  substitute keys and mount a man-in-the-middle attack. There is no fingerprint
  comparison UI yet.
- **Messages are not signed.** Authenticity is not cryptographically guaranteed;
  a compromised server could inject or alter ciphertext framing.
- **No forward secrecy.** Long-lived RSA keys are used without ratcheting. If a
  private key (or the password protecting it) is ever compromised, past and
  future messages can be decrypted. There is no Signal-style Double Ratchet.
- **The unlocked private key lives on the client.** Depending on the chosen
  "security level", the decrypted key may be held in browser storage for
  convenience. Anyone with code execution on your device (malware, a malicious
  browser extension, or an XSS bug) could read it. There is a strict
  Content-Security-Policy as defense-in-depth, but a compromised client is
  outside the threat model.
- **Metadata is visible to the server.** Who talks to whom, when, message sizes,
  and timestamps are stored in plaintext. Only the *content* is encrypted.
- **No protection against client-side scanning or a compromised endpoint.**
  Encryption protects data in transit and at rest on the server. It cannot
  protect a message that is read on the device before it is encrypted or after
  it is decrypted.
- **Not independently audited.** The cryptography is standard Web Crypto
  primitives used in a reasonable way, but this code has not had a professional
  security audit.

If your threat model includes a hostile server operator, a targeted attacker, or
anyone whose reach extends to your device, use an audited tool such as Signal
instead.

## Tech stack

React 18 + TypeScript + Vite, Supabase (Auth / Postgres / Realtime), Web Crypto
API. See [CLAUDE.md](CLAUDE.md) for a code-map of where things live.

## Getting started

1. Create a Supabase project and apply the schema in
   [`supabase/init.sql`](supabase/init.sql) plus the migrations under
   [`supabase/migrations/`](supabase/migrations/). See [SETUP.md](SETUP.md) for
   step-by-step instructions.
2. Copy `.env.example` to `.env` and fill in your project's
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key is meant to be
   public and ships in the client bundle; **never** put a `service_role` key in
   the frontend or in this repo.
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Build with `npm run build`; check with `npm run typecheck` and `npm run lint`.

## Reporting security issues

Please see [SECURITY.md](SECURITY.md). Do not open a public issue for
vulnerabilities.

## License

Licensed under the GNU Affero General Public License v3.0 — see
[LICENSE](LICENSE). If you run a modified version as a network service, the AGPL
requires you to offer its source to your users.

Copyright (C) 2026 ValCrypta contributors.
