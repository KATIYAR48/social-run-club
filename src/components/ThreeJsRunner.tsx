'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import * as THREE from 'three';

interface RunnerProps {
    gender: 'male' | 'female';
}

function RunningFigure({ gender }: RunnerProps) {
    const groupRef = useRef<THREE.Group>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const modelRef = useRef<THREE.Group>(null);

    // Load the FBX model - using male.fbx for now, could be extended for female
    const modelPath = gender === 'male' ? '/models/male.fbx' : '/models/female.fbx';
    const fbx = useLoader(FBXLoader, modelPath);

    useEffect(() => {
        if (fbx) {
            // Calculate proper scaling based on model bounds
            const box = new THREE.Box3().setFromObject(fbx);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // Scale the model to fit within a reasonable size (target height ~12 units for better visibility)
            const maxDimension = Math.max(size.x, size.y, size.z);
            const targetSize = 12; // Much larger target size for better visibility
            const scale = targetSize / maxDimension;
            fbx.scale.setScalar(scale);

            // Center the model at origin after scaling
            fbx.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
            fbx.rotation.y = 0; // No rotation initially

            // Set up shadows and inspect model structure
            let boneCount = 0;
            let meshCount = 0;
            fbx.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    meshCount++;
                    console.log('Mesh found:', child.name);

                    // Check if mesh has a skeleton (skinned mesh)
                    const skinnedMesh = child as THREE.SkinnedMesh;
                    if (skinnedMesh.skeleton) {
                        console.log('Skeleton bones:', skinnedMesh.skeleton.bones.length);
                        boneCount += skinnedMesh.skeleton.bones.length;
                    }
                }
                if (child instanceof THREE.Bone) {
                    console.log('Bone found:', child.name);
                }
            });
            console.log(`Model structure: ${meshCount} meshes, ${boneCount} bones`);

            // Set up animations if they exist
            if (fbx.animations && fbx.animations.length > 0) {
                console.log('Setting up animations...');

                // Try creating mixer with the original FBX object instead of cloned model
                const mixer = new THREE.AnimationMixer(fbx);
                mixerRef.current = mixer;

                // Play all animations (in case there are multiple)
                fbx.animations.forEach((clip, index) => {
                    console.log(`Animation ${index}:`, clip.name, 'Duration:', clip.duration);
                    console.log('Animation tracks:', clip.tracks.length);

                    // Log some track info
                    clip.tracks.slice(0, 3).forEach((track, i) => {
                        console.log(`Track ${i}:`, track.name, 'Type:', track.constructor.name);
                    });

                    const action = mixer.clipAction(clip);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.clampWhenFinished = false;
                    action.enabled = true;
                    action.timeScale = 0.6; // Even slower for debugging
                    action.weight = 1; // Full weight
                    action.play();

                    console.log(`Started animation: ${clip.name} at ${action.timeScale}x speed`);
                    console.log('Action isRunning:', action.isRunning(), 'paused:', action.paused);
                });


            } else {
                console.warn('No animations found in FBX model');
            }

            // Add the FBX to the group
            if (groupRef.current) {
                groupRef.current.clear();
                groupRef.current.add(fbx);
                modelRef.current = fbx;
            }
        }
    }, [fbx]);

    useFrame((state, delta) => {
        // Update animation mixer with delta time - this is crucial for animations to work
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Reference cube to help with positioning */}
            <mesh position={[2, 0, 0]} castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
            </mesh>
        </group>
    );
}



