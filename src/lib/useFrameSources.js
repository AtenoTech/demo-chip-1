import { useEffect, useRef, useState } from 'react';
import { loadBundled, loadDemo, localEntries, preload, releaseEntries } from './frameSources';

export default function useFrameSources() {
  const [sources, setSources] = useState({});
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState({ loaded: 0, total: null });
  const [issue, setIssue] = useState('');
  const [setupNote, setSetupNote] = useState('');
  const controller = useRef(null);
  const ownedEntries = useRef([]);
  const nextId = useRef(0);

  useEffect(() => {
    const initial = new AbortController();
    controller.current = initial;
    const report = (value) => { if (!initial.signal.aborted) setProgress(value); };
    async function initialize() {
      try {
        const bundled = await loadBundled(report, initial.signal);
        if (initial.signal.aborted) return;
        setSetupNote(bundled.note);
        const kind = bundled.frames.length ? 'hardware' : 'demo';
        const frames = bundled.frames.length ? bundled.frames : await loadDemo(report, initial.signal);
        if (initial.signal.aborted) return;
        const source = { id: kind, kind, frames };
        setSources({ [kind]: source });
        setActive(source);
      } catch (error) {
        if (!initial.signal.aborted) setIssue(`The sample could not finish loading. You can load local PNG frames or reload to retry. ${error.message}`);
      } finally {
        if (!initial.signal.aborted) setProgress(null);
      }
    }
    initialize();
    return () => {
      initial.abort();
      controller.current?.abort();
      releaseEntries(ownedEntries.current);
      ownedEntries.current = [];
    };
  }, []);

  async function select(kind) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setIssue('');
    if (sources[kind]) {
      setActive(sources[kind]);
      setProgress(null);
      return;
    }
    if (kind !== 'demo') return;
    try {
      const frames = await loadDemo((value) => { if (!request.signal.aborted) setProgress(value); }, request.signal);
      if (request.signal.aborted) return;
      const source = { id: 'demo', kind: 'demo', frames };
      setSources((previous) => ({ ...previous, demo: source }));
      setActive(source);
    } catch {
      if (!request.signal.aborted) setIssue('The illustrative sample could not be loaded. Your current views are still available.');
    } finally {
      if (!request.signal.aborted) setProgress(null);
    }
  }

  async function upload(files) {
    if (!files.length) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const entries = localEntries(files);
    setIssue('');
    if (!entries.length) {
      setIssue('No PNG files were selected. Choose one or more PNG framebuffer captures.');
      setProgress(null);
      return;
    }
    let committed = false;
    try {
      const result = await preload(entries, (value) => { if (!request.signal.aborted) setProgress(value); }, request.signal);
      if (request.signal.aborted) return;
      if (result.failures.length) {
        setIssue(`Could not decode: ${result.failures.join(', ')}. Your previous sequence is unchanged. Replace these files and try again.`);
        return;
      }
      const oldEntries = ownedEntries.current;
      ownedEntries.current = entries;
      const source = { id: `local-${++nextId.current}`, kind: 'local', frames: result.frames };
      setSources((previous) => ({ ...previous, local: source }));
      setActive(source);
      committed = true;
      // The browser has decoded the new sequence. Old URLs are no longer needed;
      // old image objects remain usable until React commits the source swap.
      releaseEntries(oldEntries);
    } catch {
      if (!request.signal.aborted) setIssue('The selected PNGs could not be loaded. Your previous sequence is unchanged.');
    } finally {
      if (!committed) releaseEntries(entries);
      if (!request.signal.aborted) setProgress(null);
    }
  }

  function removeLocal() {
    // Offered only after switching away, so no displayed URL can be revoked.
    if (active?.kind === 'local') return;
    releaseEntries(ownedEntries.current);
    ownedEntries.current = [];
    setSources((previous) => {
      const remaining = { ...previous };
      delete remaining.local;
      return remaining;
    });
  }

  return { sources, active, progress, issue, setupNote, select, upload, removeLocal, dismissIssue: () => setIssue('') };
}
