# Verification — 13 October 2026

## Passed locally

- `npm test`: seven SQL/build/waveform regression tests plus account and lab UI suites.
- `npm run test:labs`: all **71/71** reference programs pass their self-checking
  Icarus Verilog simulation and Yosys synthesis.
- `npm run build`: produces the static site and bundled Supabase client.
- `node tests/browser.mjs`: Chromium drives the built website with the real
  Supabase browser SDK, local PostgreSQL WASM database, and actual Verilog WASM
  engines. Only the OAuth/authentication HTTP transport is a test fixture.

The browser test verifies the signed-out setup screen, username registration and
case-insensitive duplicate rejection, new file, save, reload/reopen, rename,
storage allocation/meter, waveform playback, circuit generation, desktop/mobile
layout, sign-out clearing, and a second account's empty private file list.

Database tests check anonymous denial, non-Google identity denial, cross-account
read/write/delete denial, direct-write denial, unique names, UTF-8 storage quotas,
file size limits, and stale-version rejection. Account tests also check that a
late save cannot attach a new draft to a previously opened private file.

Waveform regression cases include a commented-out `$dumpvars` directive, `$stop`
without an interactive terminal, sub-nanosecond time labels, and generated
stimulus exercising upper bits instead of just values 0–31.

## Still required before live release

- Configure a Supabase project and run the migration in `ACCOUNT_SETUP.md`.
- Enable Google OAuth and register the correct callback and site URLs.
- Set the two public account environment variables in the existing Vercel project.
- Restore access to that Vercel project: the connected account returned “Project
  not found” and its project list contained no matching Verilog project.
- Deploy and complete the two-real-account acceptance steps in `ACCOUNT_SETUP.md`.

No live Google login, cloud database migration, or production deployment is claimed
by this report. Production builds deliberately fail if account configuration is
missing, preserving the previously deployed version.