export default function ThreeJsRunner({ gender }: RunnerProps) {
    const [cameraHeight, setCameraHeight] = useState(6); // Much closer to model
    const [cameraDistance, setCameraDistance] = useState(
        12
    ); // Much closer distance
    const [cameraRotationY, setCameraRotationY] = useState(491 * Math.PI / 180); // Yaw (horizontal) - 124°
    const [cameraRotationX, setCameraRotationX] = useState(-23 * Math.PI / 180); // Pitch (vertical) - -23°
    const [cameraFov, setCameraFov] = useState(75); // Slightly narrower FOV for better focus
    const [showControls, setShowControls] = useState(false);
    const [useCustomCamera, setUseCustomCamera] = useState(true);

    const initialCameraPosition = useMemo(() => {
        const x = Math.cos(cameraRotationY) * Math.cos(cameraRotationX) * cameraDistance;
        const y = Math.sin(cameraRotationX) * cameraDistance + cameraHeight;
        const z = Math.sin(cameraRotationY) * Math.cos(cameraRotationX) * cameraDistance;
        return new THREE.Vector3(x, y, z);
    }, [cameraRotationY, cameraRotationX, cameraDistance, cameraHeight]);

    return (
        <div className="h-64 w-64 bg-black rounded-lg overflow-hidden border border-zinc-800 relative">
            <Canvas
                camera={{ position: initialCameraPosition, fov: cameraFov }}
                gl={{ antialias: true }}
                shadows
            >

                {/* Enhanced lighting setup for the FBX model */}
                {/* Key light from top-front for main illumination */}
                <directionalLight
                    position={[3, 5, 3]}
                    intensity={1.5}
                    color="#ffffff"
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />

                {/* Rim light from behind-left to create dramatic silhouette */}
                <directionalLight
                    position={[-3, 3, -2]}
                    intensity={0.8}
                    color="#8b9dc3"
                />

                {/* Fill light from the right for definition */}
                <pointLight
                    position={[2, 1.5, 2]}
                    intensity={0.7}
                    color="#ffffff"
                />

                {/* Subtle ambient light to prevent harsh shadows */}
                <ambientLight intensity={0.4} color="#404040" /> {/* Increased ambient light */}

                {/* Ground plane for shadows */}
                {/* 
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
                    <planeGeometry args={[10, 10]} />  
                    <meshStandardMaterial color="#0a0a0a" transparent opacity={0.3} />
                </mesh> 
                */}

                <RunningFigure gender={gender} />
            </Canvas>

            {/* Camera Control Panel */}
            {showControls && (
                <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-80 p-3 rounded border border-gray-600">
                    <div className="font-bold mb-2">🎮 Camera Controls</div>

                    {/* Camera Mode Toggle */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span>Mode:</span>
                            <button
                                onClick={() => setUseCustomCamera(true)}
                                className={`px-2 py-1 rounded text-xs ${useCustomCamera ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                            >
                                Custom
                            </button>
                            <button
                                onClick={() => setUseCustomCamera(false)}
                                className={`px-2 py-1 rounded text-xs ${!useCustomCamera ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                            >
                                Mouse
                            </button>
                        </div>
                    </div>

                    {/* Height Controls */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span>Height:</span>
                            <button
                                onClick={() => setCameraHeight(h => Math.max(0, h - 0.5))}
                                className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                ↓
                            </button>
                            <span className="w-8 text-center">{cameraHeight.toFixed(1)}</span>
                            <button
                                onClick={() => setCameraHeight(h => h + 0.5)}
                                className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                ↑
                            </button>
                        </div>
                    </div>

                    {/* Distance Controls */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span>Distance:</span>
                            <button
                                onClick={() => setCameraDistance(d => Math.max(0.5, d - 0.5))}
                                className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                ←
                            </button>
                            <span className="w-8 text-center">{cameraDistance.toFixed(1)}</span>
                            <button
                                onClick={() => setCameraDistance(d => d + 0.5)}
                                className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                →
                            </button>
                        </div>
                    </div>

                    {/* Horizontal Rotation (Yaw) Controls */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span>Yaw:</span>
                            <button
                                onClick={() => setCameraRotationY(r => r - 0.2)}
                                className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                ↶
                            </button>
                            <span className="w-8 text-center">{(cameraRotationY * 180 / Math.PI).toFixed(0)}°</span>
                            <button
                                onClick={() => setCameraRotationY(r => r + 0.2)}
                                className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                ↷
                            </button>
                        </div>
                    </div>

                    {/* Vertical Rotation (Pitch) Controls */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span>Pitch:</span>
                            <button
                                onClick={() => setCameraRotationX(r => Math.max(-Math.PI / 2 + 0.1, r - 0.2))}
                                className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                ↓
                            </button>
                            <span className="w-8 text-center">{(cameraRotationX * 180 / Math.PI).toFixed(0)}°</span>
                            <button
                                onClick={() => setCameraRotationX(r => Math.min(Math.PI / 2 - 0.1, r + 0.2))}
                                className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                ↑
                            </button>
                        </div>
                    </div>

                    {/* FOV Controls */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span>FOV:</span>
                            <button
                                onClick={() => setCameraFov(f => Math.max(10, f - 10))}
                                className="bg-teal-600 hover:bg-teal-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                −
                            </button>
                            <span className="w-8 text-center">{cameraFov}°</span>
                            <button
                                onClick={() => setCameraFov(f => Math.min(180, f + 10))}
                                className="bg-teal-600 hover:bg-teal-700 px-2 py-1 rounded text-xs"
                                disabled={!useCustomCamera}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Preset Views */}
                    <div className="mb-3">
                        <div className="text-xs mb-1">Presets:</div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => {
                                    setCameraHeight(6);
                                    setCameraDistance(15);
                                    setCameraRotationY(0);
                                    setCameraRotationX(0);
                                    setUseCustomCamera(true);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
                            >
                                Front
                            </button>
                            <button
                                onClick={() => {
                                    setCameraHeight(6);
                                    setCameraDistance(15);
                                    setCameraRotationY(Math.PI / 2);
                                    setCameraRotationX(0);
                                    setUseCustomCamera(true);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
                            >
                                Right
                            </button>
                            <button
                                onClick={() => {
                                    setCameraHeight(8);
                                    setCameraDistance(18);
                                    setCameraRotationY(Math.PI / 4);
                                    setCameraRotationX(Math.PI / 6);
                                    setUseCustomCamera(true);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
                            >
                                Elevated
                            </button>
                            <button
                                onClick={() => {
                                    setCameraHeight(6);
                                    setCameraDistance(12);
                                    setCameraRotationY(0);
                                    setCameraRotationX(Math.PI / 2 - 0.1);
                                    setUseCustomCamera(true);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
                            >
                                Top
                            </button>
                        </div>
                    </div>

                    {/* Current Position Display */}
                    <div className="text-xs text-gray-300 mb-2">
                        Position: ({(Math.cos(cameraRotationY) * Math.cos(cameraRotationX) * cameraDistance).toFixed(1)}, {(Math.sin(cameraRotationX) * cameraDistance + cameraHeight).toFixed(1)}, {(Math.sin(cameraRotationY) * Math.cos(cameraRotationX) * cameraDistance).toFixed(1)})
                    </div>

                    {/* Toggle Controls */}
                    <button
                        onClick={() => setShowControls(false)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                    >
                        Hide Controls
                    </button>
                </div>
            )}

            {/* Show Controls Button */}
            {/* {!showControls && (
                <button
                    onClick={() => setShowControls(true)}
                    className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                >
                    Show Controls
                </button>
            )} */}
        </div>
    );
} 