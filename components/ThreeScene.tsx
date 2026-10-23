import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Procedural 3D Golden Phra That Phanom Stupa Architectural Silhouette
 */
function PhraThatPhanomStupa() {
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#F5C542',
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 2.0
  });

  const chromeTrimMat = new THREE.MeshStandardMaterial({
    color: '#D8DEE9',
    metalness: 0.98,
    roughness: 0.1
  });

  return (
    <group position={[0, -0.4, 0.05]} scale={[0.95, 0.95, 0.95]}>
      {/* Multi-tiered Plinth */}
      <mesh position={[0, 0.04, 0]} material={goldMat}>
        <boxGeometry args={[0.74, 0.08, 0.74]} />
      </mesh>
      <mesh position={[0, 0.12, 0]} material={chromeTrimMat}>
        <boxGeometry args={[0.66, 0.08, 0.66]} />
      </mesh>
      <mesh position={[0, 0.21, 0]} material={goldMat}>
        <boxGeometry args={[0.58, 0.1, 0.58]} />
      </mesh>

      {/* Middle Lotus Base & Waist */}
      <mesh position={[0, 0.42, 0]} rotation={[0, Math.PI / 4, 0]} material={goldMat}>
        <cylinderGeometry args={[0.26, 0.32, 0.34, 4]} />
      </mesh>
      <mesh position={[0, 0.60, 0]} material={chromeTrimMat}>
        <boxGeometry args={[0.52, 0.04, 0.52]} />
      </mesh>

      {/* Spire Tower (ทรงบัวเหลี่ยมยอดแหลม) */}
      <mesh position={[0, 0.84, 0]} rotation={[0, Math.PI / 4, 0]} material={goldMat}>
        <cylinderGeometry args={[0.15, 0.24, 0.45, 4]} />
      </mesh>
      <mesh position={[0, 1.08, 0]} material={chromeTrimMat}>
        <boxGeometry args={[0.34, 0.03, 0.34]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} rotation={[0, Math.PI / 4, 0]} material={goldMat}>
        <coneGeometry args={[0.13, 0.65, 4]} />
      </mesh>

      {/* Golden Tiered Finial (ฉัตรยอดทองคำ) */}
      <mesh position={[0, 1.76, 0]} material={goldMat}>
        <sphereGeometry args={[0.045, 16, 16]} />
      </mesh>
      <mesh position={[0, 1.86, 0]} material={goldMat}>
        <coneGeometry args={[0.02, 0.15, 8]} />
      </mesh>
    </group>
  );
}

/**
 * 3D "COM" Typographic Mesh in Chrome & Bronze Gold
 */
