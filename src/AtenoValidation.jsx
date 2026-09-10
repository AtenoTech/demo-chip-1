import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import chipPackage from "@/assets/ateno-ax-package.webp";
import atenoMark from "@/assets/ateno-mark.svg";
import RenderingPipeline from "@/components/RenderingPipeline";
import useFrameSources from "@/lib/useFrameSources";
import { sourceIdentity } from "@/lib/frameSources";

function useReducedMotion(onMotionChange) {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(query.matches);
      onMotionChange(false);
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [onMotionChange]);

  return reduced;
}

function Wordmark({ light = false }) {
  return (
    <div className={`wordmark ${light ? "wordmark--light" : ""}`} aria-label="Ateno">
      <img className="wordmark__mark" src={atenoMark} alt="" width="64" height="64" />
      <span>ateno</span>
    </div>
  );
}

function Welcome({ onEnter }) {
  return (
    <main className="welcome">
      <header className="welcome__header">
        <Wordmark />
        <p>Purpose-built 3D rendering silicon</p>
      </header>

      <section className="welcome__content" aria-labelledby="welcome-title">
        <div className="welcome__copy">
          <h1 id="welcome-title">A scene to explore.<br /><em>A new way to render.</em></h1>
          <p className="welcome__intro">
            Explore Ateno’s hardware-rendered views, or try an illustrative sample when captures aren’t installed. Drag to orbit; the viewer always identifies the source.
          </p>
          <Button className="welcome__button" onClick={onEnter}>Enter the viewer</Button>
        </div>

        <figure className="welcome__package">
          <img src={chipPackage} alt="Ateno AX package illustration based on the supplied chip reference, showing the two-bar Ateno mark on a graphite package" width="1440" height="960" fetchPriority="high" />
          <figcaption><span>Ateno AX</span><span>Illustration based on the AX reference</span></figcaption>
        </figure>
      </section>

      <footer className="welcome__footer">
        <span>Validated on AWS F2</span>
        <span>10 September 2026</span>
      </footer>
    </main>
  );
}

function LoadingState({ progress }) {
  const hasTotal = progress.total > 0;
  return (
    <div className="loading-views" role="status">
      <p>{hasTotal ? `Loading views ${progress.loaded} / ${progress.total}` : `Discovering views${progress.loaded ? `: ${progress.loaded} ready` : "…"}`}</p>
      <div className="loader" role="progressbar" aria-label="Frame preload progress" aria-valuemin={hasTotal ? 0 : undefined} aria-valuemax={hasTotal ? progress.total : undefined} aria-valuenow={hasTotal ? progress.loaded : undefined}>
        <span style={{ width: hasTotal ? `${progress.loaded / progress.total * 100}%` : "0%" }} />
      </div>
    </div>
  );
}

function Tour({ step, onNext, onDismiss, identity, reducedMotion }) {
  const tourSteps = [
    { key: "orbit", text: "Drag across the image to orbit the scene." },
    { key: "spin", text: reducedMotion ? "Use arrow keys to explore with reduced motion." : "Press Spin for hands-free playback." },
    { key: "proof", text: identity.guide },
  ];
  const current = tourSteps[step];

  return (
    <aside className={`tour tour--${current.key}`} aria-label="Viewer tutorial" onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <button className="tour__close" onClick={onDismiss} aria-label="Dismiss tutorial"><X /></button>
      <div className="tour__step">
        <span className="tour__line" aria-hidden="true" />
        <p>{current.text}</p>
      </div>
      <div className="tour__footer">
        <div className="tour__dots" aria-label={`Tutorial step ${step + 1} of ${tourSteps.length}`}>
          {tourSteps.map((item, index) => <span key={item.key} className={index === step ? "is-active" : ""} />)}
        </div>
        <button onClick={onNext}>{step === tourSteps.length - 1 ? "Start exploring" : "Next"}</button>
      </div>
    </aside>
  );
}

