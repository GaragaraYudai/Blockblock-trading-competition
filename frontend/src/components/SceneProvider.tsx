'use client';

import dynamic from 'next/dynamic';

/**
 * SceneProvider - Next.js SSR 환경에서 3D Canvas를 클라이언트 전용으로 로드
 * 
 * Background3D 컴포넌트는 WebGL/Three.js를 사용하므로 서버 사이드에서
 * 렌더링될 수 없습니다. 이 wrapper는 dynamic import를 통해
 * 클라이언트에서만 로드되도록 보장합니다.
 */
const Background3D = dynamic(() => import('./Background3D'), {
    ssr: false,
    loading: () => (
        <div
            className="fixed inset-0 z-0"
            style={{
                background: 'linear-gradient(to bottom, #FFE4EC, #E8A0A0)',
            }}
        />
    ),
});

export default function SceneProvider() {
    return <Background3D />;
}
