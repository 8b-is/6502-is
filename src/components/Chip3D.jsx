import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Center, Html, Text } from '@react-three/drei';
import { buildChipGeometries, LAYER_INFO, SCALE } from '../utils/geometryBuilder';
import { getInstructionExplanation } from '../utils/instructionExplanations';
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
  const texture = useLoader(THREE.TextureLoader, '/cd.svg');
  if (!visible) return null;

  // Apply flips via texture repeat
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.x = config.flipX ? -1 : 1;
  texture.repeat.y = config.flipY ? -1 : 1;

  const rot = (config.rotation * Math.PI) / 180;

  return (
    <group>
      {/* 1. Main Dark Glass Pane covering the entire chip */}
      <mesh position={[0, 0, 4.0]}>
        <boxGeometry args={[100, 100, 1.0]} />
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
      <mesh 
        position={[config.offsetX, config.offsetY, 4.6]} 
        rotation={[0, 0, rot]}
      >
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

export default function Chip3D({ visibleLayers, machineState, overlayConfig, layerSpacing = 1.0, themeMode, isEStop }) {
  const [geometries, setGeometries] = useState({});
  const [loading, setLoading] = useState(true);

  const dataArrayRef = useRef(new Uint8Array(2048 * 4));
  const textureRef = useRef(new THREE.DataTexture(dataArrayRef.current, 2048, 1, THREE.RGBAFormat));

  const traceDataArrayRef = useRef(new Uint8Array(2048 * 4));
  const traceTextureRef = useRef(new THREE.DataTexture(traceDataArrayRef.current, 2048, 1, THREE.RGBAFormat));

  const uniformsRef = useRef({
    nodeStateTexture: { value: textureRef.current },
    tracePathTexture: { value: traceTextureRef.current },
    uTime: { value: 0 },
    uSelectedNode: { value: -1.0 },
    uClickPos: { value: new THREE.Vector3() },
    uClickTime: { value: -1000.0 },
    uSafeMode: { value: 0.0 }
  });

  useEffect(() => {
    uniformsRef.current.uSafeMode.value = themeMode === 'safe' ? 1.0 : 0.0;
  }, [themeMode]);

  useEffect(() => {
    setTimeout(() => {
      console.log("Building geometries...");
      const result = buildChipGeometries();
      console.log("Geometries built!");
      setGeometries(result);
      setLoading(false);
      textureRef.current.needsUpdate = true;
    }, 100);
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
      camera={{ position: [0, 40, 60], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => {
        uniformsRef.current.uSelectedNode.value = -1.0;
        traceDataArrayRef.current.fill(0);
        traceTextureRef.current.needsUpdate = true;
      }}
    >
      <color attach="background" args={[themeMode === 'safe' ? '#e0e0e3' : '#050508']} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 30]} intensity={1.5} />
      <directionalLight position={[-10, 20, -10]} intensity={0.5} />

      <Environment files="/potsdamer_platz_1k.hdr" />

      <ShaderUpdater uniformsRef={uniformsRef} isEStop={isEStop} />

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
                      
                      while(queue.length > 0) {
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
                            gl_FragColor = vec4(gl_FragColor.rgb * 0.4, gl_FragColor.a);
                          }
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
                          vec3 baseColor = gl_FragColor.rgb * 1.5 + vec3(0.0, 0.4, 0.8);
                          
                          // Add the bright traveling spark
                          vec3 sparkColor = vec3(0.5, 1.0, 1.0) * 10.0; // Electric cyan
                          float flicker = sin(uTime * 50.0) * 0.2 + 0.8;
                          
                          gl_FragColor = vec4(mix(baseColor, sparkColor * flicker, sparkIntensity), gl_FragColor.a);
                        } else if (nodeState.r > 0.5) {
                          float offset = fract(sin(vNodeId * 12.9898) * 43758.5453);
                          float dir = sign(offset - 0.5); 
                          float scale = 0.02;
                          float speed = 1.5;
                          float lineX = fract((vPos.x * scale * dir + offset * 10.0) - uTime * speed);
                          float lineY = fract((vPos.y * scale * dir + offset * 10.0) - uTime * speed);
                          float sparkX = smoothstep(0.85, 1.0, lineX) * step(lineX, 0.99);
                          float sparkY = smoothstep(0.85, 1.0, lineY) * step(lineY, 0.99);
                          float spark = max(sparkX, sparkY);
                          float flicker = sin(uTime * 30.0 + vNodeId) * 0.2 + 0.8;
                          vec3 baseColor = gl_FragColor.rgb * 1.2;
                          vec3 baseGlow = vec3(0.0, 0.3, 0.7);
                          vec3 sparkColor = vec3(0.6, 0.9, 1.0) * 4.0 * flicker;
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
              {visibleLayers.pinLegend > 0 && <PinLegend />}
            </React.Suspense>
          </group>
        </Center>
      )}

      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI} />
    </Canvas>
  );
}
