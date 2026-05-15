import { useState, useEffect } from 'react';
import Chip3D from './components/Chip3D';
import LayerToggle from './components/LayerToggle';
import ProgrammingPanel from './components/ProgrammingPanel';
import { LAYER_INFO } from './utils/geometryBuilder';
import { getInstructionExplanation } from './utils/instructionExplanations';
import AboutModal from './components/AboutModal';
import ExperienceModal from './components/ExperienceModal';
import logo8b from './assets/8b-logo.png';
import './index.css';

function App() {
  // Initialize all layers to 1.0 (opacity)
  const initialLayers = {
    diagramOverlay: 0, // 0 = off
    pinLegend: 1.0
  };
  Object.keys(LAYER_INFO).forEach(id => {
    initialLayers[id] = 0.5;
  });

  const [visibleLayers, setVisibleLayers] = useState(initialLayers);
  const [layerSpacing, setLayerSpacing] = useState(1.0);
  const [machineState, setMachineState] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState(null);
  const [isEStop, setIsEStop] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  const [overlayConfig, setOverlayConfig] = useState({
    rotation: -90, // degrees
    scaleX: 95.0,
    scaleY: 90.0,
    offsetX: 0,
    offsetY: 0,
    glassOpacity: 0.85,
    flipX: false,
    flipY: false
  });

  useEffect(() => {
    let timeoutId;
    const scheduleGlitch = () => {
      const delay = 2000 + Math.random() * 5000; // 5 to 20 seconds
      timeoutId = setTimeout(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 100); // glitch duration
        scheduleGlitch();
      }, delay);
    };
    scheduleGlitch();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className={`app-container ${themeMode === 'safe' ? 'theme-safe' : ''}`}>
      {themeMode === null && <ExperienceModal onSelectMode={setThemeMode} />}

      <div className="canvas-container">
        <Chip3D
          visibleLayers={visibleLayers}
          machineState={machineState}
          overlayConfig={overlayConfig}
          layerSpacing={layerSpacing}
          themeMode={themeMode}
          isEStop={isEStop}
        />
      </div>
      <div className="ui-overlay">

        <header className="app-header">
          <div>
            <h1>Visual6502 <span>3D</span></h1>
            <p className="app-subtitle">WebGL 6502 Simulation</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${isEStop ? '' : 'stop'}`}
              onClick={() => setIsEStop(!isEStop)}
            >
              {isEStop ? '⚠️' : '🛑'}
            </button>
            <button className="about-btn" onClick={() => setShowAbout(true)} aria-label="About 6502.is">
              <span className="about-btn-full">About 6502.is</span>
              <span className="about-btn-short" aria-hidden="true">?</span>
            </button>
          </div>
        </header>

        {machineState && (
          <div className={`top-dashboard ${dashboardCollapsed ? 'collapsed' : ''}`}>
            <div
              className="panel-header"
              onClick={() => setDashboardCollapsed(!dashboardCollapsed)}
              role="button"
              tabIndex={0}
              aria-expanded={!dashboardCollapsed}
              aria-label={dashboardCollapsed ? 'Expand CPU state' : 'Collapse CPU state'}
            >
              <h2>CPU State</h2>
              <button className="collapse-btn" aria-hidden="true" tabIndex={-1}>▼</button>
            </div>
            <div className="dashboard-content">
              <div className="dashboard-registers">
                <div className="dashboard-item"><span>PC</span> ${(machineState.pc !== undefined ? machineState.pc.toString(16).toUpperCase().padStart(4, '0') : '0000')}</div>
                <div className="dashboard-item"><span>A</span> ${(machineState.a !== undefined ? machineState.a.toString(16).toUpperCase().padStart(2, '0') : '00')}</div>
                <div className="dashboard-item"><span>X</span> ${(machineState.x !== undefined ? machineState.x.toString(16).toUpperCase().padStart(2, '0') : '00')}</div>
                <div className="dashboard-item"><span>Y</span> ${(machineState.y !== undefined ? machineState.y.toString(16).toUpperCase().padStart(2, '0') : '00')}</div>
                <div className="dashboard-item"><span>SP</span> ${(machineState.sp !== undefined ? machineState.sp.toString(16).toUpperCase().padStart(2, '0') : '00')}</div>
                <div className="dashboard-item flags"><span>Flags</span> {machineState.p.replace(/&#8209/g, '-')}</div>
              </div>

              {(!machineState.clockHz || machineState.clockHz <= 6) && (
                <div className="dashboard-instruction">
                  <div className="cycle-count">Cycle: {Math.floor(machineState.cycle / 2)}</div>
                  <div className="instruction-text">
                    {machineState.fullInstruction || machineState.instruction}
                  </div>
                  {visibleLayers.diagramOverlay > 0 && (
                    <div className="instruction-explanation" style={{ fontSize: '0.5rem' }} >
                      {getInstructionExplanation(machineState?.fullInstruction || machineState?.instruction)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="right-panels" role="region" aria-label="Controls">
          <ProgrammingPanel
            setSharedMachineState={setMachineState}
            themeMode={themeMode}
            isEStop={isEStop}
          />
          <LayerToggle
            visibleLayers={visibleLayers}
            setVisibleLayers={setVisibleLayers}
            overlayConfig={overlayConfig}
            setOverlayConfig={setOverlayConfig}
            layerSpacing={layerSpacing}
            setLayerSpacing={setLayerSpacing}
          />
        </div>
      </div>

      <div className="bottom-left-links">
        <a
          href="https://8b.is"
          target="_blank"
          rel="noopener noreferrer"
          className="watermark"
          aria-label="Brought to you by 8b.is"
        >
          <img src={logo8b} alt="8b.is" className="logo-8b" />
        </a>
        <a
          href="https://github.com/8b-is/6502-is"
          target="_blank"
          rel="noopener noreferrer"
          className={`github-star ${isGlitching ? 'glitch-active' : ''}`}
          aria-label="Star this project on GitHub"
        >
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          <span className="link-text" style={{ fontStyle: 'italic' }}>GitHub 🌟a</span>
        </a>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;
