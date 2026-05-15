import React, { useState, useEffect, useRef } from 'react';
import { 
  initChip, 
  step, 
  loadProgram,
  getMachineState, 
  userCode,
  mRead
} from '../simulation/engine';
import { getInstructionExplanation } from '../utils/instructionExplanations';
import { disassemble } from '../utils/disassembler';

const DEFAULT_PROGRAM = 'A9 01 A2 00 E8 8A 9D 00 02 2A E0 FF D0 F6 CA 8A 9D 00 03 6A E0 00 D0 F6 4C 00 00';

export default function ProgrammingPanel({ setSharedMachineState, themeMode, isEStop }) {
  const [machineState, setMachineState] = useState(null);
  const [hexInput, setHexInput] = useState(DEFAULT_PROGRAM);
  const [clockHz, setClockHz] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showEditorModal, setShowEditorModal] = useState(false);

  const clockHzRef = useRef(1);
  const runTimerRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());
  const currentInstructionRef = useRef('BRK');
  const prevLoadedLenRef = useRef(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    if (isEStop && isRunning) {
      stopSimulation();
    }
  }, [isEStop, isRunning]);

  const updateState = React.useCallback(() => {
    const state = getMachineState();
    if (state.fetch) {
      currentInstructionRef.current = disassemble(state.pc, mRead);
    }
    state.fullInstruction = currentInstructionRef.current;
    state.clockHz = clockHzRef.current;
    
    setMachineState(state);
    if (setSharedMachineState) setSharedMachineState(state);
  }, [setSharedMachineState]);

  const loadAndReset = React.useCallback((codeToLoad) => {
    stopSimulation();

    const source = typeof codeToLoad === 'string' ? codeToLoad : hexInput;
    const bytes = source.replace(/[^0-9A-Fa-f]/g, ' ')
                          .trim()
                          .split(/\s+/)
                          .map(b => parseInt(b, 16))
                          .filter(b => !isNaN(b));

    // Overwrite previously-loaded bytes with 0 so a shorter program doesn't leave a tail.
    // loadProgram() skips `undefined` slots, so use explicit zeros.
    userCode.length = 0;
    const span = Math.max(bytes.length, prevLoadedLenRef.current);
    for (let i = 0; i < span; i++) {
      userCode[i] = i < bytes.length ? bytes[i] : 0;
    }
    prevLoadedLenRef.current = bytes.length;

    loadProgram();
    initChip();
    updateState();
  }, [hexInput, updateState]);

  // Initialize chip once on mount
  useEffect(() => {
    loadAndReset(DEFAULT_PROGRAM);
    return () => stopSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepSimulation = () => {
    // 6502 instructions take multiple clock cycles (steps).
    // We can step multiple times until the 'sync' node goes high indicating a new instruction fetch,
    // or just step 1 clock cycle. We'll step 1 full clock cycle.
    step();
    step();
    updateState();
  };

  const runSimulation = () => {
    setIsRunning(true);
    lastFrameTimeRef.current = performance.now();
    
    const loop = () => {
      // Calculate how many steps we need to take based on the target Hz
      const now = performance.now();
      const dt = now - lastFrameTimeRef.current;
      
      if (clockHzRef.current <= 60) {
        // For low frequencies, step once and wait
        step();
        updateState();
        runTimerRef.current = setTimeout(() => {
          lastFrameTimeRef.current = performance.now();
          requestAnimationFrame(loop);
        }, 1000 / clockHzRef.current);
      } else {
        // For high frequencies, run multiple steps per frame
        // to achieve the target Hz (up to what the CPU can handle without freezing)
        const targetStepsPerFrame = clockHzRef.current / 60;
        
        // Prevent freezing the browser: max 1000 steps per frame (limits to ~60kHz visual6502)
        // Note: visual6502 is very CPU intensive.
        const stepsToTake = Math.min(Math.floor(targetStepsPerFrame), 5000);
        
        for (let i = 0; i < stepsToTake; i++) {
          step();
        }
        updateState();
        lastFrameTimeRef.current = performance.now();
        runTimerRef.current = setTimeout(() => requestAnimationFrame(loop), 0);
      }
    };
    
    // Start loop
    if (clockHzRef.current <= 60) {
      runTimerRef.current = setTimeout(() => {
        lastFrameTimeRef.current = performance.now();
        requestAnimationFrame(loop);
      }, 1000 / clockHzRef.current);
    } else {
      runTimerRef.current = setTimeout(() => requestAnimationFrame(loop), 0);
    }
  };

  const stopSimulation = () => {
    setIsRunning(false);
    if (runTimerRef.current) {
      clearTimeout(runTimerRef.current);
      runTimerRef.current = null;
    }
  };

  const toHex = (num, padding = 2) => num !== undefined ? num.toString(16).toUpperCase().padStart(padding, '0') : '00';

  const editorContent = (
    <>
      <div className="hex-editor">
        <label>Machine Code (Hex):</label>
        <textarea 
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          spellCheck="false"
        />
      </div>

      <div className="speed-control" style={{marginTop: '10px', marginBottom: '10px'}}>
        <label>Clock Speed: {clockHz} Hz</label>
        <input 
          type="range" 
          min="1" 
          max="120" 
          step="1"
          value={clockHz} 
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setClockHz(val);
            clockHzRef.current = val;
          }}
          style={{width: '100%'}}
        />
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666'}}>
          <span>1 Hz</span>
          <span>120 Hz</span>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="mobile-programming-controls" style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
        {showEditorModal && (
          <div className="modal-overlay" onClick={() => setShowEditorModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowEditorModal(false)}>×</button>
              <h2>Program Editor</h2>
              {editorContent}
              <div className="controls" style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn primary" onClick={() => { loadAndReset(); setShowEditorModal(false); }}>Load & Reset</button>
                <button className="btn" onClick={stepSimulation} disabled={isRunning || isEStop}>Step</button>
              </div>
            </div>
          </div>
        )}
        
        <button 
          className="btn" 
          onClick={() => setShowEditorModal(true)} 
          title="Edit Program"
          style={{ fontSize: '1.25rem', padding: '10px', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff' }}
        >
          📝
        </button>
        <button 
          className="btn primary" 
          onClick={() => loadAndReset()} 
          title="Reset Simulation"
          style={{ fontSize: '1.25rem', padding: '10px', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          🔄
        </button>
        {isRunning ? (
          <button 
            className="btn stop" 
            onClick={stopSimulation} 
            title="Pause Simulation"
            style={{ fontSize: '1.25rem', padding: '10px', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            ⏸
          </button>
        ) : (
          <button 
            className="btn run" 
            onClick={runSimulation} 
            disabled={isEStop} 
            title="Run Simulation"
            style={{ fontSize: '1.25rem', padding: '10px', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            ▶️
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`programming-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div
        className="panel-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand program execution' : 'Collapse program execution'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsCollapsed(!isCollapsed); } }}
      >
        <h2>Program Execution</h2>
        <button className="collapse-btn" aria-hidden="true" tabIndex={-1} type="button">▼</button>
      </div>
      
      <div className="panel-content">
        {editorContent}
        <div className="controls">
          <button className="btn primary" onClick={() => loadAndReset()}>Load & Reset</button>
          <button className="btn" onClick={stepSimulation} disabled={isRunning || isEStop}>Step</button>
          {isRunning ? (
            <button className="btn stop" onClick={stopSimulation}>Pause</button>
          ) : (
            <button className="btn run" onClick={runSimulation} disabled={isEStop}>Run</button>
          )}
        </div>
      </div>
    </div>
  );
}
