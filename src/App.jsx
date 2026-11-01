import { useState } from 'react';
import Chip3D from './components/Chip3D';
import LayerToggle from './components/LayerToggle';
import ProgrammingPanel from './components/ProgrammingPanel';
import { LAYER_INFO } from './utils/geometryBuilder';
import { getInstructionExplanation } from './utils/instructionExplanations';
import AboutModal from './components/AboutModal';
import ShareModal from './components/ShareModal';
import './index.css';
import './App.css';

const initialLayers = { diagramOverlay: 0, pinLegend: 0 };
Object.keys(LAYER_INFO).forEach(id => { initialLayers[id] = id === '0' ? 0.85 : 0.65; });
const hex = (value, length = 2) => (value ?? 0).toString(16).toUpperCase().padStart(length, '0');

function App() {
  const [visibleLayers, setVisibleLayers] = useState(initialLayers);
  const [layerSpacing, setLayerSpacing] = useState(1);
  const [machineState, setMachineState] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [calmMode, setCalmMode] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [isEStop, setIsEStop] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [viewMode, setViewMode] = useState('orbit');
  const [autoRotate, setAutoRotate] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [overlayConfig, setOverlayConfig] = useState({
    rotation: -90, scaleX: 95, scaleY: 90, offsetX: 0, offsetY: 0,
    glassOpacity: 0.85, flipX: false, flipY: false,
  });
  const themeMode = calmMode ? 'safe' : 'full';
  const selectView = (mode) => {
    setViewMode(mode);
    setLayerSpacing(mode === 'exploded' ? 9 : 1);
    setResetKey(key => key + 1);
  };

  return (
    <main className={`app-container observatory ${calmMode ? 'calm-mode' : ''}`}>
      <div className="ambient-haze" aria-hidden="true" />
      <header className="observatory-header">
        <a className="brand" href="#" aria-label="6502.is home">
          <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="8" y="8" width="16" height="16" rx="2"/><rect x="12" y="12" width="8" height="8" rx="1"/><path d="M12 3v5m8-5v5M12 24v5m8-5v5M3 12h5m-5 8h5m16-8h5m-5 8h5"/></svg>
          <span>6502<span className="brand-suffix">.is</span></span>
          <span className="brand-edition">SILICON OBSERVATORY</span>
        </a>
        <nav className="header-actions" aria-label="Experience controls">
          <span className="edition-tag">EST. 1975 <span>↗</span> REIMAGINED</span>
          <button className={`quiet-button ${calmMode ? 'selected' : ''}`} onClick={() => setCalmMode(!calmMode)} aria-pressed={calmMode}>◐ <span>Calm mode</span></button>
          <button className="quiet-button about-nav" aria-label="About the observatory" onClick={() => setShowAbout(true)}>About <span>↗</span></button>
          <button className="share-button" onClick={() => setShowShare(true)}>Share <span>↗</span></button>
        </nav>
      </header>

      <section className="intro-copy" aria-label="Silicon observatory">
        <div className="eyebrow"><span className="status-dot" /> A LITTLE SILICON. AN ENTIRE UNIVERSE.</div>
        <h1>Ghost in<br/>the <em>machine.</em></h1>
        <p>Inside the chip that changed everything.<br/>3,510 transistors. Infinite possibilities.<br/>Now, a world you can wander through.</p>
        <div className="specimen-id"><span>01 /</span> MOS TECHNOLOGY 6502 <span className="specimen-line" /></div>
      </section>

      <section className="canvas-container" aria-label="Interactive 3D 6502 chip. Drag to orbit, scroll to zoom, click to trace a signal.">
        <Chip3D visibleLayers={visibleLayers} machineState={machineState}
          overlayConfig={overlayConfig} layerSpacing={layerSpacing} themeMode={themeMode}
          isEStop={isEStop} viewMode={viewMode} autoRotate={autoRotate && !calmMode} resetKey={resetKey} />
      </section>
      <div className="scene-coordinate coordinate-top" aria-hidden="true">FIG. 001 <span>/</span> SILICON DIE</div>
      <div className="scene-coordinate coordinate-bottom" aria-hidden="true">8-BIT MICROPROCESSOR <span>·</span> NMOS / 1975</div>
      <div className="instruction-readout" aria-label="Current instruction">
        <span className="telemetry-label">INSTRUCTION REGISTER</span>
        <strong>{(machineState?.fullInstruction || machineState?.instruction || 'BRK').replace(/&nbsp;/g, ' ')}</strong>
        <p>{getInstructionExplanation(machineState?.fullInstruction || machineState?.instruction || 'BRK')}</p>
      </div>

      <aside className="instrument-rack" aria-label="Simulator controls">
        <div className="rack-heading"><span>CONTROL ROOM</span><span className="rack-indicator">● ONLINE</span></div>
        <ProgrammingPanel setSharedMachineState={setMachineState} themeMode={themeMode}
          isEStop={isEStop} onRunningChange={setIsRunning} />
        <LayerToggle visibleLayers={visibleLayers} setVisibleLayers={setVisibleLayers}
          overlayConfig={overlayConfig} setOverlayConfig={setOverlayConfig}
          layerSpacing={layerSpacing} setLayerSpacing={setLayerSpacing} />
        <div className="rack-footnote"><span>↳</span> Real transistors. Real computation.</div>
      </aside>

      <div className="scene-tools">
        <div className="view-switcher" role="group" aria-label="Camera view">
          {[['orbit', '◈', 'Orbit'], ['top', '⊞', 'Top'], ['exploded', '≋', 'Exploded']].map(([mode, icon, label]) => (
            <button key={mode} className={viewMode === mode ? 'active' : ''} aria-pressed={viewMode === mode} onClick={() => selectView(mode)}><span aria-hidden="true">{icon}</span>{label}</button>
          ))}
        </div>
        <button className={`scene-tool ${autoRotate ? 'active' : ''}`} aria-label="Auto-rotate chip" title="Auto-rotate chip" aria-pressed={autoRotate} disabled={calmMode || isEStop} onClick={() => setAutoRotate(!autoRotate)}>⟳</button>
        <button className="scene-tool" aria-label="Reset camera" title="Reset camera" onClick={() => setResetKey(key => key + 1)}>⌖</button>
      </div>
      <div className="interaction-hint"><span>DRAG</span> orbit <i /> <span>SCROLL</span> zoom <i /> <span>CLICK</span> trace a signal</div>

      <section className="telemetry" aria-label="Live CPU telemetry">
        <div className="telemetry-status"><span className={`status-dot ${isRunning ? 'running' : ''}`} /><div><span className="telemetry-label">SYSTEM STATUS</span><strong>{isEStop ? 'Emergency stop' : isRunning ? 'Clock running' : 'Awaiting your signal'}</strong></div></div>
        <div className="register-bank">
          {[['PC', hex(machineState?.pc, 4)], ['A', hex(machineState?.a)], ['X', hex(machineState?.x)], ['Y', hex(machineState?.y)], ['SP', hex(machineState?.sp)]].map(([label, value]) => (
            <div className="register" key={label}><span>{label}</span><strong><small>$</small>{value}</strong></div>
          ))}
          <div className="register flags-register"><span>NV–BDIZC</span><strong>{machineState?.p?.replace(/&#8209;?/g, '-') || '--------'}</strong></div>
        </div>
        <div className="cycle-readout"><span className="telemetry-label">CLOCK CYCLES</span><strong>{Math.floor((machineState?.cycle ?? 0) / 2).toString().padStart(6, '0')}</strong></div>
        <button className={`emergency-button ${isEStop ? 'engaged' : ''}`} onClick={() => setIsEStop(!isEStop)} aria-pressed={isEStop} title="Stop simulation and visual motion"><span>■</span> {isEStop ? 'Release stop' : 'E-stop'}</button>
      </section>

      <footer className="observatory-footer"><span>A window into the invisible.</span><div><a href="https://8b.is" target="_blank" rel="noopener noreferrer">BY 8B.IS ↗</a><a href="https://github.com/8b-is/6502-is" target="_blank" rel="noopener noreferrer">SOURCE CODE ↗</a><span className="footer-version">VISUAL6502 / WEBGL</span></div></footer>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </main>
  );
}

export default App;
