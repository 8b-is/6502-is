import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { segdefs } from '../data/segdefs';

export const CHIP_SIZE = 10000;
export const SCALE = 100 / CHIP_SIZE; // Scale the 10000 coordinate system down to roughly 100 units

export const LAYER_INFO = {
  3: { name: 'Grounded Diffusion', z: 0.0, extrude: 0.5, color: '#4DFF4D' },
  4: { name: 'Powered Diffusion', z: 0.0, extrude: 0.5, color: '#FF4D4D' },
  1: { name: 'Switched Diffusion', z: 0.0, extrude: 0.5, color: '#FFFF00' },
  2: { name: 'Input Diode', z: 0.5, extrude: 0.2, color: '#FF00FF' },
  5: { name: 'Polysilicon', z: 1.0, extrude: 0.5, color: '#801AC0' },
  0: { name: 'Metal', z: 2.5, extrude: 0.5, color: '#b0b0d0' },
};

export function buildChipGeometries() {
  const geometriesByLayer = {};

  // Initialize arrays for each layer
  Object.keys(LAYER_INFO).forEach(layer => {
    geometriesByLayer[layer] = [];
  });

  // Keep a center offset to center the chip at (0,0)
  const cx = 5000;
  const cy = 5000;

  for (let i = 0; i < segdefs.length; i++) {
    const seg = segdefs[i];
    const layer = seg[2];
    
    // Some layer numbers might be undefined in our mapping, fallback to layer 0 properties if missing
    const info = LAYER_INFO[layer] || { z: 0, extrude: 0.1 };

    const pts = seg.slice(3);
    if (pts.length < 6) continue; // Need at least 3 points for a shape

    const shape = new THREE.Shape();
    shape.moveTo((pts[0] - cx) * SCALE, (pts[1] - cy) * SCALE);

    for (let j = 2; j < pts.length; j += 2) {
      shape.lineTo((pts[j] - cx) * SCALE, (pts[j + 1] - cy) * SCALE);
    }

    const extrudeSettings = {
      depth: info.extrude,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Position the geometry at the correct Z-height
    geometry.translate(0, 0, info.z);

    // Add node ID attribute
    const nodeNum = seg[0];
    const positionAttribute = geometry.attributes.position;
    const nodeIds = new Float32Array(positionAttribute.count);
    for (let j = 0; j < positionAttribute.count; j++) {
      nodeIds[j] = nodeNum;
    }
    geometry.setAttribute('aNodeId', new THREE.BufferAttribute(nodeIds, 1));

    if (geometriesByLayer[layer]) {
      geometriesByLayer[layer].push(geometry);
    }
  }

  // Merge geometries for each layer into a single BufferGeometry
  const mergedMeshes = {};
  for (const layer in geometriesByLayer) {
    if (geometriesByLayer[layer].length > 0) {
      mergedMeshes[layer] = mergeGeometries(geometriesByLayer[layer], false);
      
      // Dispose original geometries to free memory
      for (const geom of geometriesByLayer[layer]) {
        geom.dispose();
      }
    }
  }

  return mergedMeshes;
}
