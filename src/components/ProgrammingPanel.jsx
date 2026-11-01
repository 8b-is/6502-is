import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { initChip, step, loadProgram, getMachineState, userCode, mRead } from '../simulation/engine';
import { disassemble } from '../utils/disassembler';

const DEFAULT_PROGRAM = 'A9 01 A2 00 E8 8A 9D 00 02 2A E0 FF D0 F6 CA 8A 9D 00 03 6A E0 00 D0 F6 4C 00 00';

export default function ProgrammingPanel({ setSharedMachineState, isEStop, onRunningChange }) {
  const [hexInput, setHexInput] = useState(DEFAULT_PROGRAM);
  const [clockHz, setClockHz] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [error, setError] = useState('');
  const currentInstructionRef = useRef('BRK');
  const prevLoadedLenRef = useRef(0);
  const clockHzRef = useRef(clockHz);
  const cancelLoopRef = useRef(() => {});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateState = useCallback(() => {
    const state = getMachineState();
    if (state.fetch) currentInstructionRef.current = disassemble(state.pc, mRead);
    setSharedMachineState?.({ ...state, fullInstruction: currentInstructionRef.current, clockHz: clockHzRef.current });
  }, [setSharedMachineState]);

  const stopSimulation = useCallback(() => {
    cancelLoopRef.current();
    setIsRunning(false);
  }, []);

  const loadAndReset = useCallback((source) => {
    const tokens = source.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length || tokens.length > 65536 || tokens.some(token => !/^[0-9a-f]{2}$/i.test(token))) {
      setError('Use two-digit hex bytes separated by spaces (for example, A9 01).');
      return false;
    }
    stopSimulation();
    setError('');
    const bytes = tokens.map(token => parseInt(token, 16));
    userCode.length = 0;
    const span = Math.max(bytes.length, prevLoadedLenRef.current);
    for (let i = 0; i < span; i++) userCode[i] = bytes[i] ?? 0;
    prevLoadedLenRef.current = bytes.length;
    loadProgram();
    initChip();
    updateState();
    return true;
  }, [stopSimulation, updateState]);

  useEffect(() => {
    // The module-level transistor engine is external state; publish its reset snapshot on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAndReset(DEFAULT_PROGRAM);
  }, [loadAndReset]);

  useEffect(() => {
    onRunningChange?.(isRunning && !isEStop);
  }, [isRunning, isEStop, onRunningChange]);

  useEffect(() => {
    // Latch the external emergency stop so releasing it cannot restart the clock.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isEStop) stopSimulation();
  }, [isEStop, stopSimulation]);

  useEffect(() => {
    if (!isRunning || isEStop) return;
    let cancelled = false;
    let timer;
    let frame;
    const loop = () => {
      if (cancelled) return;
      // One visible tick is one full cycle, just like the Step button.
      const cycles = clockHz <= 60 ? 1 : Math.max(1, Math.round(clockHz / 60));
      for (let i = 0; i < cycles; i++) { step(); step(); }
      updateState();
      timer = setTimeout(() => { if (!cancelled) frame = requestAnimationFrame(loop); }, 1000 / Math.min(clockHz, 60));
    };
    const cancel = () => { cancelled = true; clearTimeout(timer); cancelAnimationFrame(frame); };
    cancelLoopRef.current = cancel;
    timer = setTimeout(() => { if (!cancelled) frame = requestAnimationFrame(loop); }, 1000 / Math.min(clockHz, 60));
    return cancel;
  }, [isRunning, isEStop, clockHz, updateState]);

  const stepSimulation = () => { step(); step(); updateState(); };
  const editorContent = (
    <>
      <div className="hex-editor">
        <label htmlFor="machine-code">Machine code / HEX</label>
        <textarea id="machine-code" value={hexInput} onChange={event => setHexInput(event.target.value)} spellCheck="false" aria-invalid={!!error} aria-describedby={error ? 'hex-error' : undefined} />
        {error && <p id="hex-error" role="alert" style={{ color: '#eab39c', fontSize: '11px' }}>{error}</p>}
      </div>
      <div className="speed-control">
        <label htmlFor="clock-speed">Clock speed <span style={{ float: 'right', color: 'var(--accent-color)' }}>{clockHz} Hz</span></label>
        <input id="clock-speed" type="range" min="1" max="120" step="1" value={clockHz} onChange={event => {
          const value = Number(event.target.value);
          clockHzRef.current = value;
          setClockHz(value);
        }} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>1 Hz</span><span>120 Hz</span></div>
      </div>
    </>
  );
  const executionControls = <>
    <button className="btn primary" onClick={() => loadAndReset(hexInput)}>Load / Reset</button>
    <button className="btn" onClick={stepSimulation} disabled={isRunning || isEStop}>Step →</button>
    {isRunning ? <button className="btn stop" onClick={stopSimulation}>Ⅱ Pause</button>
      : <button className="btn run" onClick={() => setIsRunning(true)} disabled={isEStop}>▶ Run</button>}
  </>;

  if (isMobile) return (
    <div className="mobile-programming-controls">
      {showEditorModal && createPortal(<div className="modal-overlay" onClick={() => setShowEditorModal(false)}>
        <div className="modal-content" role="dialog" aria-modal="true" aria-label="Program console" onClick={event => event.stopPropagation()}>
          <button className="modal-close" aria-label="Close program console" onClick={() => setShowEditorModal(false)}>×</button>
          <h2>Program console</h2>{editorContent}
          <div className="modal-controls">{executionControls}</div>
        </div>
      </div>, document.querySelector('.app-container'))}
      <button className="btn btn-circle" onClick={() => setShowEditorModal(true)} title="Edit program" aria-label="Edit program">⌘</button>
      <button className="btn btn-circle primary" onClick={() => loadAndReset(hexInput)} title="Reset simulation" aria-label="Reset simulation">↺</button>
      <button className="btn btn-circle" onClick={stepSimulation} disabled={isRunning || isEStop} title="Step one cycle" aria-label="Step one cycle">→</button>
      {isRunning ? <button className="btn btn-circle stop" onClick={stopSimulation} aria-label="Pause simulation">Ⅱ</button>
        : <button className="btn btn-circle run" onClick={() => setIsRunning(true)} disabled={isEStop} aria-label="Run simulation">▶</button>}
    </div>
  );

  return <div className={`programming-panel ${isCollapsed ? 'collapsed' : ''}`}>
    <div className="panel-header" role="button" tabIndex={0} aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? 'Expand program console' : 'Collapse program console'}
      onClick={() => setIsCollapsed(!isCollapsed)}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setIsCollapsed(!isCollapsed); } }}>
      <h2>Program console</h2><span className="collapse-btn" aria-hidden="true">⌄</span>
    </div>
    <div className="panel-content">{editorContent}<div className="controls">{executionControls}</div></div>
  </div>;
}
