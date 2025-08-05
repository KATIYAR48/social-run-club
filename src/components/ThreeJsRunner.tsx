'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import * as THREE from 'three';

interface RunnerProps {
    gender: 'male' | 'female';
    username: string;
}

function RunningFigure({ gender }: RunnerProps) {
    const groupRef = useRef<THREE.Group>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const modelRef = useRef<THREE.Group>(null);
    const [modelError, setModelError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load the FBX model with error handling
    const modelPath = gender === 'male' ? '/models/male.fbx' : '/models/female.fbx';

    // Use a fallback approach for model loading
    const [fbx, setFbx] = useState<THREE.Group | null>(null);

    useEffect(() => {
        const loadModel = async () => {
            try {
                setIsLoading(true);
                setModelError(false);

                // Try to load the model
                const loader = new FBXLoader();
                const model = await new Promise<THREE.Group>((resolve, reject) => {
                    loader.load(
                        modelPath,
                        (object) => resolve(object),
                        undefined,
                        (error) => reject(error)
                    );
                });

                setFbx(model);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load FBX model:', error);
                setModelError(true);
                setIsLoading(false);
            }
        };

        loadModel();
    }, [modelPath]);

    useEffect(() => {
        if (fbx && !modelError) {
            try {
                // Calculate proper scaling based on model bounds
                const box = new THREE.Box3().setFromObject(fbx);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                // Scale the model to fit within a reasonable size
                const maxDimension = Math.max(size.x, size.y, size.z);
                const targetSize = 12;
                const scale = targetSize / maxDimension;
                fbx.scale.setScalar(scale);

                // Center the model at origin after scaling
                fbx.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
                fbx.rotation.y = 0;

                // Set up shadows
                fbx.traverse((child: THREE.Object3D) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Set up animations if they exist
                if (fbx.animations && fbx.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(fbx);
                    mixerRef.current = mixer;

                    fbx.animations.forEach((clip) => {
                        const action = mixer.clipAction(clip);
                        action.setLoop(THREE.LoopRepeat, Infinity);
                        action.clampWhenFinished = false;
                        action.enabled = true;
                        action.timeScale = gender === 'male' ? 0.6 : 0.8;
                        action.weight = 1;
                        action.play();
                    });
                }

                // Add the FBX to the group
                if (groupRef.current) {
                    groupRef.current.clear();
                    groupRef.current.add(fbx);
                    modelRef.current = fbx;
                }
            } catch (error) {
                console.error('Error setting up model:', error);
                setModelError(true);
            }
        }
    }, [fbx, modelError]);

    useFrame((state, delta) => {
        // Update animation mixer with delta time
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    // Show loading state
    if (isLoading) {
        return (
            <group ref={groupRef} position={[0, 0, 0]}>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            </group>
        );
    }

    // Show error state
    if (modelError) {
        return (
            <group ref={groupRef} position={[0, 0, 0]}>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#ff6666" />
                </mesh>
            </group>
        );
    }

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Reference cube to help with positioning */}
            <mesh position={[2, 0, 0]} castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}

export default function ThreeJsRunner({ gender, username }: RunnerProps) {
    const [cameraHeight, setCameraHeight] = useState(6);
    const [cameraDistance, setCameraDistance] = useState(12);
    const [cameraRotationY, setCameraRotationY] = useState(491 * Math.PI / 180);
    const [cameraRotationX, setCameraRotationX] = useState(-23 * Math.PI / 180);
    const [cameraFov, setCameraFov] = useState(75);
    const [showControls, setShowControls] = useState(false);
    const [useCustomCamera, setUseCustomCamera] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [useSimpleFallback, setUseSimpleFallback] = useState(false);

    // Check if we're in a server-side rendering environment
    useEffect(() => {
        if (typeof window === 'undefined') {
            setUseSimpleFallback(true);
        }
    }, []);

    const initialCameraPosition = useMemo(() => {
        const x = Math.cos(cameraRotationY) * Math.cos(cameraRotationX) * cameraDistance;
        const y = Math.sin(cameraRotationX) * cameraDistance + cameraHeight;
        const z = Math.sin(cameraRotationY) * Math.cos(cameraRotationX) * cameraDistance;
        return new THREE.Vector3(x, y, z);
    }, [cameraRotationY, cameraRotationX, cameraDistance, cameraHeight]);

    // Simple fallback for SSR or when Three.js fails
    if (useSimpleFallback || hasError) {
        return (
            <div className="h-64 w-64 bg-black rounded-lg overflow-hidden border border-zinc-800 relative flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="text-6xl mb-2">{gender === 'male' ? '🏃‍♂️' : '🏃‍♀️'}</div>
                    <p className="text-sm text-zinc-400">Runner Model</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-64 w-64 bg-black rounded-lg overflow-hidden border border-zinc-800 relative">
            <Canvas
                camera={{ position: initialCameraPosition, fov: cameraFov }}
                gl={{ antialias: true }}
                shadows
                onError={(error) => {
                    console.error('Canvas error:', error);
                    setHasError(true);
                }}
            >
                {/* Enhanced lighting setup */}
                <directionalLight
                    position={[3, 5, 3]}
                    intensity={1.5}
                    color={`#${Array.from(username)
                        .reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0)
                        .toString(16)
                        .padStart(6, '0')
                        .slice(-6)
                        .split('')
                        .map((c) => {
                            // Ensure each channel is at least 'B' (hex 11/17) for brightness
                            const val = parseInt(c, 16);
                            return (val < 11 ? (val + 5).toString(16) : c);
                        })
                        .join('')
                        }`}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />

                <directionalLight
                    position={[-3, 3, -2]}
                    intensity={0.8}
                    color="#8b9dc3"
                />

                <pointLight
                    position={[2, 1.5, 2]}
                    intensity={0.7}
                    color="#ffffff"
                />

                <ambientLight intensity={0.4} color="#404040" />

                <RunningFigure gender={gender} username={username} />
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
        </div>
    );
} 