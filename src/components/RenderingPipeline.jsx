import gaussianScene from "@/assets/gaussian-courtyard.webp";
import atenoMark from "@/assets/ateno-mark.svg";

const stages = [
  { name: "Visibility & geometry", description: "Find and project the visible splats.", glyph: "geometry" },
  { name: "Ordering", description: "Put the splats in drawing order.", glyph: "ordering" },
  { name: "Rendering", description: "Blend them into the final pixels.", glyph: "rendering" },
];

function StageGlyph({ kind }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      {kind === "geometry" && <><path d="m8 8 48 16L8 40Z" /><ellipse cx="38" cy="24" rx="8" ry="15" /><path d="M8 8v32M48 10v28" strokeDasharray="2 3" /></>}
      {kind === "ordering" && <>{[0, 1, 2, 3].map((i) => <path key={i} d={`m12 ${10 + i * 7} 19-6 21 6-20 7Z`} fill="var(--stage)" />)}</>}
      {kind === "rendering" && <><ellipse cx="26" cy="23" rx="15" ry="8" transform="rotate(-25 26 23)" fill="currentColor" fillOpacity=".15" /><ellipse cx="37" cy="26" rx="15" ry="8" transform="rotate(25 37 26)" fill="currentColor" fillOpacity=".3" /></>}
    </svg>
  );
}

export default function RenderingPipeline() {
  return (
    <figure className="pipeline" aria-labelledby="pipeline-title">
      <figcaption className="pipeline__caption">
        <h3 id="pipeline-title">From a finished scene to a frame</h3>
        <p>Rendering pipeline illustration</p>
      </figcaption>
      <div className="pipeline__flow">
        <div className="pipeline__input">
          <img src={gaussianScene} width="960" height="640" alt="Illustrated courtyard formed from translucent ellipsoidal splats" loading="lazy" />
          <h4>Finished Gaussian scene</h4>
          <p>Prepared before rendering begins.</p>
          <small>Illustration, not hardware output</small>
        </div>
        <div className="pipeline__silicon">
          <div className="pipeline__brand"><img src={atenoMark} alt="" /><span>Inside Ateno silicon</span></div>
          <ol className="pipeline__stages">
            {stages.map((stage) => <li key={stage.name}><StageGlyph kind={stage.glyph} /><h4>{stage.name}</h4><p>{stage.description}</p></li>)}
          </ol>
        </div>
        <div className="pipeline__output">
          <svg viewBox="0 0 96 68" fill="none" stroke="currentColor" aria-hidden="true">
            <rect x="4" y="6" width="88" height="50" rx="1" />
            <path d="M12 14h72v34H12zM40 56v8m16-8v8M30 64h36" />
            <path d="M20 40V23h14v17m10 0V20h14v20m10 0V27h8v13" strokeDasharray="1 2" />
          </svg>
          <h4>Rendered framebuffer</h4>
          <p>1920 × 1080</p>
          <small>The finished image</small>
        </div>
      </div>
    </figure>
  );
}
