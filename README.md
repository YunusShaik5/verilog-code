# Signal — Verilog Lab

A browser-based Verilog playground with real compilation and simulation, generated circuit diagrams, and animated timing waveforms.

## Features

- Verilog/SystemVerilog editor
- Icarus Verilog WebAssembly simulation
- Yosys-generated circuit diagrams
- Animated waveforms with play, pause, and timeline controls
- Ready-to-run examples and automatic testbench generation
- Local downloads for code, diagrams, and waveform data

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

Import this repository into Vercel. The included `vercel.json` runs `build-vercel.sh`, restores the WebAssembly dependencies, and publishes the generated `public/` directory.

Temporary preview: <https://temporary-spry-saffron-gyak2xn.vercel.app> (expires after 60 minutes unless claimed).
