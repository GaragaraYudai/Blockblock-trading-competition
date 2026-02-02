'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

// ============================================================================
// TYPES
// ============================================================================

interface HamsterProps {
    fileName: string;
    scale?: number;
    position?: [number, number, number];
}

// ============================================================================
// HAMSTER COMPONENT
// ============================================================================

export default function Hamster({
    fileName,
    scale = 1,
    position = [0, 0, 0]
}: HamsterProps) {
    const groupRef = useRef<THREE.Group>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    // Load the GLB model with animations
    const { scene, animations } = useGLTF(`/assets/${fileName}`);

    // Clone the scene properly with skeleton using SkeletonUtils
    const clonedScene = useMemo(() => {
        const clone = SkeletonUtils.clone(scene);
        return clone;
    }, [scene]);

    // Set up animation mixer and play first animation
    useEffect(() => {
        if (!clonedScene || animations.length === 0) return;

        // Create a new mixer for the cloned scene
        const mixer = new THREE.AnimationMixer(clonedScene);
        mixerRef.current = mixer;

        // Clone and play the first animation
        const clip = animations[0];
        if (clip) {
            const action = mixer.clipAction(clip);
            action.reset();
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();
        }

        return () => {
            mixer.stopAllAction();
            mixer.uncacheRoot(clonedScene);
        };
    }, [clonedScene, animations]);

    // Mouse tracking for head rotation
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            // Normalize mouse position to -1 to 1
            mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Animate: update animation mixer + subtle rotation toward mouse
    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Update animation mixer
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }

        // Subtle rotation following mouse
        const targetRotationY = mousePos.current.x * 0.3;
        const targetRotationX = -mousePos.current.y * 0.15;

        groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            targetRotationY,
            0.05
        );
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
            groupRef.current.rotation.x,
            targetRotationX,
            0.05
        );
    });

    return (
        <group ref={groupRef} position={position}>
            <primitive
                object={clonedScene}
                scale={scale}
                dispose={null}
            />
        </group>
    );
}

// ============================================================================
// PRELOAD FUNCTION - Call at module level in layout.tsx
// ============================================================================

export function preloadHamsterModels() {
    useGLTF.preload('/assets/Meshy_AI_Animation_Walking_withSkin.glb');
    useGLTF.preload('/assets/Meshy_AI_Animation_Running_withSkin.glb');
    useGLTF.preload('/assets/Meshy_AI_Animation_Elderly_Shaky_Walk_inplace_withSkin.glb');
    useGLTF.preload('/assets/Meshy_AI_Animation_Right_Jab_from_Guard_withSkin.glb');
    useGLTF.preload('/assets/Meshy_AI_Animation_jumping_jacks_withSkin.glb');
}

// Auto-preload when this module is imported
preloadHamsterModels();
