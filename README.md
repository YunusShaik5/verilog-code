# Signal — Verilog Lab

A browser-based Verilog playground with real compilation and simulation, generated circuit diagrams, and animated timing waveforms.

## Features

- Verilog/SystemVerilog editor
- Icarus Verilog WebAssembly simulation
- Yosys-generated circuit diagrams
- Animated waveforms with play, pause, and timeline controls
- Ready-to-run examples and automatic testbench generation
- Local downloads for code, diagrams, and waveform data
- **71 lab-sheet reference programs** covering all 10 practical labs, solved examples, main exercises, and additional exercises from the 2024 DSD manual

## Private workspaces and Google sign-in

See [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md) to connect Google login and private storage
before deploying this release. All users sign in, then choose a unique username.
**New file**, **Save**, **Save as**, and **My private files** manage named programs.
Each program includes design and testbench source. Saved files autosave; drafts
remain in memory until saved. Storage starts at 5 MiB per account and can be set
from 1–10 MiB. Other users cannot read or modify your programs.

## Lab sheet programs

Click **Lab sheet programs** in the sidebar (on a phone, first open ☰).
Filter by lab or section, search for a topic, then choose **Load & run**.
The design and self-checking testbench load together; edited work is protected by a confirmation dialog.

- [all-lab-programs.md](all-lab-programs.md) contains the complete code collection and testbenches in one readable file.
- [lab-programs.js](lab-programs.js) is the website's single source of truth for the collection.
- **Download all programs** exports the complete Markdown collection; individual **Download .v** buttons export one design and its testbench.

These are original reference solutions, not an official answer key or a verbatim copy of the manual. They cover Labs 1–10; the manual's Lab 11 entry is its references list. Manual inconsistencies, reset/shift conventions, forbidden SR states, and don't-care inputs are noted beside the affected programs. Follow your course's independent-work requirements.

Individual exported `.v` files can be run with `iverilog -g2012 -s tb -o simulation program.v` followed by `vvp simulation`. Do not concatenate all the testbenches into one simulation.

## Verify changes

```bash
npm ci
npm test
npm run test:labs
```

Tests cover database ownership restrictions, username and filename uniqueness,
quotas, stale-save rejection, account switching, private-file controls, waveform
recording and timing, generated input coverage, and all 71 lab simulations.
Live Google consent/callback testing requires the setup above.

## Run locally

Set the public account settings described in [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md),
then build and serve the generated site:

```bash
npm run build
python3 -m http.server 8000 --directory public
```

Open <http://localhost:8000>. Without account settings, the sign-in screen explains
that setup is required. Browser workers and WebAssembly require an HTTP server.

## Project structure

- `index.html` — application shell
- `styles.css` — responsive interface styling
- `app.js` — editor, diagrams, waveforms, and UI logic
- `core.js` — waveform and simulation helpers
- `examples.js` — built-in Verilog examples
- `engine.js` / `engine-worker.js` — compilation and simulation worker
- `vendor-archive/` — split third-party runtime archive
- `setup-vendor.sh` — restores the `vendor/` directory

Third-party licenses are listed in `THIRD_PARTY_NOTICES.txt` and restored under `vendor/licenses/`.

## Deploy to Vercel

Live app: <https://verilog-code.vercel.app>.

Configure Google/Supabase using [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md) first.
The included `vercel.json` runs `build-vercel.sh`, restores the WebAssembly dependencies, and publishes the generated `public/` directory.

To deploy automatically when changes are pushed to GitHub, connect this repository under the Vercel project's **Settings > Git**. Until GitHub is connected, deploy manually from the project root with `npx vercel --prod`.