function DetailsPanel({ open, sourceKind, setupNote }) {
  if (!open) return null;
  return (
    <section className={`details ${open ? "details--open" : ""}`} aria-hidden={!open}>
      <div className="details__inner">
        <div className="details__intro">
          <h2>What this run proved</h2>
          <p className="run-context">These measurements describe the Ateno hardware validation run{sourceKind !== "hardware" ? ", not the currently displayed sample or local files" : ""}.</p><p>This build renders a finished 3D Gaussian scene. Training the scene is a separate job and is not shown here.</p>
          <div className="comparison-note">
            <span aria-hidden="true">↳</span>
            <p>No GPU comparison has been run yet, so we are not making a speedup claim.</p>
          </div>
        </div>

        <dl className="facts">
          <div><dt>Output</dt><dd>1920 × 1080<small>2,073,600 pixels written per frame</small></dd></div>
          <div><dt>Scene</dt><dd>173,161 Gaussians accepted<small>161,935 visible after culling</small></dd></div>
          <div><dt>Frame time</dt><dd>262.16 ms median<small>100 MHz core clock</small></dd></div>
          <div><dt>Determinism</dt><dd>Byte-identical framebuffer<small>Same SHA-256 across three consecutive runs</small></dd></div>
          <div><dt>Implementation</dt><dd>Completion error: 0<small>Post-route setup slack: +0.069 ns</small></dd></div>
        </dl>

        <RenderingPipeline />

        <div className="cycles" aria-label="Cycle breakdown">
          <div className="cycles__heading"><h3>Where the cycles went</h3><p>Measured across the completed frame</p></div>
          <div className="cycles__bar" aria-hidden="true">
            <span className="cycles__ordering" /><span className="cycles__geometry" /><span className="cycles__render" />
          </div>
          <div className="cycles__legend">
            <p><i className="ordering" />Ordering <strong>75.02%</strong></p>
            <p><i className="geometry" />Geometry frontend <strong>18.96%</strong></p>
            <p><i className="render" />Render <strong>6.02%</strong></p>
          </div>
        </div>

        <details className="setup-help">
          <summary>Installing hardware output</summary>
          <p>Add sequential PNG framebuffer captures to <code>public/frames/</code>, starting with <code>frame_000.png</code>, <code>frame_001.png</code>, and <code>frame_002.png</code>.</p>
          <p>List filenames in <code>frames.json</code> for a complete-sequence check. Empty, invalid, or stale manifests fall back to sequential discovery. Reload after installing captures. See <a href={`${import.meta.env.BASE_URL}frames/README.md`} target="_blank" rel="noreferrer">frame setup instructions</a>.</p>
          {setupNote && <p className="setup-help__status">{setupNote}</p>}
        </details>

        <p className="details__footnote">
          Validation run on AWS F2 with a Xilinx Virtex UltraScale+ HBM xcvu47p, 10 September 2026.
          Frames were collected through a debug readout interface. This viewer plays back pre-rendered images.
        </p>
      </div>
    </section>
  );
}

