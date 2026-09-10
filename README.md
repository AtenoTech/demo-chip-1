# Ateno hardware renderer demo

A static React viewer for pre-rendered 3D Gaussian Splatting framebuffer captures.
A common orbit viewer displays bundled Ateno hardware frames, session-only local
PNGs, or a clearly labeled illustrative sample. It supports pointer, touch and
keyboard controls and presents the measured hardware validation separately from
the illustrative and unverified local sources.

## Run locally

```bash
npm install
npm run dev
```

Place the hardware-rendered sequence in `public/frames/`. See
[`public/frames/README.md`](public/frames/README.md) for the expected naming and
optional manifest format.

Without hardware files the viewer automatically opens a coherent illustrative
orbit. Generate its separate static assets with `npm run generate:demo`; see
[`public/demo-frames/README.md`](public/demo-frames/README.md). No real hardware
frames are currently bundled.

Source identity changes atomically with the displayed sequence. Local uploads use
decoded images and object URLs without browser storage or transmission. Replacing,
removing or abandoning a local selection releases the URLs. Source switching
cancels older loading requests so late results cannot overwrite the current source.

## Validation

```bash
npm run lint
npm run build
npm test
```

Browser checks cover the requested hardware/demo/local scenarios, invalid and stale
manifests, corrupt uploads, numeric sorting, URL cleanup, cancellation, source
identity during loading, keyboard and touch orbit, spin/reset, tutorial replay,
reduced motion and desktop/mobile layout. Hardware tests use in-memory transport
fixtures; no synthetic PNGs are shipped in `public/frames/`.
On macOS the tests use installed Google Chrome. Elsewhere, install Playwright's
Chromium or set `CHROME_PATH` to an installed Chrome executable.

## Brand and supporting artwork

The logo is derived from `public/favicon.ico`. The package illustration uses
`public/ateno-ax.jpg` as its reference. Both user-supplied originals are retained.
Supporting artwork is labeled as illustration and is separate from hardware output.
See [asset provenance and prompts](src/assets/README.md).
