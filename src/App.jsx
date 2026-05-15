import React, { useState } from 'react';
import Chip3D from './components/Chip3D';
import LayerToggle from './components/LayerToggle';
import ProgrammingPanel from './components/ProgrammingPanel';
import { LAYER_INFO } from './utils/geometryBuilder';
import { getInstructionExplanation } from './utils/instructionExplanations';
import AboutModal from './components/AboutModal';
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

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Chip3D 
          visibleLayers={visibleLayers} 
          machineState={machineState} 
          overlayConfig={overlayConfig}
          layerSpacing={layerSpacing}
        />
      </div>
      <div className="ui-overlay">
        
        <header className="app-header">
          <h1>Visual6502 <span>3D</span></h1>
          <p>Modern WebGL Simulation</p>
          <button className="about-btn" onClick={() => setShowAbout(true)}>About 6502.is</button>
        </header>

        {machineState && (
          <div className={`top-dashboard ${dashboardCollapsed ? 'collapsed' : ''}`}>
            <div className="panel-header" onClick={() => setDashboardCollapsed(!dashboardCollapsed)}>
              <h2>CPU State</h2>
              <button className="collapse-btn">▼</button>
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
                  <div className="instruction-explanation">
                    {getInstructionExplanation(machineState.fullInstruction || machineState.instruction)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="right-panels">
        <ProgrammingPanel setSharedMachineState={setMachineState} />
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

      <a 
        href="https://8b.is" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="watermark"
      >
        Brought to you by <span className="shimmer-text">8b.is</span>
      </a>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;
