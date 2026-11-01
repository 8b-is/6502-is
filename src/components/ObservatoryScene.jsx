import { useEffect, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export function ObservatoryCamera({ viewMode, autoRotate, resetKey, isEStop }) {
  const controls = useRef(null);
  const { camera, size } = useThree();
  useEffect(() => {
    const distance = 175 * Math.max(1, 1 / (size.width / size.height));
    const direction = viewMode === 'top'
      ? new THREE.Vector3(0, 1, 0.001)
      : new THREE.Vector3(0.55, 0.95, 1);
    camera.position.copy(direction.normalize().multiplyScalar(distance));
    camera.lookAt(0, 0, 0);
    if (controls.current) {
      controls.current.target.set(0, 0, 0);
      controls.current.update();
    }
  }, [camera, size.width, size.height, viewMode, resetKey]);
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.06}
    autoRotate={autoRotate && !isEStop && viewMode !== 'top'} autoRotateSpeed={0.3}
    minDistance={25} maxDistance={550} minPolarAngle={0.001} maxPolarAngle={Math.PI * 0.86} />;
}

export function ObservatoryAtmosphere({ still }) {
  const dust = useRef(null);
  const positions = useMemo(() => {
    const points = new Float32Array(330 * 3);
    for (let i = 0; i < 330; i++) {
      const angle = i * 2.399963;
      const radius = 85 + ((i * 47) % 140);
      points[i * 3] = Math.cos(angle) * radius;
      points[i * 3 + 1] = ((i * 73) % 160) - 80;
      points[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return points;
  }, []);
  useFrame((_, delta) => {
    if (!still && dust.current) dust.current.rotation.y += delta * 0.007;
  });
  return (
    <group>
      <points ref={dust} raycast={() => null}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
        <pointsMaterial color="#9dbca9" size={0.27} transparent opacity={0.45} depthWrite={false} />
      </points>
      <group position={[0, -15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[68, 73, 93].map((radius, index) => (
          <mesh key={radius} raycast={() => null}>
            <ringGeometry args={[radius, radius + (index === 1 ? 0.16 : 0.08), 180]} />
            <meshBasicMaterial color={index === 1 ? '#b1c69c' : '#79bda7'} transparent opacity={index === 1 ? 0.25 : 0.12} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
        {Array.from({ length: 48 }, (_, index) => {
          const angle = index * Math.PI / 24;
          return <mesh key={index} position={[Math.cos(angle) * 73, Math.sin(angle) * 73, 0]} rotation={[0, 0, angle]} raycast={() => null}>
            <planeGeometry args={[index % 4 === 0 ? 2 : 0.8, 0.12]} />
            <meshBasicMaterial color="#a9c8ac" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>;
        })}
      </group>
    </group>
  );
}