function OrbitViewer({ collection, guideSeen, markGuideSeen }) {
  const { active, sources, progress, issue, setupNote } = collection;
  const frames = active?.frames || [];
  const identity = active ? sourceIdentity[active.kind] : null;
  const ready = frames.length > 0 && !progress;
  const [index, setIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tourStep, setTourStep] = useState(active && !guideSeen ? 0 : null);
  const dragState = useRef(null);
  const viewerRef = useRef(null);
  const fileRef = useRef(null);
  const reducedMotion = useReducedMotion(setSpinning);

  useEffect(() => {
    if (!spinning || !ready || reducedMotion) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % frames.length), 80);
    return () => clearInterval(timer);
  }, [spinning, ready, frames.length, reducedMotion]);

  const angle = useMemo(() => String(frames.length ? Math.floor(index / frames.length * 360) : 0).padStart(3, "0"), [index, frames.length]);

  function closeGuide() { setTourStep(null); markGuideSeen(); }
  function pauseInteraction() { setSpinning(false); setDragging(false); dragState.current = null; closeGuide(); }
  function select(kind) { pauseInteraction(); collection.select(kind); }
  function upload(event) {
    const files = [...event.target.files];
    event.target.value = "";
    if (!files.length) return;
    pauseInteraction();
    collection.upload(files);
  }
  function startDrag(event) {
    if (!ready || !event.isPrimary || event.button !== 0) return;
    setSpinning(false);
    setDragging(true);
    dragState.current = { x: event.clientX, start: index };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event) {
    if (!dragState.current || !ready) return;
    const steps = Math.round((event.clientX - dragState.current.x) / viewerRef.current.clientWidth * frames.length);
    setIndex(((dragState.current.start - steps) % frames.length + frames.length) % frames.length);
  }
  function endDrag(event) {
    setDragging(false);
    dragState.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboard(event) {
    if (!ready || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    setSpinning(false);
    setIndex((current) => (current + (event.key === "ArrowRight" ? 1 : -1) + frames.length) % frames.length);
  }
  function reset() { setSpinning(false); setIndex(0); viewerRef.current?.focus(); }
  function nextStep() {
    if (tourStep === 2) { closeGuide(); viewerRef.current?.focus(); }
    else setTourStep((current) => current + 1);
  }

  return (
    <main className={`viewer-page source-${active?.kind || "loading"}`}>
      <header className="viewer-header">
        <Wordmark light />
        <div className="viewer-header__proof" aria-live="polite">
          {active?.kind === "hardware" ? <ShieldCheck aria-hidden="true" /> : <span className="source-dot" aria-hidden="true" />}
          <span>{identity?.label || "Preparing the viewer"}{active?.kind === "demo" && <small>Not hardware output</small>}</span>
        </div>
      </header>

      <section className="viewer-shell" aria-labelledby="viewer-heading">
        <div className="viewer-heading">
          <h1 id="viewer-heading">{identity?.heading || "Explore the viewer"}</h1>
          <p className="viewer-heading__explain">Drag to look around <span aria-hidden="true">/</span> Arrow keys to step</p>
        </div>
        <div
          ref={viewerRef}
          className={`viewer-stage ${dragging ? "is-dragging" : ""} ${ready ? "is-ready" : ""}`}
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
          onLostPointerCapture={() => { setDragging(false); dragState.current = null; }}
          onKeyDown={keyboard} tabIndex={ready ? 0 : -1} role="application"
          aria-label={`${identity?.label || "Orbit viewer"}. Drag horizontally or use the left and right arrow keys to orbit.`}
          aria-busy={Boolean(progress)}
        >
          {active && <>
            <FrameCanvas image={frames[index]} label={identity.label} />
            <div className="frame-proof"><span /><p>{identity.caption}</p></div>
            <output className="angle" aria-label={`Current orbit angle ${Number(angle)} degrees`}><span>{angle}</span>°</output>
          </>}
          {progress && <LoadingState progress={progress} />}
          {!progress && !active && <p className="viewer-state__copy">Choose local PNG views, or select Demo to try loading the sample again.</p>}
          {tourStep !== null && ready && <Tour step={tourStep} identity={identity} reducedMotion={reducedMotion} onNext={nextStep} onDismiss={closeGuide} />}
        </div>

        <div className="viewer-controls">
          <div className="viewer-controls__primary">
            <Button className="control-button control-button--spin" variant="secondary" disabled={!ready || reducedMotion} aria-pressed={spinning && ready && !reducedMotion} onClick={() => setSpinning((value) => !value)}>
              {spinning && ready && !reducedMotion ? <Pause /> : <Play />}{spinning && ready && !reducedMotion ? "Pause" : "Spin"}
            </Button>
            <Button className="control-button" variant="ghost" onClick={reset} disabled={!ready}><RotateCcw />Reset view</Button>
          </div>
          <div className="viewer-controls__secondary">
            <input ref={fileRef} type="file" accept=".png,image/png" multiple hidden aria-label="Select local PNG frames" onChange={upload} />
            <button className="text-control load-control" onClick={() => fileRef.current?.click()}><Upload />{active?.kind === "demo" ? "Load hardware frames" : "Load frames"}</button>
            <button className="text-control" onClick={() => setTourStep(0)} disabled={!ready}><CircleHelp />Replay guide</button>
            <button className="text-control" onClick={() => setDetailsOpen((value) => !value)} aria-expanded={detailsOpen} aria-controls="run-details">Run details<ChevronDown className={detailsOpen ? "is-rotated" : ""} /></button>
          </div>
        </div>

        <div className="source-row">
          <div className="source-switcher" role="group" aria-label="Frame source">
            <span>Source</span>
            <button aria-pressed={active?.kind === "demo"} onClick={() => select("demo")}>Demo</button>
            {sources.hardware && <button aria-pressed={active?.kind === "hardware"} onClick={() => select("hardware")}>Hardware</button>}
            {sources.local && <button aria-pressed={active?.kind === "local"} onClick={() => select("local")}>Local files</button>}
          </div>
          <div className="source-actions">
            {active && active.kind !== "demo" && <button onClick={() => select("demo")}>Use demo instead</button>}
            {sources.local && active?.kind !== "local" && <button onClick={collection.removeLocal}>Remove local files</button>}
          </div>
          <p>{active?.kind === "demo" ? "This software sample demonstrates the interaction. Load Ateno framebuffer frames to view hardware output." : active?.kind === "local" ? "Files stay in this browser session. Their origin has not been verified by this website." : active?.kind === "hardware" ? "Each view is a framebuffer previously calculated by Ateno hardware." : "Choose local PNGs or explore the illustrative sample."}</p>
        </div>
        {issue && <div className="source-notice" role="alert"><p>{issue}</p><button aria-label="Dismiss file notice" onClick={collection.dismissIssue}><X /></button></div>}
        {reducedMotion && <p className="motion-note">Spin is off to respect your reduced-motion preference. Drag or use arrow keys to explore.</p>}
        <div id="run-details"><DetailsPanel open={detailsOpen} sourceKind={active?.kind} setupNote={setupNote} /></div>
      </section>
      <footer className="viewer-footer">
        <p>Ateno’s hardware validation demonstrates rendering of a finished scene.</p>
        <p>AWS F2 validation, 10 September 2026</p>
      </footer>
    </main>
  );
}

function FrameCanvas({ image, label }) {
  const canvas = useRef(null);
  useLayoutEffect(() => {
    const context = canvas.current.getContext("2d");
    canvas.current.width = image.naturalWidth;
    canvas.current.height = image.naturalHeight;
    context.drawImage(image, 0, 0);
  }, [image]);
  return <canvas ref={canvas} role="img" aria-label={label} />;
}

function Viewer() {
  const collection = useFrameSources();
  const [guideSeen, setGuideSeen] = useState(false);
  return <OrbitViewer key={collection.active?.id || "loading"} collection={collection} guideSeen={guideSeen} markGuideSeen={() => setGuideSeen(true)} />;
}

export default function AtenoValidation() {
  const [entered, setEntered] = useState(false);
  return entered ? <Viewer /> : <Welcome onEnter={() => setEntered(true)} />;
}
