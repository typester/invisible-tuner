# Invisible Tuner

A chromatic tuner for [Even Realities](https://www.evenrealities.com/) smart glasses. Detects pitch from the glasses' microphone and displays the nearest note, reference frequency, and cent deviation on the heads-up display.

<p align="center">
  <img src="screenshot.jpg" alt="Invisible Tuner running in the Even Hub simulator" width="600" />
</p>

## Install on Even G2

Scan this QR code with the Even App to load the app on your glasses:

<p align="center">
  <img src="public/qrcode.png" alt="QR code to load Invisible Tuner on Even G2" width="200" />
</p>

## Prerequisites

- Node.js >= 20
- Rust toolchain with `wasm32-unknown-unknown` target
- [wasm-pack](https://rustwasm.github.io/wasm-pack/)

## Setup

```bash
npm install
npm run wasm:build
```

## Development

```bash
# Start Vite dev server + Even Hub simulator
npm run dev:sim
```

Or run them separately:

```bash
npm run dev   # Vite dev server on http://localhost:5173
npm run sim   # Even Hub simulator pointing to the dev server
```

## Build

```bash
npm run build         # Build for GitHub Pages
npm run pack          # Build and package as .ehpk for Even Hub
```

## Project structure

```
src/
  main.ts          Entry point — bridges audio events to pitch detection and display
  audio-buffer.ts  Buffers PCM frames into analysis-sized chunks
  tuner-ui.ts      Pure functions for rendering note/cents text and gauge
wasm-tuner/
  src/lib.rs       YIN pitch detection algorithm (Rust → WebAssembly)
```

## License

MIT
