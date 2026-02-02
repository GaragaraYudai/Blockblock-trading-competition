'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const SAKURA_PALETTE = {
    coralPink: '#E8A0A0',
    softPink: '#FFB7C5',
    skyBlue: '#87CEEB',
    ambientPink: '#FFE4EC',
    warmWhite: '#FFF8F0',
} as const;

// ============================================================================
// UTILITY HOOKS
// ============================================================================

function useResponsive() {
    const { viewport } = useThree();
    const isMobile = viewport.width < 5;
    return { isMobile, viewport };
}

// ============================================================================
// LIGHTING
// ============================================================================

function SceneLighting() {
    return (
        <>
            <ambientLight color={SAKURA_PALETTE.ambientPink} intensity={0.6} />
            <directionalLight color={SAKURA_PALETTE.warmWhite} intensity={0.8} position={[5, 8, 5]} />
            <directionalLight color={SAKURA_PALETTE.coralPink} intensity={0.4} position={[-3, 2, 2]} />
            <pointLight color={SAKURA_PALETTE.skyBlue} intensity={0.2} position={[0, 5, 0]} />
        </>
    );
}

// ============================================================================
// 🔴 버그1 수정: 배경이 화면 전체를 100% 채우도록 (object-fit: cover 방식)
// ============================================================================

interface BackgroundLayerProps {
    mousePos: React.MutableRefObject<{ x: number; y: number }>;
}

function BackgroundLayer({ mousePos }: BackgroundLayerProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const { viewport } = useThree();
    const texture = useTexture('/assets/bg_sakura.png');

    useMemo(() => {
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
    }, [texture]);

    // 배경을 3배 확대 (비율 유지, 양옆 잘림 OK)
    const bgScale = useMemo((): [number, number, number] => {
        const img = texture.image as HTMLImageElement;
        if (!img || !img.width || !img.height) {
            return [viewport.width * 6, viewport.height * 6, 1];
        }

        const imageAspect = img.width / img.height;

        // 세로 기준으로 3배 확대 (비율 유지)
        const scaleY = viewport.height * 3;
        const scaleX = scaleY * imageAspect;

        return [scaleX, scaleY, 1];
    }, [viewport.width, viewport.height, texture]);

    const parallaxFactor = 0.02;

    useFrame(() => {
        if (!meshRef.current) return;
        const targetX = mousePos.current.x * parallaxFactor * viewport.width * 0.3;
        const targetY = mousePos.current.y * parallaxFactor * viewport.height * 0.3;
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.03);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.03);
    });

    return (
        <mesh ref={meshRef} position={[0, 0, -20]} scale={bgScale}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    );
}

// ============================================================================
// 🔴 버그3 수정: 벚꽃 파티클 - blossom.jpg 사용 + 천천히 낙하
// ============================================================================

interface SakuraPetalsProps {
    mousePos: React.MutableRefObject<{ x: number; y: number }>;
    layer: 'back' | 'front';
}

function SakuraPetals({ mousePos, layer }: SakuraPetalsProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { viewport } = useThree();
    const { isMobile } = useResponsive();

    // 🌸 blossom.jpg 텍스처 로드
    const petalTexture = useTexture('/assets/blossom.jpg');

    useMemo(() => {
        petalTexture.minFilter = THREE.LinearFilter;
        petalTexture.magFilter = THREE.LinearFilter;
        petalTexture.generateMipmaps = false;
        // 전체 이미지 사용 (개별 꽃잎들이 분포되어 있음)
        petalTexture.wrapS = THREE.RepeatWrapping;
        petalTexture.wrapT = THREE.RepeatWrapping;
    }, [petalTexture]);

    const count = isMobile
        ? (layer === 'back' ? 60 : 50)
        : (layer === 'back' ? 120 : 100);

    const layerConfig = layer === 'back'
        ? { zMin: -15, zMax: -10, opacity: 0.7, scaleBase: 0.4 }
        : { zMin: -3, zMax: 2, opacity: 0.85, scaleBase: 0.6 };

    // 파티클 초기화
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * viewport.width * 2.5,
                    Math.random() * viewport.height * 2.5 + viewport.height,
                    THREE.MathUtils.randFloat(layerConfig.zMin, layerConfig.zMax)
                ),
                rotation: new THREE.Euler(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                ),
                scale: THREE.MathUtils.randFloat(0.2, 0.5) * layerConfig.scaleBase,
                // 🔴 핵심: 매우 느린 낙하 속도 (0.015 ~ 0.04)
                speed: THREE.MathUtils.randFloat(0.015, 0.04),
                rotationSpeed: {
                    x: THREE.MathUtils.randFloat(0.05, 0.15),
                    y: THREE.MathUtils.randFloat(0.03, 0.1),
                },
                swayOffset: Math.random() * Math.PI * 2,
                swayAmplitude: THREE.MathUtils.randFloat(0.4, 1.0),
            });
        }
        return temp;
    }, [count, viewport, layerConfig]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime;
        const wind = mousePos.current.x * 0.03;

        particles.forEach((particle, i) => {
            // 🔴 천천히 나풀나풀 떨어지기
            particle.position.y -= particle.speed * delta * 20;

            // 좌우 흔들림 (사인파) - 부드럽고 넓게
            particle.position.x += (
                Math.sin(time * 0.2 + particle.swayOffset) * particle.swayAmplitude * 0.003 +
                wind * 0.005
            );

            // 부드러운 회전
            particle.rotation.x += particle.rotationSpeed.x * delta;
            particle.rotation.y += particle.rotationSpeed.y * delta;
            particle.rotation.z = Math.sin(time * 0.3 + particle.swayOffset) * 0.6;

            // 화면 밖으로 나가면 위로 리셋
            if (particle.position.y < -viewport.height - 2) {
                particle.position.y = viewport.height + Math.random() * 4;
                particle.position.x = (Math.random() - 0.5) * viewport.width * 2.5;
            }

            dummy.position.copy(particle.position);
            dummy.rotation.copy(particle.rotation);
            dummy.scale.setScalar(particle.scale);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
                map={petalTexture}
                transparent={true}
                alphaTest={0.05}
                opacity={layerConfig.opacity}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </instancedMesh>
    );
}

// ============================================================================
// SCENE
// ============================================================================

function Scene() {
    const mousePos = useRef({ x: 0, y: 0 });

    return (
        <group onPointerMove={(e: ThreeEvent<PointerEvent>) => {
            mousePos.current.x = e.pointer.x;
            mousePos.current.y = e.pointer.y;
        }}>
            <SceneLighting />

            {/* 레이어 순서: 배경(-20) → 뒤꽃잎(-15~-10) → 앞꽃잎(-3~2) */}
            {/* 햄스터 PNG들은 삭제됨 - 새 3D GLB 햄스터가 페이지별로 추가됨 */}
            <BackgroundLayer mousePos={mousePos} />
            <SakuraPetals mousePos={mousePos} layer="back" />
            <SakuraPetals mousePos={mousePos} layer="front" />
        </group>
    );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function Background3D() {
    return (
        <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
            <Canvas
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                    stencil: false,
                    depth: true,
                }}
                dpr={[1, 2]}
                camera={{ position: [0, 0, 10], fov: 50 }}
                style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    );
}
