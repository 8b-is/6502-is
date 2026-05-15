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

export default function ProgrammingPanel({ setSharedMachineState }) {
  const [machineState, setMachineState] = useState(null);
  const [hexInput, setHexInput] = useState('A9 01 A2 00 E8 8A 9D 00 02 2A E0 FF D0 F6 CA 8A 9D 00 03 6A E0 00 D0 F6 4C 00 00');
  const [isRunning, setIsRunning] = useState(false);
  const [clockHz, setClockHz] = useState(1); // Default 1 Hz
  const clockHzRef = useRef(1);
  const runTimerRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());
  const currentInstructionRef = useRef('BRK');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  }, []);

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

  const loadAndReset = React.useCallback((codeToLoad = hexInput) => {
    stopSimulation();
    
    // Parse hex input
    const bytes = codeToLoad.replace(/[^0-9A-Fa-f]/g, ' ')
                          .trim()
                          .split(' ')
                          .map(b => parseInt(b, 16))
                          .filter(b => !isNaN(b));
    
    // Clear userCode and load new bytes
    userCode.length = 0;
    for (let i = 0; i < bytes.length; i++) {
      userCode[i] = bytes[i];
    }
    
    loadProgram();
    initChip();
    updateState();
  }, [hexInput]);

  // Initialize chip once on mount
  useEffect(() => {
    loadAndReset('A9 01 A2 00 E8 8A 9D 00 02 2A E0 FF D0 F6 CA 8A 9D 00 03 6A E0 00 D0 F6 4C 00 00');
    return () => stopSimulation();
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
          <span>60 Hz</span>
        </div>
      </div>

        <div className="controls">
          <button className="btn primary" onClick={loadAndReset}>Load & Reset</button>
          <button className="btn" onClick={stepSimulation} disabled={isRunning}>Step (Clock)</button>
          {isRunning ? (
            <button className="btn stop" onClick={stopSimulation}>Pause</button>
          ) : (
            <button className="btn run" onClick={runSimulation}>Run</button>
          )}
        </div>
      </div>
    </div>
  );
}
