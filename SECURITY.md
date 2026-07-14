# Security Policy

ValCrypta is a hobby / educational end-to-end encrypted messenger. It has **not**
been independently audited, and it has known design limitations that are
documented in the "Security model and its limits" section of the
[README](README.md). Please read those before assessing risk.

## Reporting a vulnerability

Please report security issues **privately**, not through public issues or pull
requests.

- Preferred: use GitHub's private vulnerability reporting — the **Security** tab
  of this repository → **Report a vulnerability**. This keeps the report private
  until a fix is available.

When reporting, please include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept, if you have one.
- The affected file(s) / area, and any suggested remediation.

This is a volunteer project, so there is no guaranteed response time and no bug
bounty. Coordinated, responsible disclosure is appreciated: please give a
reasonable window to address an issue before disclosing it publicly.

## Scope

In scope: the application code in this repository (client-side cryptography,
authentication flow, Supabase Row-Level Security policies, storage access
checks).

Out of scope (by design, see the README): a compromised client device, malicious
browser extensions, endpoint compromise, the trust-on-first-use assumption for a
contact's initial key, lack of message-level signatures, lack of forward
secrecy, and server-visible metadata. These are acknowledged limitations rather
than reportable bugs, though concrete improvements to them are very welcome as
pull requests or design proposals.
