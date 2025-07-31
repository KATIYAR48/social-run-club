'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder, Cone } from '@react-three/drei';
import * as THREE from 'three';

interface RunnerProps {
  gender: 'male' | 'female';
}

function RunningFigure({ gender }: RunnerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
      // Subtle body bob
      groupRef.current.position.y = Math.sin(time * 8) * 0.08;
      // Slight forward lean for running posture
      groupRef.current.rotation.x = 0.1;
    }

    // Torso slight rotation for natural running motion
    if (torsoRef.current) {
      torsoRef.current.rotation.y = Math.sin(time * 8) * 0.05;
    }

    // Leg animation - alternating running motion with more realistic movement
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = Math.sin(time * 8) * 0.8 - 0.2;
      rightLegRef.current.rotation.x = Math.sin(time * 8 + Math.PI) * 0.8 - 0.2;
      
      // Hip movement
      leftLegRef.current.position.y = 0.2 + Math.sin(time * 8) * 0.05;
      rightLegRef.current.position.y = 0.2 + Math.sin(time * 8 + Math.PI) * 0.05;
    }

    // Arm animation - opposite to legs with more dynamic movement
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(time * 8 + Math.PI) * 0.6 - 0.3;
      rightArmRef.current.rotation.x = Math.sin(time * 8) * 0.6 - 0.3;
      
      // Slight arm swing back
      leftArmRef.current.rotation.z = Math.sin(time * 8 + Math.PI) * 0.1;
      rightArmRef.current.rotation.z = -Math.sin(time * 8) * 0.1;
    }
  });

  // Body proportions based on gender
  const bodyScale = gender === 'male' ? 1.1 : 0.95;
  const shoulderWidth = gender === 'male' ? 0.7 : 0.6;
  const chestDepth = gender === 'male' ? 0.35 : 0.28;
  const waistWidth = gender === 'male' ? 0.5 : 0.45;

  // Grey material for the entire body
  const greyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#6b7280',
    roughness: 0.3,
    metalness: 0.1,
    flatShading: true // Low-poly aesthetic
  }), []);

  const darkGreyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#4b5563',
    roughness: 0.4,
    metalness: 0.1,
    flatShading: true
  }), []);

  const shoesMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#1f2937',
    roughness: 0.6,
    metalness: 0.0,
    flatShading: true
  }), []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Head - Low poly octahedron for more defined look */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <octahedronGeometry args={[0.18, 1]} />
        <primitive object={greyMaterial} />
      </mesh>

      {/* Neck */}
      <Cylinder args={[0.06, 0.08, 0.15]} position={[0, 1.55, 0]} castShadow>
        <primitive object={greyMaterial} />
      </Cylinder>

      <group ref={torsoRef}>
        {/* Upper Torso/Chest */}
        <mesh position={[0, 1.3, 0]} castShadow>
          <boxGeometry args={[shoulderWidth, 0.5 * bodyScale, chestDepth]} />
          <primitive object={greyMaterial} />
        </mesh>

        {/* Lower Torso/Abs */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[waistWidth, 0.35 * bodyScale, chestDepth * 0.9]} />
          <primitive object={greyMaterial} />
        </mesh>
      </group>

      {/* Left Shoulder */}
      <Sphere args={[0.12]} position={[-shoulderWidth/2, 1.45, 0]} castShadow>
        <primitive object={darkGreyMaterial} />
      </Sphere>

      {/* Right Shoulder */}
      <Sphere args={[0.12]} position={[shoulderWidth/2, 1.45, 0]} castShadow>
        <primitive object={darkGreyMaterial} />
      </Sphere>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-shoulderWidth/2 - 0.05, 1.3, 0]}>
        {/* Upper Arm */}
        <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <primitive object={greyMaterial} />
        </mesh>
        {/* Elbow */}
        <Sphere args={[0.08]} position={[0, -0.42, 0]}>
          <primitive object={darkGreyMaterial} />
        </Sphere>
        {/* Forearm */}
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[0.1, 0.35, 0.1]} />
          <primitive object={greyMaterial} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.88, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.06]} />
          <primitive object={darkGreyMaterial} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[shoulderWidth/2 + 0.05, 1.3, 0]}>
        {/* Upper Arm */}
        <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <primitive object={greyMaterial} />
        </mesh>
        {/* Elbow */}
        <Sphere args={[0.08]} position={[0, -0.42, 0]}>
          <primitive object={darkGreyMaterial} />
        </Sphere>
        {/* Forearm */}
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[0.1, 0.35, 0.1]} />
          <primitive object={greyMaterial} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.88, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.06]} />
          <primitive object={darkGreyMaterial} />
        </mesh>
      </group>

      {/* Waist/Hip */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[waistWidth, 0.25, chestDepth * 0.8]} />
        <primitive object={greyMaterial} />
      </mesh>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.18, 0.2, 0]}>
        {/* Hip Joint */}
        <Sphere args={[0.1]} position={[0, 0.15, 0]}>
          <primitive object={darkGreyMaterial} />
        </Sphere>
        {/* Thigh */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.15, 0.45, 0.15]} />
          <primitive object={greyMaterial} />
        </mesh>
        {/* Knee */}
        <Sphere args={[0.09]} position={[0, -0.42, 0]}>
          <primitive object={darkGreyMaterial} />
        </Sphere>
        {/* Shin */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <primitive object={greyMaterial} />
        </mesh>
        {/* Ankle */}
        <Sphere args={[0.07]} position={[0, -0.85, 0]}>
          <primitive object={darkGreyMaterial} />
        </Sphere>
        {/* Foot */}
        <mesh position={[0.12, -0.95, 0]} castShadow>
          <boxGeometry args={[0.28, 0.1, 0.15]} />
          <primitive object={shoesMaterial} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.18, 0.2, 0]}>
        {/* Hip Joint */}
        <Sphere args={[0.1]} position={[0, 0.15, 0]}>
          <primitive object={darkGreyMaterial} />
        </Sphere>
        {/* Thigh */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.15, 0.45, 0.15]} />
          <primitive object={greyMaterial} />
        </mesh>
        {/* Knee */}
        <Sphere args={[0.09]} position={[0, -0.42, 0]}>
          <primitive object={darkGreyMaterial} />
        </Sphere>
        {/* Shin */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <primitive object={greyMaterial} />
        </mesh>
        {/* Ankle */}
        <Sphere args={[0.07]} position={[0, -0.85, 0]}>
          <primitive object={darkGreyMaterial} />
        </Sphere>
        {/* Foot */}
        <mesh position={[0.12, -0.95, 0]} castShadow>
          <boxGeometry args={[0.28, 0.1, 0.15]} />
          <primitive object={shoesMaterial} />
        </mesh>
      </group>
    </group>
  );
}

export default function ThreeJsRunner({ gender }: RunnerProps) {
  const cameraPosition = useMemo(() => new THREE.Vector3(0, 1, 4), []);

  return (
    <div className="w-full h-64 bg-black rounded-lg overflow-hidden border border-zinc-800">
      <Canvas
        camera={{ position: cameraPosition, fov: 45 }}
        gl={{ antialias: true }}
        shadows
      >
        {/* Enhanced gym-like lighting setup for low-poly grey model */}
        {/* Key light from top-front for main illumination */}
        <directionalLight
          position={[3, 5, 3]}
          intensity={1.2}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Rim light from behind-left to create dramatic silhouette */}
        <directionalLight
          position={[-3, 3, -2]}
          intensity={0.6}
          color="#8b9dc3"
        />
        
        {/* Fill light from the right for muscle definition */}
        <pointLight
          position={[2, 1.5, 2]}
          intensity={0.5}
          color="#ffffff"
        />
        
        {/* Subtle ambient light to prevent harsh shadows */}
        <ambientLight intensity={0.15} color="#404040" />
        
        {/* Ground plane for shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color="#0a0a0a" transparent opacity={0.3} />
        </mesh>

        <RunningFigure gender={gender} />
      </Canvas>
    </div>
  );
}