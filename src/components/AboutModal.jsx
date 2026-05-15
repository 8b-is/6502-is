import React from 'react';

export default function AboutModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>About Visual6502 3D</h2>
        
        <p>
          Welcome to <strong>6502.is</strong>, an interactive 3D WebGL visualization of the legendary 6502 microprocessor.
        </p>

        <p>
          Our goal was to modernize the incredible <a href="http://visual6502.org/" target="_blank" rel="noopener noreferrer">visual6502.org</a> project. We wanted to take the raw transistor-level simulation engine and bring it into the modern era, allowing people to literally see the silicon state change in real-time as instructions execute in a breathtaking 3D environment.
        </p>

        <p>
          The original 6502 powered computing revolutions like the Apple II, Commodore 64, and Nintendo Entertainment System (NES). By observing this chip execute instructions cycle-by-cycle, you can understand computing at its absolute core—right down to the diffusion layers and metal contacts.
        </p>
        
        <div className="modal-links">
          <a href="https://github.com/8b-is/6502-is" target="_blank" rel="noopener noreferrer" className="btn primary">
            View Source on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
