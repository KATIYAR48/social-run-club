'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

// Simple building component
function Building({ position, size, height }: { position: [number, number, number], size: number, height: number }) {
    return (
        <mesh position={position}>
            <boxGeometry args={[size, height, size]} />
            <meshStandardMaterial color="#383838" />
        </mesh>
    )
}

// Simple city block
function CityBlock({ position }: { position: [number, number, number] }) {
    const buildings = useMemo(() => {
        const buildingData: Array<{ pos: [number, number, number], size: number, height: number }> = []

        // Generate 15-25 buildings per block (denser)
        const numBuildings = Math.floor(Math.random() * 11) + 25
        for (let i = 0; i < numBuildings; i++) {
            const x = (Math.random() - 0.5) * 30
            const z = (Math.random() - 0.5) * 20
            const size = Math.random() * 1.8 + 1
            const height = Math.min(Math.random() * 10 + 5, 10) // Max height of 10 units

            buildingData.push({
                pos: [x, height / 2, z],
                size,
                height
            })
        }

        return buildingData
    }, [])

    return (
        <group position={position}>
            {buildings.map((building, index) => (
                <Building
                    key={index}
                    position={building.pos}
                    size={building.size}
                    height={building.height}
                />
            ))}
        </group>
    )
}

// Simple cityscape
function Cityscape() {
    const groupRef = useRef<THREE.Group>(null)

    // Generate city blocks
    const cityBlocks = useMemo(() => {
        const blocks: Array<{ position: [number, number, number], id: number }> = []

        // Create blocks closer to camera
        for (let i = 0; i < 40; i++) {
            const z = -i * 15 - 20 // Start 20 units away, closer spacing
            const x = (Math.random() - 0.5) * 100 // Much wider spread
            blocks.push({
                position: [x, 0, z],
                id: i
            })
        }

        return blocks
    }, [])

    // Animation loop for forward movement
    useFrame((state, delta) => {
        if (groupRef.current) {
            // Move the entire city forward (slower)
            groupRef.current.position.z += delta * 3

            // Reset blocks that have moved too far forward
            groupRef.current.children.forEach((child) => {
                if (child.position.z > 30) {
                    child.position.z -= 400
                    child.position.x = (Math.random() - 0.5) * 30
                }
            })
        }
    })

    return (
        <group ref={groupRef}>
            {cityBlocks.map((block) => (
                <CityBlock key={block.id} position={block.position} />
            ))}
        </group>
    )
}

// Camera controller to ensure straight forward view
function CameraController() {
    const { camera } = useThree()

    useFrame(() => {
        // Position camera and look straight forward (no tilt)
        camera.position.set(0, 12, 20)
        camera.lookAt(0, 12, -20) // Look straight ahead at same height
    })

    return null
}

export default function CityScapeSection() {
    return (
        <section className="bg-black text-white filter contrast-110 brightness-150 h-[500px] relative overflow-hidden">
            <div className="absolute inset-0">
                <Canvas
                    camera={{ position: [0, 12, 20], fov: 70 }}
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: "high-performance"
                    }}
                >
                    {/* Simple lighting */}
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[10, 10, 5]} intensity={5} color="#ffffff" />

                    {/* Ground plane */}
                    <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[1000, 1000]} />
                        <meshStandardMaterial color="#010101" />
                    </mesh>

                    {/* Cityscape */}
                    <Cityscape />

                    {/* Camera controller */}
                    <CameraController />
                </Canvas>
            </div>

            {/* Vignette overlay - linear gradient from bottom to middle */}
            <div
                className="absolute inset-0 pointer-events-none z-5"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 5%, transparent 100%)'
                }}
            />

            {/* Overlay text */}
            <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center font-mono">
                    <h1 className="text-2xl mb-24 !tracking-[5px]">CLOKA SEES YOU</h1>
                    {/* <p className="text-xl opacity-80">You should see gray buildings moving forward</p> */}
                </div>
            </div>
        </section>
    )
}