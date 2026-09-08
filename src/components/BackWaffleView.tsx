import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useTileStore } from '../store/useTileStore';
import { Maximize2, ShieldCheck, Cpu, Layers, Disc3 } from 'lucide-react';

// Procedural 3D Underside Mesh with Dovetail Waffle Matrix
const WaffleUndersideMesh: React.FC = () => {
  const { dimensions, isWireframe } = useTileStore();
  const meshRef = useRef<THREE.Group>(null);

  const width = dimensions.width_mm / 1000;
  const height = dimensions.height_mm / 1000;
  const thickness = dimensions.thickness_mm / 1000;

  // Grid groove pitch (50mm = 0.05m)
  const grooveSpacing = 0.05;
  const grooveDepth = 0.0018; // 1.8mm depth
  const grooveWidth = 0.006; // 6mm wide dovetail groove

  const cols = Math.floor(width / grooveSpacing);
  const rows = Math.floor(height / grooveSpacing);

  // Generate factory underside stamp canvas texture
  const stampTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Ceramic bisque body color
      ctx.fillStyle = '#b45309'; // Terracotta / Bisque core tone
      ctx.fillRect(0, 0, 1024, 1024);

      // Add ceramic clay grain
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, 2, 2);
      }

      // Factory stamp markings
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.strokeRect(300, 420, 424, 184);

      ctx.fillStyle = '#451a03';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STUDIO CADENZA CERAMICHE', 512, 470);
      ctx.font = '20px monospace';
      ctx.fillText('EN 14411 - ISO 13006 Gr. BIa', 512, 510);
      ctx.fillText(`THICKNESS ${dimensions.thickness_mm}mm | RECTIFIED`, 512, 545);
      ctx.font = '16px monospace';
      ctx.fillText('MADE FOR HIGH-TRAFFIC ARCHITECTURAL SPEC', 512, 575);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, [dimensions.thickness_mm]);

  return (
    <group ref={meshRef} rotation={[Math.PI, 0, 0]}>
      {/* Base Bisque Ceramic Slab */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, thickness, height]} />
        <meshStandardMaterial
          color="#c27847"
          roughness={0.88}
          metalness={0.02}
          map={stampTexture}
          wireframe={isWireframe}
        />
      </mesh>

      {/* Structural Ribs / Dovetail Waffle Matrix Overlay */}
      {Array.from({ length: cols - 1 }).map((_, c) => {
        const x = (c + 1) * grooveSpacing - width / 2;
        return (
          <mesh key={`col_${c}`} position={[x, thickness / 2 + 0.0008, 0]}>
            <boxGeometry args={[grooveWidth, grooveDepth, height * 0.94]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.9} />
          </mesh>
        );
      })}

      {Array.from({ length: rows - 1 }).map((_, r) => {
        const z = (r + 1) * grooveSpacing - height / 2;
        return (
          <mesh key={`row_${r}`} position={[0, thickness / 2 + 0.0008, z]}>
            <boxGeometry args={[width * 0.94, grooveDepth, grooveWidth]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Perimeter Mortar Retaining Lip */}
      <lineSegments position={[0, thickness / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width * 0.98, grooveDepth * 2, height * 0.98)]} />
        <lineBasicMaterial color="#fdba74" />
      </lineSegments>
    </group>
  );
};

export const BackWaffleView: React.FC<{ onExpand?: () => void; isExpanded?: boolean }> = ({
  onExpand,
  isExpanded = false,
}) => {
  const { dimensions, calculations } = useTileStore();

  return (
    <div
      id="viewport-back-waffle"
      className="flex flex-col h-full bg-[#1A1A1C] border border-[#2A2A2E] rounded overflow-hidden select-none text-[#D1D1D1] shadow-xl"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141416] border-b border-[#2A2A2E] text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#2A2A2E] text-[9px] font-bold rounded-sm uppercase tracking-widest text-[#00F0FF]">
            Viewport 04: Waffle Grid
          </div>
          <span className="text-[#2A2A2E]">|</span>
          <span className="text-[#D1D1D1]/60 font-mono text-[10px]">
            50mm PITCH DOVETAIL MORTAR INTERLOCK
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="bg-[#141416] border border-[#D4AF37]/50 px-2 py-0.5 rounded text-[10px] font-mono text-[#D4AF37] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
            ADHESION: {calculations.waffleGripContactPct}%
          </div>

          {onExpand && (
            <button
              onClick={onExpand}
              title={isExpanded ? 'Restore Viewport Grid' : 'Maximize Viewport'}
              className="p-1 text-[#D1D1D1]/60 hover:text-white bg-[#1E1E20] border border-[#2A2A2E] rounded transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas for Underside */}
      <div className="relative flex-1 bg-[#101012]">
        {/* Floating Waffle Specs HUD */}
        <div className="absolute top-2 left-2 z-10 bg-[#141416]/95 backdrop-blur border border-[#2A2A2E] p-2 rounded text-xs space-y-1 font-mono pointer-events-none">
          <div className="text-[#D4AF37] font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            Structural Ribbing Matrix
          </div>
          <div className="text-[10px] text-[#D1D1D1] space-y-0.5">
            <div>Groove Grid: <span className="text-white font-bold">50mm × 50mm Pitch</span></div>
            <div>Groove Depth: <span className="text-[#00F0FF] font-bold">1.8mm Dovetail Undercut</span></div>
            <div>Mass Reduction: <span className="text-emerald-400 font-bold">-14.5% Volume Saved</span></div>
            <div>Mortar Bond Rating: <span className="text-[#D4AF37] font-bold">C2TES1 High Flex</span></div>
          </div>
        </div>

        <Canvas
          shadows
          camera={{ position: [0, 1.2, 1.2], fov: 45 }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 3]} intensity={1.5} castShadow />
          <directionalLight position={[-3, 4, -2]} intensity={0.5} color="#fdba74" />

          <Center>
            <WaffleUndersideMesh />
          </Center>

          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            minDistance={0.4}
            maxDistance={5}
          />
          <Environment preset="apartment" environmentIntensity={0.5} />
        </Canvas>
      </div>

      {/* Bottom Status bar */}
      <div className="px-3 py-1.5 bg-[#141416] border-t border-[#2A2A2E] text-[10px] flex items-center justify-between text-[#D1D1D1]/60 font-mono">
        <span>Substrate: Ceramic Bisque (Atomized Red/White Clay Firing @ 1220°C)</span>
        <span className="text-[#D4AF37] font-semibold">Tensile Pull-Off Strength: &gt;1.5 N/mm²</span>
      </div>
    </div>
  );
};
