# Ateno orbit frames

To regenerate this sequence, run the orbit script on the AWS F2 instance while the
scene packet is resident in HBM. Decode each framebuffer readout to PNG, name the
files sequentially (`frame_000.png`, `frame_001.png`, and so on), and place them in
this directory.

These files are the real Ateno hardware proof source. Do not place illustrative
samples here; those belong in `public/demo-frames/`.

The viewer first tries the manifest. If it is empty, invalid, stale, missing, or
contains images that cannot be decoded, the viewer probes numbered PNG files in
order and stops at the first missing or unreadable number. Keep the sequence
contiguous. A nonempty, completely decoded hardware sequence is the default source.

For stricter deployment checks, list every filename in `frames.json`:

```json
{
  "frames": ["frame_000.png", "frame_001.png"]
}
```

When the manifest is usable, the viewer decodes and preloads every listed frame
before enabling interaction. This checks image readability, not cryptographic
provenance. Place only genuine hardware captures in this directory.

If no sequence is usable, the viewer opens the separately labeled illustrative
demo. Discovery diagnostics and installation guidance appear under Run details →
Installing hardware output rather than covering the scene.

Visitors can also use Load hardware frames / Load frames to select local PNGs.
These are sorted by numeric filename index, decoded completely, and kept only in
memory using object URLs. Nothing is uploaded or stored. Corrupt selections are
rejected as a batch, with filenames reported and the previous sequence preserved.
Local files carry their own label; the website does not verify their source.
