'use client';

import { Suspense, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';

// ============================================================================
// TYPES
// ============================================================================

interface HamsterCanvasProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

// ============================================================================
// LIGHTING
// ============================================================================

function SceneLighting() {
    return (
        <>
            {/* Main ambient light */}
            <ambientLight intensity={0.7} color="#ffffff" />

            {/* Primary directional light */}
            <directionalLight
                position={[5, 8, 5]}
                intensity={1.2}
                color="#ffffff"
                castShadow
                shadow-mapSize={[1024, 1024]}
            />

            {/* Fill light from opposite side */}
            <directionalLight
                position={[-3, 4, -2]}
                intensity={0.5}
                color="#ffeedd"
            />

            {/* Rim light for depth */}
            <pointLight
                position={[0, 3, -5]}
                intensity={0.3}
                color="#88ccff"
            />
        </>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HamsterCanvas({
    children,
    className = '',
    style = {}
}: HamsterCanvasProps) {
    return (
        <div
            className={className}
            style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',  // 삐져나온 것도 보여줌
                // border: '3px solid red',  // 디버그용 빨간 테두리
                ...style
            }}
        >
            <Canvas
                gl={{
                    antialias: true,
                    alpha: true,  // Transparent background
                    powerPreference: 'high-performance',
                    stencil: false,
                    depth: true,
                }}
                dpr={[1, 2]}
                camera={{
                    position: [0, 3, 18],  // Move camera much higher and further back
                    fov: 30,  // Narrow FOV for less distortion
                    near: 0.1,
                    far: 100
                }}
                style={{
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'auto'  // Allow 3D interaction
                }}
                shadows
            >
                <Suspense fallback={null}>
                    <SceneLighting />

                    {/* 3D Hamster models */}
                    {children}

                    {/* Ground shadow for visual grounding */}
                    <ContactShadows
                        position={[0, -2, 0]}
                        opacity={0.4}
                        blur={2.5}
                        scale={15}
                        far={6}
                        resolution={256}
                        color="#000000"
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
