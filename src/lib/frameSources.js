// Loading is independent of the viewer. Only decoded, complete sequences are
// committed; the active source and its identity always change together.
const filenameOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const abortError = () => new DOMException('Loading cancelled', 'AbortError');

export function decodeImage(src, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      image.onload = image.onerror = null;
      if (error) { image.src = ''; reject(error); }
      else resolve(image);
    };
    const onAbort = () => finish(abortError());
    const timer = setTimeout(() => finish(new Error('Image did not finish loading')), 15000);
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener('abort', onAbort, { once: true });
    image.onload = async () => {
      try { await image.decode(); finish(); }
      catch { finish(new Error('Image could not be decoded')); }
    };
    image.onerror = () => finish(new Error('Image is missing or unreadable'));
    image.src = src;
  });
}

async function readManifest(root, signal) {
  const response = await fetch(`${root}frames.json`, { cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) });
  if (!response.ok) throw new Error('No usable manifest');
  const data = await response.json();
  const names = Array.isArray(data) ? data : data?.frames;
  if (!Array.isArray(names) || !names.length || names.some((name) => typeof name !== 'string' || !/^frame_\d+\.png$/i.test(name)) || new Set(names).size !== names.length) {
    throw new Error('No usable manifest');
  }
  return [...names].sort(filenameOrder.compare);
}

export async function preload(entries, onProgress, signal, load = decodeImage) {
  const frames = new Array(entries.length);
  const failures = [];
  let cursor = 0, completed = 0;
  onProgress({ loaded: 0, total: entries.length });
  await Promise.all(Array.from({ length: Math.min(4, entries.length) }, async () => {
    while (cursor < entries.length) {
      if (signal.aborted) throw abortError();
      const index = cursor++;
      try { frames[index] = await load(entries[index].src, signal); }
      catch {
        if (signal.aborted) throw abortError();
        failures.push(entries[index].name);
      }
      completed++;
      onProgress({ loaded: completed, total: entries.length });
    }
  }));
  return { frames: frames.filter(Boolean), failures: failures.sort(filenameOrder.compare) };
}

export async function loadBundled(onProgress, signal) {
  const root = `${import.meta.env.BASE_URL}frames/`;
  const cache = new Map();
  const load = (src) => {
    if (!cache.has(src)) cache.set(src, decodeImage(src, signal));
    return cache.get(src);
  };
  let note = '';
  try {
    const names = await readManifest(root, signal);
    const result = await preload(names.map((name) => ({ name, src: root + name })), onProgress, signal, load);
    if (!result.failures.length) return { frames: result.frames, note };
    note = `Manifest files unavailable: ${result.failures.join(', ')}. Used sequential discovery instead.`;
  } catch (error) {
    if (signal.aborted) throw error;
    note = 'No usable manifest. Checked sequential PNG filenames instead.';
  }

  const frames = [];
  onProgress({ loaded: 0, total: null });
  for (let index = 0; ; index++) {
    const name = `frame_${String(index).padStart(3, '0')}.png`;
    try {
      frames.push(await load(root + name));
      onProgress({ loaded: frames.length, total: null });
    } catch (error) {
      if (signal.aborted) throw error;
      return { frames, note: `${note} Discovery stopped at ${name}.` };
    }
  }
}

export async function loadDemo(onProgress, signal) {
  const root = `${import.meta.env.BASE_URL}demo-frames/`;
  const names = await readManifest(root, signal);
  const result = await preload(names.map((name) => ({ name, src: root + name })), onProgress, signal);
  if (result.failures.length) throw new Error(`Demo views could not be read: ${result.failures.join(', ')}.`);
  return result.frames;
}

export function localEntries(files) {
  return [...files]
    .filter((file) => file.type === 'image/png' || /\.png$/i.test(file.name))
    .sort((a, b) => {
      const aIndex = a.name.match(/(\d+)(?=\D*$)/)?.[1];
      const bIndex = b.name.match(/(\d+)(?=\D*$)/)?.[1];
      return aIndex !== undefined && bIndex !== undefined
        ? Number(aIndex) - Number(bIndex) || filenameOrder.compare(a.name, b.name)
        : filenameOrder.compare(a.name, b.name);
    })
    .map((file) => ({ name: file.name, src: URL.createObjectURL(file) }));
}

export function releaseEntries(entries) {
  entries.forEach(({ src }) => URL.revokeObjectURL(src));
}

export const sourceIdentity = {
  hardware: { label: 'Pre-rendered on Ateno hardware', heading: 'Hardware-rendered orbit', caption: 'Ateno framebuffer output', guide: 'Every view in this orbit was rendered by Ateno hardware.' },
  local: { label: 'Hardware frames — loaded locally', heading: 'Your local frame sequence', caption: 'Local files; not verified by this website', guide: 'These are your local files; the website has not verified their origin.' },
  demo: { label: 'Illustrative demo', heading: 'Explore the viewer', caption: 'Not hardware output', guide: 'This sample is a software illustration, not Ateno hardware output.' },
};
