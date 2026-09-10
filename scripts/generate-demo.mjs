// Deterministic software illustration. No Ateno hardware or trained 3DGS data.
// Each PNG projects the SAME sampled 3D surfaces with a different camera azimuth.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = fileURLToPath(new URL('../public/demo-frames/', import.meta.url));
const width = 1200, height = 800, count = 32;
const points = [];
let seed = 9417;
const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
const norm = (v) => { const d = Math.hypot(...v); return v.map((x) => x / d); };
const light = norm([-3, 7, 5]);

function point(x, y, z, normal, base, size = .025) {
  const shade = .53 + .42 * Math.max(0, normal.reduce((s, n, i) => s + n * light[i], 0));
  const grain = .93 + random() * .14;
  const color = base.map((c) => Math.round(c * shade * grain));
  points.push({ x, y, z, color, size: size * (.82 + random() * .36) });
}

// Tangent-oriented samples on a turned limestone pedestal.
function disc(radius, y, depth, color) {
  for (let i = 0; i < 9500; i++) {
    const a = random() * Math.PI * 2, r = Math.sqrt(random()) * radius;
    point(Math.cos(a) * r, y, Math.sin(a) * r, [0, 1, 0], color, .031);
  }
  for (let i = 0; i < 4200; i++) {
    const a = random() * Math.PI * 2;
    point(Math.cos(a) * radius, y - random() * depth, Math.sin(a) * radius,
      [Math.cos(a), .1, Math.sin(a)], color, .026);
  }
}
disc(2.22, .16, .18, [165, 159, 143]);
disc(2.04, .30, .14, [194, 183, 161]);

// A sculptural pair of offset stone portals. Sampling the solid boundary gives
// genuine parallax, occlusion and a closed loop, rather than image warping.
function arch({ x: cx, z: cz, angle, scale, color }) {
  const c = Math.cos(angle), s = Math.sin(angle);
  function add(x, y, z, normal) {
    point(cx + scale * (x * c + z * s), .30 + y * scale, cz + scale * (-x * s + z * c),
      [normal[0] * c + normal[2] * s, normal[1], -normal[0] * s + normal[2] * c], color, .028 * scale);
  }
  const inner = .64, outer = 1.04, spring = 1.35, depth = .40;
  // Front and rear faces of the curved voussoirs.
  for (let side of [-1, 1]) {
    for (let i = 0; i < 6600; i++) {
      const a = random() * Math.PI, r = inner + random() * (outer - inner);
      // Thin radial mortar joints make the arch read as masonry.
      const joint = (a / Math.PI * 13) % 1;
      if (joint < .027) continue;
      add(Math.cos(a) * r, spring + Math.sin(a) * r, side * depth / 2, [0, 0, side]);
    }
    for (let leg of [-1, 1]) for (let i = 0; i < 4800; i++) {
      const y = random() * spring;
      if ((y / spring * 5) % 1 < .024) continue;
      add(leg * (inner + random() * (outer - inner)), y, side * depth / 2, [0, 0, side]);
    }
  }
  for (let radius of [inner, outer]) for (let i = 0; i < 3800; i++) {
    const a = random() * Math.PI, sign = radius === inner ? -1 : 1;
    add(Math.cos(a) * radius, spring + Math.sin(a) * radius, (random() - .5) * depth,
      [Math.cos(a) * sign, Math.sin(a) * sign, 0]);
  }
  for (let side of [-1, 1]) for (let radius of [inner, outer]) for (let i = 0; i < 2400; i++) {
    add(side * radius, random() * spring, (random() - .5) * depth, [side * (radius === inner ? -1 : 1), 0, 0]);
  }
}
arch({ x: -.4, z: -.35, angle: -.22, scale: 1.12, color: [221, 196, 158] });
arch({ x: .60, z: .64, angle: 1.0, scale: .76, color: [195, 129, 93] });

await mkdir(output, { recursive: true });
const frames = [];
for (let frame = 0; frame < count; frame++) {
  const azimuth = .42 + frame / count * Math.PI * 2;
  const c = Math.cos(azimuth), s = Math.sin(azimuth), elevation = .32;
  const ce = Math.cos(elevation), se = Math.sin(elevation);
  const cameraDistance = 10, focal = 1340;
  const projected = points.map((p) => {
    const horizontal = p.x * c - p.z * s;
    const forward = p.x * s + p.z * c;
    const vertical = p.y - 1.25;
    const distance = cameraDistance - forward * ce - vertical * se;
    const k = focal / distance;
    return { ...p, distance, px: width / 2 + horizontal * k, py: height / 2 - (vertical * ce - forward * se) * k, r: p.size * k };
  }).sort((a, b) => b.distance - a.distance);
  const splats = projected.map((p) => `<ellipse cx="${p.px.toFixed(2)}" cy="${p.py.toFixed(2)}" rx="${p.r.toFixed(2)}" ry="${(p.r * .83).toFixed(2)}" fill="rgb(${p.color.join(',')})" fill-opacity=".87"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#171b1c"/><ellipse cx="600" cy="544" rx="300" ry="72" fill="#111415"/><ellipse cx="600" cy="544" rx="251" ry="52" fill="#0f1213"/>${splats}</svg>`;
  const name = `frame_${String(frame).padStart(3, '0')}.png`;
  await sharp(Buffer.from(svg)).png({ palette: true, colours: 128, dither: .15, compressionLevel: 9 }).toFile(`${output}${name}`);
  frames.push(name);
  console.log(`Illustrative view ${frame + 1}/${count}`);
}
await writeFile(`${output}frames.json`, JSON.stringify({ kind: 'illustrative-demo', description: 'Software illustration; not Ateno hardware output.', frames }, null, 2) + '\n');