function ComText3D() {
  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#EAEAEA',
    metalness: 0.96,
    roughness: 0.12
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: '#E65A19',
    metalness: 0.9,
    roughness: 0.2
  });

  return (
    <group position={[0, -0.05, 0.4]} scale={[0.85, 0.85, 0.85]}>
      {/* Letter 'C' */}
      <group position={[-0.55, 0, 0]}>
        <mesh material={chromeMat}>
          <torusGeometry args={[0.26, 0.07, 16, 32, Math.PI * 1.5]} />
        </mesh>
        <mesh position={[0.15, 0.17, 0]} material={goldAccentMat}>
          <boxGeometry args={[0.12, 0.07, 0.14]} />
        </mesh>
        <mesh position={[0.15, -0.17, 0]} material={goldAccentMat}>
          <boxGeometry args={[0.12, 0.07, 0.14]} />
        </mesh>
      </group>

      {/* Letter 'O' */}
      <group position={[0, 0, 0]}>
        <mesh material={chromeMat}>
          <torusGeometry args={[0.26, 0.07, 16, 32]} />
        </mesh>
      </group>

      {/* Letter 'M' */}
      <group position={[0.55, 0, 0]}>
        <mesh position={[-0.18, 0, 0]} material={chromeMat}>
          <boxGeometry args={[0.07, 0.52, 0.14]} />
        </mesh>
        <mesh position={[0.18, 0, 0]} material={chromeMat}>
          <boxGeometry args={[0.07, 0.52, 0.14]} />
        </mesh>
        <mesh position={[-0.09, 0.08, 0]} rotation={[0, 0, -0.45]} material={goldAccentMat}>
          <boxGeometry args={[0.07, 0.36, 0.14]} />
        </mesh>
        <mesh position={[0.09, 0.08, 0]} rotation={[0, 0, 0.45]} material={goldAccentMat}>
          <boxGeometry args={[0.07, 0.36, 0.14]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 3D Cyber Terminal / Laptop Base and Screen
 */
function CyberTerminal() {
  const navyGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#070A18',
    metalness: 0.88,
    roughness: 0.14,
    transparent: true,
    opacity: 0.92,
    clearcoat: 1.0,
    reflectivity: 0.95
  });

  const chromeBorderMat = new THREE.MeshStandardMaterial({
    color: '#D8DEE9',
    metalness: 0.95,
    roughness: 0.15
  });

  const screenBackMat = new THREE.MeshPhysicalMaterial({
    color: '#050711',
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1.0
  });

  return (
    <group>
      {/* 1. Base Keyboard Chassis */}
      <mesh position={[0, -0.55, 0.3]} material={navyGlassMat}>
        <boxGeometry args={[2.5, 0.08, 1.65]} />
      </mesh>
      <mesh position={[0, -0.59, 0.3]} material={chromeBorderMat}>
        <boxGeometry args={[2.52, 0.02, 1.67]} />
      </mesh>

      {/* Trackpad & Key rows highlights */}
      <mesh position={[0, -0.505, 0.72]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.72, 0.46]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.3} />
      </mesh>

      {/* 2. Screen Lid tilted 102 degrees back */}
      <group position={[0, -0.51, -0.52]} rotation={[-0.22, 0, 0]}>
        <mesh position={[0, 0.82, 0]} material={screenBackMat}>
          <boxGeometry args={[2.5, 1.65, 0.06]} />
        </mesh>
        <mesh position={[0, 0.82, 0.035]}>
          <planeGeometry args={[2.36, 1.5]} />
          <meshBasicMaterial color="#030614" transparent opacity={0.96} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Fire-Orange Orbit Rings and Swirling Star Particles
 */
function OrbitalRingAndSparks() {
  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Line>(null);

  // Generate 120 orbiting particles
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 4.8;
    positions[i + 1] = (Math.random() - 0.5) * 3.8;
    positions[i + 2] = (Math.random() - 0.5) * 3.2;
  }

  // Torus / Ellipse points for Orbit
  const curve = new THREE.EllipseCurve(0, 0, 2.15, 1.55, 0, 2 * Math.PI, false, 0);
  const pts = curve.getPoints(140);
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.25;
    }
  });

  return (
    <group>
      <line
        ref={ringRef}
        geometry={orbitGeo}
        rotation={[Math.PI / 3, -Math.PI / 6, 0]}
      >
        <lineBasicMaterial color="#FF7A29" transparent opacity={0.85} linewidth={2} />
      </line>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color="#FF7A29"
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * Interactive Hotspots anchored to 3D Scene
 */
function Hotspots() {
  return (
    <>
      <Html position={[1.4, 0.7, 0]} center>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0C1030]/85 backdrop-blur-md border border-sky-500/40 text-[9px] font-mono text-sky-300 shadow-lg pointer-events-auto cursor-pointer hover:border-[#E65A19] transition">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
          <span>01 // DIGITAL LAB</span>
        </div>
      </Html>

      <Html position={[-1.4, -0.5, 0.4]} center>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0C1030]/85 backdrop-blur-md border border-[#E65A19]/40 text-[9px] font-mono text-[#FF7A29] shadow-lg pointer-events-auto cursor-pointer hover:border-white transition">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E65A19]"></span>
          <span>02 // ACADEMIC PLATFORM</span>
        </div>
      </Html>
    </>
  );
}

export interface ThreeSceneProps {
  className?: string;
}

export default function ThreeScene({ className }: ThreeSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Zero-gravity bobbing
    groupRef.current.position.y = Math.sin(t * 1.3) * 0.08;
    groupRef.current.position.x = Math.cos(t * 0.9) * 0.04;
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.08;
  });

  return (
    <div className={`w-full h-full relative ${className || ''}`}>
      <Canvas
        camera={{ position: [0, 0.4, 4.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.6} color="#0C1030" />
        <directionalLight position={[5, 6, 4]} intensity={2.8} color="#FFFFFF" />
        <pointLight position={[-2.5, 1, 2.5]} intensity={4.5} color="#E65A19" />
        <pointLight position={[2.5, -1, 2.5]} intensity={3.5} color="#38BDF8" />

        <group ref={groupRef}>
          <CyberTerminal />
          <PhraThatPhanomStupa />
          <ComText3D />
          <OrbitalRingAndSparks />
          <Hotspots />
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.75}
          minPolarAngle={Math.PI / 2.6}
        />
      </Canvas>
    </div>
  );
}
