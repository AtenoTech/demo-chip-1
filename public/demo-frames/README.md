# Illustrative orbit — NOT Ateno hardware output

These PNGs are a deterministic software illustration for learning the viewer's
controls when no hardware captures are installed. They are not a trained Gaussian
scene, an FPGA framebuffer, a hardware benchmark, or a claim about visual quality.

The scene is an architectural maquette: limestone and terracotta arches on a
stepped circular plinth. All views use the same fixed 3D surface samples, lighting,
and geometry, with a rotating camera. Depth-sorted translucent ellipses are
projected in software and rasterized to PNG by Sharp. This provides consistent
parallax, occlusion, and a seamless full orbit without multi-view generation drift.

Regenerate from the repository root:

```bash
npm run generate:demo
```

The generator is `scripts/generate-demo.mjs`. It emits 32 views at 1200 × 800 and
the accompanying `frames.json`. These are asset-generation settings, not measured
hardware specifications. The script only writes into `public/demo-frames/`.

Keep these files separate from `public/frames/`. The site always identifies this
source as “Illustrative demo” and “Not hardware output”.
