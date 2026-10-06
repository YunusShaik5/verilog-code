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

Restore dependencies with `bash setup-vendor.sh`, then run `node tests/labs.mjs`.
This checks all 71 self-checking testbenches with the bundled Icarus simulator and synthesizes every design with Yosys. It also checks the downloadable collection against the catalog.
For DOM interaction tests, install `happy-dom` locally without committing dependencies and run `node tests/ui.mjs`, or set `SIGNAL_DOM_TEST_MODULE` to its module entry file.

## Run locally

The third-party WebAssembly runtime is stored as split archive parts so the complete project can be uploaded reliably.

```bash
chmod +x setup-vendor.sh
./setup-vendor.sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Do not open `index.html` directly from Finder because browser workers and WebAssembly require an HTTP server.

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

The included `vercel.json` runs `build-vercel.sh`, restores the WebAssembly dependencies, and publishes the generated `public/` directory.

To deploy automatically when changes are pushed to GitHub, connect this repository under the Vercel project's **Settings > Git**. Until GitHub is connected, deploy manually from the project root with `npx vercel --prod`.
