# Ateno assets

## Brand source

`../../public/favicon.ico` is the authoritative Ateno mark. `ateno-mark.svg` is a
monochrome vector tracing of its circular silhouette and two rounded bars. It is
used at header, compact, empty-state, and pipeline sizes. The original ICO remains
the browser favicon. The lowercase wordmark follows the supplied AX reference.

## Final raster assets

- `ateno-ax-package.webp`: 1440 × 960, generated using the built-in image-generation
  tool with `../../public/ateno-ax.jpg` and the actual ICO as references. The caption
  identifies it as an illustration based on the AX reference. It is supporting
  artwork, not a photograph documenting the validated hardware.
- `gaussian-courtyard.webp`: 960 × 640, generated using the built-in image-generation
  tool. A conceptual finished Gaussian scene, explicitly labeled as an illustration,
  never used in the framebuffer viewer.

Images were converted to optimized WebP using Sharp. No raster data is embedded
directly in React. The rendering pipeline in `../components/RenderingPipeline.jsx`
uses original SVG line illustrations and responsive HTML labels.

## Final package prompt

Use case: product-mockup. Create a refined, high-resolution hardware illustration
for Ateno's website based faithfully on Image 1, the user's Ateno AX chip reference.
Image 2 is the official logo favicon reference. Preserve the brand identity exactly:
two horizontal pill-shaped rounded bars stacked vertically, the upper bar shorter
than the lower, and the lowercase word 'ateno' below, with 'AX' underneath. The mark
ON THE CHIP is the two solid light bars without the favicon's circular background.
NO lightning bolt, NO alternative logo. Subject: the same square graphite Ateno AX
package installed on a dark printed circuit board with believable capacitors and
metallic traces as in Image 1. Keep package proportions, central brand positioning
and restrained industrial product-photography character. Gently elevated
near-overhead three-quarter view, chip face legible, small subdued lavender rim
reflection only, no neon/glow or cyberpunk. Physically plausible matte graphite,
fine texture, modest silver label printing, muted metallic contacts. Wide 3:2
composition, central package takes about half the image width with surrounding dark
PCB in soft focus. Background board extends to all edges. No text except exact
'ateno' and 'AX', no fake specifications, no extra logos, no output scenes. This is
a supporting design illustration based on the provided AX reference, not proof of
fabricated silicon or a framebuffer. Elegant macro photograph-style rendering,
clear fine detail, soft studio light.

## Final Gaussian scene prompt

Use case: scientific-educational. Asset: a small supporting illustration for Ateno's
rendering pipeline, NOT hardware framebuffer output. Create a restrained beautiful
visualization of a FINISHED 3D Gaussian scene: a recognizable sunlit terracotta
courtyard with a single stone archway, a potted olive tree and warm limestone floor,
all constructed entirely from many thousands of translucent soft ellipsoidal splat
primitives. Every part including stone and leaves should visibly consist of
overlapping oriented oval splats, with a few sparse ellipses at the edges; dense
enough in the center to see the courtyard's shape. Isometric-ish three-quarter
view, freestanding scene crop like a scientific specimen, floating on a solid dark
graphite background #111416. Warm sandy, terracotta and muted olive colors, elegant
natural lighting, no neon. Composition centered, landscape 3:2. No photos or cameras,
no progression from photos, no particles emanating from a chip, no people, no text,
no labels, no numbers, no logos, no UI. This represents an already prepared Gaussian
cloud waiting to be rendered, not scene creation or reconstruction. Sharp
high-quality educational illustration.
