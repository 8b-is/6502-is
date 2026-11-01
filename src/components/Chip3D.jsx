import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Center, Text } from '@react-three/drei';
import { ObservatoryCamera, ObservatoryAtmosphere } from './ObservatoryScene';
import { buildChipGeometries, LAYER_INFO, SCALE } from '../utils/geometryBuilder';
import { nodes, toggleNode, ngnd, npwr } from '../simulation/engine';
import { padPositions } from '../data/padPositions';
import * as THREE from 'three';

function ShaderUpdater({ uniformsRef, isEStop }) {
  useFrame((state, delta) => {
    if (!isEStop) {
      uniformsRef.current.uTime.value += delta;
    }
  });
  return null;
}

function PinLegend({ visible }) {
  if (!visible) return null;
  const cx = 5000;
  const cy = 5000;

  return (
    <group position={[0, 0, 1.5]}>
      {Object.entries(padPositions).map(([name, pos]) => (
        <Text
          key={name}
          position={[(pos.x - cx) * SCALE, (pos.y - cy) * SCALE, 3.0]}
          fontSize={1.2}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {name.toUpperCase()}
        </Text>
      ))}
    </group>
  );
}

function PlexiglassOverlay({ visible, config }) {
  // Removed Date.now() to prevent infinite re-fetching
  const texture = useLoader(THREE.TextureLoader, '/bcd.svg');
  if (!visible) return null;

  const rot = (config.rotation * Math.PI) / 180;

  return (
    <group position={[config.offsetX, config.offsetY, 4.0]} rotation={[0, 0, rot]}>
      {/* 1. Main Dark Glass Pane matching schematic size */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[config.scaleX, config.scaleY, 1.0]} />
        <meshPhysicalMaterial
          color="#000000"
          transparent={true}
          opacity={config.glassOpacity ?? 0.85}
          transmission={0.0} // Removed transmission for a smoked matte look
          roughness={0.9} // High roughness for brushed/matte look
          metalness={0.2}
          clearcoat={0.0} // Removed clearcoat to remove shiny reflections
        />
      </mesh>

      {/* 2. Emissive Diagram Overlay floating just above the glass */}
      <mesh position={[0, 0, 0.6]} scale={[config.flipX ? -1 : 1, config.flipY ? -1 : 1, 1]}>
        <planeGeometry args={[config.scaleX, config.scaleY]} />
        <meshBasicMaterial
          map={texture}
          color="#00ff00"
          transparent={true}
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Chip3D({ visibleLayers, machineState, overlayConfig, layerSpacing = 1.0, themeMode, isEStop, viewMode = 'orbit', autoRotate = false, resetKey = 0 }) {
  const [geometries, setGeometries] = useState({});
  const [loading, setLoading] = useState(true);

  const [gpu] = useState(() => {
    const data = new Uint8Array(2048 * 4);
    const traceData = new Uint8Array(2048 * 4);
    const texture = new THREE.DataTexture(data, 2048, 1, THREE.RGBAFormat);
    const traceTexture = new THREE.DataTexture(traceData, 2048, 1, THREE.RGBAFormat);
    return { data, traceData, texture, traceTexture, uniforms: {
      nodeStateTexture: { value: texture },
      tracePathTexture: { value: traceTexture },
      uTime: { value: 0 },
      uSelectedNode: { value: -1.0 },
      uClickPos: { value: new THREE.Vector3() },
      uClickTime: { value: -1000.0 },
      uSafeMode: { value: 0.0 },
    } };
  });
  const dataArrayRef = useRef(gpu.data);
  const textureRef = useRef(gpu.texture);
  const traceDataArrayRef = useRef(gpu.traceData);
  const traceTextureRef = useRef(gpu.traceTexture);
  const uniformsRef = useRef(gpu.uniforms);

  useEffect(() => () => {
    gpu.texture.dispose();
    gpu.traceTexture.dispose();
  }, [gpu]);

  useEffect(() => {
    uniformsRef.current.uSafeMode.value = themeMode === 'safe' ? 1.0 : 0.0;
  }, [themeMode]);

  useEffect(() => {
    let result;
    const timer = setTimeout(() => {
      result = buildChipGeometries();
      setGeometries(result);
      setLoading(false);
      textureRef.current.needsUpdate = true;
    }, 100);
    return () => {
      clearTimeout(timer);
      if (result) Object.values(result).forEach(geometry => geometry?.dispose());
    };
  }, []);

  const updateNodeTexture = React.useCallback(() => {
    if (!nodes) return;
    const data = dataArrayRef.current;
    let changed = false;

    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i]) continue;
      const state = nodes[i].state ? 255 : 0;
      if (data[i * 4] !== state) {
        data[i * 4] = state; // R
        data[i * 4 + 1] = state; // G
        data[i * 4 + 2] = state; // B
        data[i * 4 + 3] = 255; // A
        changed = true;
      }
    }
    if (changed) {
      textureRef.current.needsUpdate = true;
    }
  }, []);

  useEffect(() => {
    if (!machineState) return;
    updateNodeTexture();
  }, [machineState, updateNodeTexture]);

  return (
    <Canvas
      camera={{ position: [65, 112, 118], fov: 45, near: 0.1, far: 1500 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      onPointerMissed={() => {
        uniformsRef.current.uSelectedNode.value = -1.0;
        traceDataArrayRef.current.fill(0);
        traceTextureRef.current.needsUpdate = true;
      }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[10, 80, 30]} intensity={2.4} color="#d4ffe3" />
      <directionalLight position={[-60, 20, -40]} intensity={1.5} color="#e9c997" />
      <pointLight position={[0, -12, 40]} intensity={35} color="#74ffcb" decay={1} />
      <React.Suspense fallback={null}><Environment files="/potsdamer_platz_1k.hdr" /></React.Suspense>
      <ObservatoryAtmosphere still={isEStop || themeMode === 'safe'} />
      <ShaderUpdater uniformsRef={uniformsRef} isEStop={isEStop || themeMode === 'safe'} />

      {loading && (
        <mesh>
          <sphereGeometry args={[2, 16, 16]} />
          <meshStandardMaterial color="#888888" wireframe />
        </mesh>
      )}

      {!loading && (
        <Center>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {Object.keys(geometries).map(layerId => {
              if (!visibleLayers[layerId] || visibleLayers[layerId] <= 0 || !geometries[layerId]) return null;

              const info = LAYER_INFO[layerId] || { color: '#ffffff' };
              const isVia = layerId === '6';

              return (
                <mesh
                  key={layerId}
                  geometry={geometries[layerId]}
                  position={[0, 0, info.z * (layerSpacing - 1.0)]}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (e.face) {
                      const geom = geometries[layerId];
                      const nodeId = geom.attributes.aNodeId.array[e.face.a];

                      const traceData = traceDataArrayRef.current;
                      traceData.fill(0);

                      const visited = new Set();
                      const queue = [nodeId];

                      while (queue.length > 0) {
                        const currId = queue.shift();
                        if (visited.has(currId)) continue;
                        visited.add(currId);

                        traceData[currId * 4] = 255;
                        traceData[currId * 4 + 1] = 255;
                        traceData[currId * 4 + 2] = 255;
                        traceData[currId * 4 + 3] = 255;

                        // Prevent trace explosion by NOT traversing through power/ground rails
                        if (currId === ngnd || currId === npwr) {
                          continue;
                        }

                        const n = nodes[currId];
                        if (n && n.c1c2s) {
                          for (let i = 0; i < n.c1c2s.length; i++) {
                            const trans = n.c1c2s[i];
                            if (trans.on) {
                              const otherId = (trans.c1 === currId) ? trans.c2 : trans.c1;
                              if (!visited.has(otherId)) {
                                queue.push(otherId);
                              }
                            }
                          }
                        }
                      }

                      traceTextureRef.current.needsUpdate = true;

                      uniformsRef.current.uSelectedNode.value = nodeId;
                      uniformsRef.current.uClickPos.value.copy(e.point);
                      uniformsRef.current.uClickTime.value = uniformsRef.current.uTime.value;
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (e.face) {
                      const geom = geometries[layerId];
                      const nodeId = geom.attributes.aNodeId.array[e.face.a];
                      toggleNode(nodeId);
                      updateNodeTexture();
                    }
                  }}
                >
                  <meshPhysicalMaterial
                    color={info.color}
                    metalness={layerId === '0' || isVia ? 0.9 : 0.5}
                    roughness={layerId === '0' || isVia ? 0.2 : 0.4}
                    clearcoat={0.8}
                    clearcoatRoughness={0.2}
                    side={THREE.DoubleSide}
                    transmission={0}
                    transparent={visibleLayers[layerId] < 1.0}
                    opacity={visibleLayers[layerId]}
                    thickness={0}
                    onBeforeCompile={(shader) => {
                      shader.uniforms.nodeStateTexture = uniformsRef.current.nodeStateTexture;
                      shader.uniforms.tracePathTexture = uniformsRef.current.tracePathTexture;
                      shader.uniforms.uTime = uniformsRef.current.uTime;
                      shader.uniforms.uSelectedNode = uniformsRef.current.uSelectedNode;
                      shader.uniforms.uClickPos = uniformsRef.current.uClickPos;
                      shader.uniforms.uClickTime = uniformsRef.current.uClickTime;
                      shader.uniforms.uSafeMode = uniformsRef.current.uSafeMode;

                      shader.vertexShader = `
                        attribute float aNodeId;
                        varying float vNodeId;
                        varying vec3 vPos;
                        varying vec3 vWorldPos;
                        \n${shader.vertexShader}
                      `.replace(
                        `#include <begin_vertex>`,
                        `#include <begin_vertex>\n vNodeId = aNodeId;\n vPos = position;\n vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`
                      );

                      let fragmentReplacement = `
                        vec4 nodeState = texture2D(nodeStateTexture, vec2(vNodeId / 2048.0, 0.5));
                        vec4 traceState = texture2D(tracePathTexture, vec2(vNodeId / 2048.0, 0.5));
                        
                        bool isTraced = traceState.r > 0.5;
                        bool isSafeMode = uSafeMode > 0.5;
                        
                        if (isSafeMode) {
                          if (nodeState.r > 0.5) {
                            gl_FragColor = vec4(gl_FragColor.rgb * 1.5, gl_FragColor.a);
                          } else {
                            gl_FragColor = vec4(gl_FragColor.rgb * 0.65, gl_FragColor.a);
                          }
                          if (isTraced) gl_FragColor.rgb += vec3(0.15, 0.4, 0.25);
                        } else if (isTraced) {
                          float timeSinceClick = mod(max(0.0, uTime - uClickTime), 4.0);
                          
                          // Manhattan distance perfectly maps to orthogonal wire routing
                          float manhattanDist = abs(vWorldPos.x - uClickPos.x) + abs(vWorldPos.y - uClickPos.y);
                          
                          // Traveling spark front
                          float speed = 40.0;
                          float sparkFront = timeSinceClick * speed;
                          float tailLength = 8.0;
                          
                          // Spark intensity based on distance from the moving front
                          float sparkIntensity = smoothstep(sparkFront - tailLength, sparkFront, manhattanDist) * step(manhattanDist, sparkFront + 0.5);
                          
                          // Make the line itself glow a bit
                          vec3 baseColor = gl_FragColor.rgb + vec3(0.1, 0.35, 0.2);
                          
                          // A soft signal front, never a strobe.
                          vec3 sparkColor = vec3(0.7, 1.0, 0.8) * 1.4;
                          float flicker = 1.0;
                          
                          gl_FragColor = vec4(mix(baseColor, sparkColor * flicker, sparkIntensity), gl_FragColor.a);
                        } else if (nodeState.r > 0.5) {
                          float offset = fract(sin(vNodeId * 12.9898) * 43758.5453);
                          float dir = sign(offset - 0.5); 
                          float scale = 0.02;
                          float speed = 0.12;
                          float lineX = fract((vPos.x * scale * dir + offset * 10.0) - uTime * speed);
                          float lineY = fract((vPos.y * scale * dir + offset * 10.0) - uTime * speed);
                          float sparkX = smoothstep(0.85, 1.0, lineX) * step(lineX, 0.99);
                          float sparkY = smoothstep(0.85, 1.0, lineY) * step(lineY, 0.99);
                          float spark = max(sparkX, sparkY);
                          vec3 baseColor = gl_FragColor.rgb * 1.2;
                          vec3 baseGlow = vec3(0.06, 0.17, 0.12);
                          vec3 sparkColor = vec3(0.45, 0.7, 0.5) * 0.65;
                          gl_FragColor = vec4(baseColor + baseGlow + sparkColor * spark, gl_FragColor.a);
                        } else {
                          gl_FragColor = vec4(gl_FragColor.rgb * 0.4, gl_FragColor.a);
                        }
                      `;

                      if (isVia) {
                        fragmentReplacement = `
                        vec4 nodeState = texture2D(nodeStateTexture, vec2(vNodeId / 2048.0, 0.5));
                        if (nodeState.r > 0.5) {
                          float flow = sin(vPos.z * 10.0 - uTime * 15.0) * 0.5 + 0.5;
                          vec3 baseGlow = vec3(0.5, 0.2, 1.0);
                          vec3 pulseColor = mix(baseGlow * 0.5, baseGlow * 3.0, flow);
                          gl_FragColor = vec4(gl_FragColor.rgb * 0.8 + pulseColor, 1.0);
                        } else {
                          gl_FragColor = vec4(gl_FragColor.rgb * 0.2, 1.0);
                        }
                        `;
                      }

                      shader.fragmentShader = `
                        uniform sampler2D nodeStateTexture;
                        uniform sampler2D tracePathTexture;
                        uniform float uTime;
                        uniform float uSelectedNode;
                        uniform vec3 uClickPos;
                        uniform float uClickTime;
                        uniform float uSafeMode;
                        varying float vNodeId;
                        varying vec3 vPos;
                        varying vec3 vWorldPos;
                        \n${shader.fragmentShader}
                      `.replace(
                        `#include <dithering_fragment>`,
                        `#include <dithering_fragment>\n${fragmentReplacement}`
                      );
                    }}
                  />
                </mesh>
              );
            })}
            <React.Suspense fallback={null}>
              {/* Overlays */}
              <PlexiglassOverlay visible={visibleLayers.diagramOverlay > 0} config={overlayConfig} />
              {visibleLayers.pinLegend > 0 && <PinLegend visible />}
            </React.Suspense>
          </group>
        </Center>
      )}

      <ObservatoryCamera viewMode={viewMode} autoRotate={autoRotate} resetKey={resetKey} isEStop={isEStop} />
    </Canvas>
  );
}
