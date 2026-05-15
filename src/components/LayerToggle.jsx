import React, { useState, useEffect } from 'react';
import { LAYER_INFO } from '../utils/geometryBuilder';

export default function LayerToggle({ visibleLayers, setVisibleLayers, overlayConfig, setOverlayConfig, layerSpacing, setLayerSpacing }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleLayer = (layerId) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: prev[layerId] > 0 ? 0 : 1.0
    }));
  };

  const setLayerOpacity = (layerId, opacity) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: opacity
    }));
  };

  const layerContent = (
    <div className="panel-content">
      <div className="layer-list">
        <label className="layer-item active" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <span className="layer-name" style={{ flex: '1', fontWeight: 'bold' }}>Z-Spacing Multiplier</span>
          <input 
            type="range" 
            min="0" max="10" step="0.1"
            value={layerSpacing} 
            onChange={(e) => setLayerSpacing(parseFloat(e.target.value))} 
            style={{ width: '80px', marginRight: '10px' }}
          />
        </label>
        {Object.entries(LAYER_INFO).map(([id, info]) => (
          <label key={id} className={`layer-item ${visibleLayers[id] > 0 ? 'active' : ''}`}>
            <div className="layer-color-indicator" style={{ backgroundColor: info.color }}></div>
            <input 
              type="range" 
              min="0" max="1" step="0.05"
              value={visibleLayers[id] ?? 0.5} 
              onChange={(e) => setLayerOpacity(id, parseFloat(e.target.value))} 
              style={{ width: '80px', marginRight: '10px' }}
            />
            <span className="layer-name">{info.name}</span>
          </label>
        ))}
      </div>
      
      <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)} style={{ cursor: 'pointer', marginTop: '1rem', color: '#888', fontSize: '0.8rem', textAlign: 'center' }}>
        {showAdvanced ? 'Hide Advanced Overlays ▲' : 'Show Advanced Overlays ▼'}
      </div>

      {showAdvanced && (
        <>
          <h2 style={{ marginTop: '1rem' }}>Overlays</h2>
          <div className="layer-list">
            <label className={`layer-item ${visibleLayers.diagramOverlay > 0 ? 'active' : ''}`}>
              <div className="layer-color-indicator" style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}></div>
              <input 
                type="checkbox" 
                checked={visibleLayers.diagramOverlay > 0} 
                onChange={() => toggleLayer('diagramOverlay')} 
              />
              <span className="layer-name">Diagram Plexiglass</span>
            </label>
            {visibleLayers.diagramOverlay > 0 && (
              <div className="overlay-config-panel">
                <div className="config-row">
                  <label>Offset X</label>
                  <input type="range" min="-50" max="50" step="0.1" value={overlayConfig.offsetX} onChange={e => setOverlayConfig({...overlayConfig, offsetX: parseFloat(e.target.value)})} />
                  <span>{overlayConfig.offsetX.toFixed(1)}</span>
                </div>
                <div className="config-row">
                  <label>Offset Y</label>
                  <input type="range" min="-50" max="50" step="0.1" value={overlayConfig.offsetY} onChange={e => setOverlayConfig({...overlayConfig, offsetY: parseFloat(e.target.value)})} />
                  <span>{overlayConfig.offsetY.toFixed(1)}</span>
                </div>
                <div className="config-row">
                  <label>Glass Op</label>
                  <input type="range" min="0" max="1" step="0.05" value={overlayConfig.glassOpacity ?? 0.85} onChange={e => setOverlayConfig({...overlayConfig, glassOpacity: parseFloat(e.target.value)})} />
                  <span>{overlayConfig.glassOpacity?.toFixed(2) ?? '0.85'}</span>
                </div>
                <div className="config-row">
                  <label>Scale X</label>
                  <input type="range" min="30" max="120" step="0.1" value={overlayConfig.scaleX} onChange={e => setOverlayConfig({...overlayConfig, scaleX: parseFloat(e.target.value)})} />
                  <span>{overlayConfig.scaleX.toFixed(1)}</span>
                </div>
                <div className="config-row">
                  <label>Scale Y</label>
                  <input type="range" min="30" max="120" step="0.1" value={overlayConfig.scaleY} onChange={e => setOverlayConfig({...overlayConfig, scaleY: parseFloat(e.target.value)})} />
                  <span>{overlayConfig.scaleY.toFixed(1)}</span>
                </div>
                <div className="config-row">
                  <label>Rotation</label>
                  <input type="range" min="-180" max="180" step="1" value={overlayConfig.rotation} onChange={e => setOverlayConfig({...overlayConfig, rotation: parseInt(e.target.value)})} />
                  <span>{overlayConfig.rotation}°</span>
                </div>
                <div className="config-row checkboxes">
                  <label><input type="checkbox" checked={overlayConfig.flipX} onChange={e => setOverlayConfig({...overlayConfig, flipX: e.target.checked})} /> Flip X</label>
                  <label><input type="checkbox" checked={overlayConfig.flipY} onChange={e => setOverlayConfig({...overlayConfig, flipY: e.target.checked})} /> Flip Y</label>
                </div>
              </div>
            )}
            <label className={`layer-item ${visibleLayers.pinLegend > 0 ? 'active' : ''}`}>
              <div className="layer-color-indicator" style={{ backgroundColor: '#fff' }}></div>
              <input 
                type="checkbox" 
                checked={visibleLayers.pinLegend > 0} 
                onChange={() => toggleLayer('pinLegend')} 
              />
              <span className="layer-name">Pin Legend</span>
            </label>
          </div>
        </>
      )}
        <button 
          className="toggle-all-btn"
          onClick={() => {
            const anyHidden = Object.values(visibleLayers).some(v => !v);
            const nextState = {};
            Object.keys(LAYER_INFO).forEach(id => {
              nextState[id] = anyHidden;
            });
            nextState.diagramOverlay = anyHidden;
            nextState.pinLegend = anyHidden;
            setVisibleLayers(nextState);
          }}
        >
          Toggle All
        </button>
      </div>
  );

  if (isMobile) {
    return (
      <div className="mobile-layer-controls">
        <button 
          className="btn mobile-gear-btn" 
          onClick={() => setShowModal(true)}
          title="Layer Settings"
          style={{ fontSize: '1.5rem', padding: '8px 12px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}
        >
          ⚙️
        </button>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              <h2>Chip Layers</h2>
              {layerContent}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`layer-toggle-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div
        className="panel-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand chip layers' : 'Collapse chip layers'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsCollapsed(!isCollapsed); } }}
      >
        <h2>Chip Layers</h2>
        <button className="collapse-btn" aria-hidden="true" tabIndex={-1} type="button">▼</button>
      </div>
      {layerContent}
    </div>
  );
}
