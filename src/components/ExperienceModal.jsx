import React from 'react';

export default function ExperienceModal({ onSelectMode }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 100000, backdropFilter: 'blur(20px)', backgroundColor: 'rgba(5,5,8,0.8)' }}>
      <div className="modal-content" style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Welcome to Visual6502 3D</h2>
        <p style={{ color: '#ff6b6b', fontWeight: 'bold', marginBottom: '15px' }}>
          ⚠️ Photosensitivity Warning
        </p>
        <p style={{ fontSize: '0.95rem', color: '#ccc', marginBottom: '30px' }}>
          This simulator includes intense, flashing neon animations that represent electrical flow across the silicon die. 
          Please select your preferred viewing experience below.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            className="btn" 
            onClick={() => onSelectMode('safe')}
            style={{ 
              padding: '15px', 
              fontSize: '1.1rem', 
              background: '#e0e0e3', 
              color: '#111', 
              border: '2px solid transparent',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <strong>Safe Mode</strong><br/>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Soft lighting, no flashing effects</span>
          </button>

          <button 
            className="btn" 
            onClick={() => onSelectMode('full')}
            style={{ 
              padding: '15px', 
              fontSize: '1.1rem', 
              background: 'rgba(0, 0, 0, 0.5)', 
              color: '#4a9eff', 
              border: '2px solid #4a9eff',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(74, 158, 255, 0.3)'
            }}
          >
            <strong>Full Experience</strong><br/>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Intense neon electric flow and animations</span>
          </button>
        </div>
      </div>
    </div>
  );
}
