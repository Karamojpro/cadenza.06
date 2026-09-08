import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Center,
  Environment,
  ContactShadows,
  Float,
  Grid,
} from '@react-three/drei';
import * as THREE from 'three';
import { useTileStore } from '../store/useTileStore';
import { useProjectStore, getTransformedVisibleObjects } from '../store/useProjectStore';
import { useSceneStore } from '../store/useSceneStore';
import { getResolvedLayerId } from '../utils/objectTransform';
import {
  Maximize2,
  Sun,
  RotateCw,
  Eye,
  Grid3X3,
  Layers,
  Sparkles,
  Camera,
  Palette,
  Box,
} from 'lucide-react';

// Common PBR shader calculation
function usePBRMaterialProps(finish: any) {
  return useMemo(() => {
    let baseRoughness = finish.roughness;
    let baseClearcoat = 0.0;
    let baseMetalness = finish.metallic;
    let baseSheen = finish.luster_sheen;

    if (finish.glaze_type === 'gloss') {
      baseRoughness = Math.min(0.1, finish.roughness);
      baseClearcoat = 1.0;
    } else if (finish.glaze_type === 'satin') {
      baseRoughness = 0.32;
      baseClearcoat = 0.4;
    } else if (finish.glaze_type === 'luster') {
      baseRoughness = 0.18;
      baseClearcoat = 0.85;
      baseMetalness = Math.max(0.2, finish.metallic);
      baseSheen = 0.8;
    } else if (finish.glaze_type === 'matte') {
      baseRoughness = Math.max(0.75, finish.roughness);
      baseClearcoat = 0.0;
    }

    return {
      roughness: baseRoughness,
      clearcoat: baseClearcoat,
      metalness: baseMetalness,
      sheen: baseSheen,
      ior: 1.54, // Porcelain glaze refractive index
    };
  }, [finish]);
}

// 1. Modular Tile Model (with inlays and chamfers)
const TileModel: React.FC = () => {
  const {
    dimensions,
    finish,
    color,
    isWireframe,
    isAutoRotate,
    productionMode,
  } = useTileStore();
  const { objects, layers } = useProjectStore();

  const groupRef = useRef<THREE.Group>(null);
  const pbr = usePBRMaterialProps(finish);

  const width = dimensions.width_mm / 1000;
  const height = dimensions.height_mm / 1000;
  const thickness = dimensions.thickness_mm / 1000;
  const reliefDepth = dimensions.relief_depth_mm / 1000;

  const proceduralTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = color.primary_hex;
      ctx.fillRect(0, 0, 1024, 1024);

      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const opacity = Math.random() * 0.035;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
        ctx.fillRect(x, y, 2, 2);
      }

      const scaleX = 1024 / dimensions.width_mm;
      const scaleY = 1024 / dimensions.height_mm;

      // Same visible/ordered/transformed object set the 2D canvas, CAM QC
      // and DXF export use — one source of truth for "what's actually there".
      const visiblePaths = getTransformedVisibleObjects();

      for (const path of visiblePaths) {
        if (path.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.strokeWidth * scaleX;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        path.points.forEach((pt, idx) => {
          const px = pt.x * scaleX;
          const py = pt.y * scaleY;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });

        if (path.closed) {
          ctx.closePath();
          if (getResolvedLayerId(path) === 'layer_inlay') {
            ctx.fillStyle = path.color;
            ctx.fill();
          }
        }
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, [color.primary_hex, objects, layers, dimensions.width_mm, dimensions.height_mm]);

  useFrame((_, delta) => {
    if (isAutoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, thickness / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, thickness, height, 32, 4, 32]} />
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          clearcoat={pbr.clearcoat}
          clearcoatRoughness={0.1}
          sheen={pbr.sheen}
          ior={pbr.ior}
          map={proceduralTexture}
          wireframe={isWireframe}
        />
      </mesh>

      {productionMode === '3d_mold_relief' && (
        <mesh position={[0, thickness / 2 + reliefDepth / 2, 0]} castShadow>
          <boxGeometry args={[width * 0.92, reliefDepth, height * 0.92, 16, 2, 16]} />
          <meshPhysicalMaterial
            color={color.primary_hex}
            roughness={pbr.roughness}
            metalness={pbr.metalness}
            clearcoat={pbr.clearcoat}
            wireframe={isWireframe}
          />
        </mesh>
      )}

      <lineSegments position={[0, 0, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, thickness, height)]} />
        <lineBasicMaterial color={isWireframe ? '#38bdf8' : '#64748b'} opacity={0.6} transparent />
      </lineSegments>
    </group>
  );
};

// 2. Stair Tread & Nosing Solid Model
const StairTread3DModel: React.FC = () => {
  const { dimensions, stairParams, finish, color, isWireframe, isAutoRotate } = useTileStore();
  const groupRef = useRef<THREE.Group>(null);
  const pbr = usePBRMaterialProps(finish);

  const width = (dimensions.width_mm || 1200) / 1000;
  const depth = (stairParams.tread_depth_mm || 330) / 1000;
  const thick = (dimensions.thickness_mm || 20) / 1000;
  const apronDrop = (stairParams.nosing_drop_mm || 40) / 1000;
  const grooveCount = stairParams.anti_slip_grooves.count || 4;
  const groovePitch = (stairParams.anti_slip_grooves.pitch_mm || 8.0) / 1000;
  const grooveOffset = (stairParams.anti_slip_grooves.offset_from_edge_mm || 25.0) / 1000;

  useFrame((_, delta) => {
    if (isAutoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, thick / 2, 0]}>
      {/* Main Horizontal Foot Tread Step */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, thick, depth, 32, 4, 32]} />
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          clearcoat={pbr.clearcoat}
          sheen={pbr.sheen}
          wireframe={isWireframe}
        />
      </mesh>

      {/* Front Mitered Nosing Apron Lip (Downwards Drop) */}
      <mesh
        position={[0, -apronDrop / 2 + thick / 2, depth / 2 + thick / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, apronDrop, thick, 16, 8, 4]} />
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          clearcoat={pbr.clearcoat}
          wireframe={isWireframe}
        />
      </mesh>

      {/* Nosing Profile Edge Cap / 45 Miter Highlight */}
      <mesh position={[0, thick / 2, depth / 2]} castShadow>
        {stairParams.nosing_type === 'bullnose' ? (
          <cylinderGeometry args={[thick / 2, thick / 2, width, 16]} />
        ) : (
          <boxGeometry args={[width, thick * 0.4, thick * 0.4]} />
        )}
        <meshStandardMaterial color={color.secondary_hex} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Anti-Slip Friction Channels (Waterjet Carved Grooves) */}
      {Array.from({ length: grooveCount }).map((_, idx) => {
        const grooveZ = depth / 2 - grooveOffset - idx * groovePitch;
        return (
          <mesh
            key={idx}
            position={[0, thick / 2 + 0.0005, grooveZ]}
            castShadow
          >
            <boxGeometry args={[width * 0.94, 0.002, 0.003]} />
            <meshStandardMaterial color="#1E1E22" roughness={0.9} metalness={0.1} />
          </mesh>
        );
      })}

      {/* Back Riser Mock Step to give architectural stair context */}
      <mesh position={[0, -0.09, -depth / 2 - 0.01]} receiveShadow>
        <boxGeometry args={[width * 0.98, 0.16, 0.02]} />
        <meshStandardMaterial color="#2E3035" roughness={0.8} />
      </mesh>
    </group>
  );
};

// 3. 3D Wall Cladding & Sculpted Relief Panel
const WallPanel3DModel: React.FC = () => {
  const { dimensions, wallPanelParams, finish, color, isWireframe, isAutoRotate } = useTileStore();
  const groupRef = useRef<THREE.Group>(null);
  const pbr = usePBRMaterialProps(finish);

  const width = (dimensions.width_mm || 600) / 1000;
  const height = (dimensions.height_mm || 1200) / 1000;
  const baseThick = (dimensions.thickness_mm || 12) / 1000;
  const reliefAmp = (wallPanelParams.relief_amplitude_mm || 25) / 1000;

  // Generate parametric 3D non-planar sculpted surface
  const reliefGeometry = useMemo(() => {
    const segmentsX = 48;
    const segmentsY = 64;
    const geom = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const pos = geom.attributes.position;

    const freq = wallPanelParams.repeating_frequency || 3.0;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      let z = 0;

      if (wallPanelParams.sculpt_pattern === 'origami_wave') {
        z = Math.sin(x * freq * Math.PI * 2 + y * 2) * reliefAmp * 0.7 +
            Math.cos(y * freq * Math.PI) * reliefAmp * 0.3;
      } else if (wallPanelParams.sculpt_pattern === 'fluted_column') {
        z = Math.abs(Math.sin(x * freq * Math.PI * 4)) * reliefAmp;
      } else if (wallPanelParams.sculpt_pattern === 'parabolic_facet') {
        const u = Math.sin(x * freq * Math.PI * 3);
        const v = Math.cos(y * freq * Math.PI * 3);
        z = (u * v) * reliefAmp;
      } else {
        // hex pyramid
        z = (Math.sin(x * 10) * Math.cos(y * 10) > 0 ? 1 : 0) * reliefAmp;
      }

      pos.setZ(i, Math.max(0, z));
    }

    geom.computeVertexNormals();
    return geom;
  }, [width, height, reliefAmp, wallPanelParams.sculpt_pattern, wallPanelParams.repeating_frequency]);

  useFrame((_, delta) => {
    if (isAutoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, baseThick / 2, 0]}>
      {/* Base Structural Porcelain Backing Plate */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, baseThick, height]} />
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          wireframe={isWireframe}
        />
      </mesh>

      {/* 3D Sculpted Non-Planar Relief Face */}
      <mesh
        geometry={reliefGeometry}
        position={[0, baseThick / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          clearcoat={pbr.clearcoat}
          sheen={pbr.sheen}
          side={THREE.DoubleSide}
          wireframe={isWireframe}
        />
      </mesh>

      {/* Interlocking Shiplap Edge Border Indicator */}
      {wallPanelParams.panel_interlock && (
        <mesh position={[width / 2 + 0.005, 0, 0]} castShadow>
          <boxGeometry args={[0.01, baseThick * 0.6, height * 0.98]} />
          <meshStandardMaterial color={color.secondary_hex} metalness={0.7} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
};

// 4. Skirting & Cove Trim Molding Profile
const SkirtingMolding3DModel: React.FC = () => {
  const { dimensions, moldingParams, finish, color, isWireframe, isAutoRotate } = useTileStore();
  const groupRef = useRef<THREE.Group>(null);
  const pbr = usePBRMaterialProps(finish);

  const length = (moldingParams.length_mm || 1200) / 1000;
  const height = (moldingParams.profile_height_mm || 100) / 1000;
  const depth = (moldingParams.profile_depth_mm || 18) / 1000;
  const shadowGap = (moldingParams.reveal_gap_mm || 5) / 1000;

  useFrame((_, delta) => {
    if (isAutoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, height / 2, 0]}>
      {/* Primary Molding Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, height, depth, 32, 8, 8]} />
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          clearcoat={pbr.clearcoat}
          wireframe={isWireframe}
        />
      </mesh>

      {/* Cove Base Curve / Bottom Fillet */}
      <mesh position={[0, -height / 2 + 0.015, depth / 2 + 0.008]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, length, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
        />
      </mesh>

      {/* Recessed Shadowline Drywall Reveal Groove (Top) */}
      <mesh position={[0, height / 2 - shadowGap / 2, -depth / 2 + 0.003]}>
        <boxGeometry args={[length * 1.01, shadowGap, 0.006]} />
        <meshBasicMaterial color="#0A0A0B" />
      </mesh>

      {/* 45 Degree Factory Pre-Cut Corner Miter Trim Accent */}
      <mesh position={[length / 2 - 0.01, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.004, height * 0.95, depth * 1.2]} />
        <meshStandardMaterial color={color.secondary_hex} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

// 5. Jumbo Porcelain Slab & Waterfall Island Model (3200 x 1600mm)
const CountertopSlab3DModel: React.FC = () => {
  const { slabParams, finish, color, isWireframe, isAutoRotate } = useTileStore();
  const groupRef = useRef<THREE.Group>(null);
  const pbr = usePBRMaterialProps(finish);

  const width = (slabParams.slab_width_mm || 3200) / 1000;
  const length = (slabParams.slab_length_mm || 1600) / 1000;
  const thick = (slabParams.thickness_mm || 20) / 1000;
  const waterfallDrop = (slabParams.waterfall_drop_mm || 850) / 1000;

  useFrame((_, delta) => {
    if (isAutoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, thick / 2, 0]} scale={[0.85, 0.85, 0.85]}>
      {/* Main Horizontal Island Slab */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, thick, length, 32, 4, 32]} />
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          clearcoat={pbr.clearcoat}
          sheen={pbr.sheen}
          wireframe={isWireframe}
        />
      </mesh>

      {/* 45 Degree Continuous Waterfall Side Return (Left End Drop) */}
      <mesh
        position={[-width / 2 - thick / 2, -waterfallDrop / 2 + thick / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[thick, waterfallDrop, length, 4, 16, 16]} />
        <meshPhysicalMaterial
          color={color.primary_hex}
          roughness={pbr.roughness}
          metalness={pbr.metalness}
          clearcoat={pbr.clearcoat}
          wireframe={isWireframe}
        />
      </mesh>

      {/* Precision 45 Miter Joint Seam */}
      <mesh position={[-width / 2, thick / 2, 0]}>
        <boxGeometry args={[0.003, 0.003, length]} />
        <meshStandardMaterial color={color.secondary_hex} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Waterjet Sink Cutout Hole Simulation */}
      {slabParams.sink_cutout.enabled && (
        <mesh
          position={[
            -width / 4,
            thick / 2 + 0.001,
            0,
          ]}
          castShadow
        >
          <boxGeometry
            args={[
              (slabParams.sink_cutout.width_mm || 600) / 1000,
              0.002,
              (slabParams.sink_cutout.length_mm || 450) / 1000,
            ]}
          />
          <meshStandardMaterial color="#121215" roughness={0.9} metalness={0.1} />
        </mesh>
      )}

      {/* Vein Continuity Accent Flow Lines across surface & waterfall */}
      <mesh position={[0, thick / 2 + 0.001, 0]}>
        <planeGeometry args={[width * 0.9, length * 0.9]} />
        <meshBasicMaterial color={color.secondary_hex} opacity={0.15} transparent wireframe />
      </mesh>
    </group>
  );
};

// Phase 3 scene-object proof renderer. Rich archetype renderers remain intact;
// this renderer makes additional independent SceneObjects visible/selectable.
const SceneObjectProof: React.FC = () => {
  const { objects, selectedObjectIds, selectObject } = useSceneStore();
  return <group>
    {(Object.values(objects) as any[]).filter(o => o.kind === 'stair_tread' && o.id !== 'object_primary' && o.visible).map(o => {
      if (o.geometry.kind !== 'stair_tread') return null;
      const d = o.geometry.params.dimensions;
      const selected = selectedObjectIds.includes(o.id);
      return <group key={o.id} position={[o.transform.x_mm/1000, d.thickness_mm/2000, o.transform.y_mm/1000]} rotation={[0, o.transform.rotation_z_deg*Math.PI/180, 0]}
        onClick={(e) => { e.stopPropagation(); selectObject(o.id); }}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[d.width_mm/1000, d.thickness_mm/1000, d.height_mm/1000]} />
          <meshPhysicalMaterial color={o.materialId === 'mat_default' ? '#D4AF37' : '#888888'} roughness={0.3} metalness={0.08} wireframe={selected} />
        </mesh>
      </group>;
    })}
  </group>;
};

// Floor Array Mode (Simulates a 20m x 10m realistic architectural installation)
const FloorArrayScene: React.FC = () => {
  const { dimensions, color, finish } = useTileStore();
  const tileWidth = dimensions.width_mm / 1000;
  const tileHeight = dimensions.height_mm / 1000;
  const groutJoint = dimensions.grout_joint_mm / 1000;

  const cols = 8;
  const rows = 6;

  const tiles = useMemo(() => {
    const list: Array<{ x: number; z: number }> = [];
    const offsetX = ((cols - 1) * (tileWidth + groutJoint)) / 2;
    const offsetZ = ((rows - 1) * (tileHeight + groutJoint)) / 2;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        list.push({
          x: c * (tileWidth + groutJoint) - offsetX,
          z: r * (tileHeight + groutJoint) - offsetZ,
        });
      }
    }
    return list;
  }, [cols, rows, tileWidth, tileHeight, groutJoint]);

  return (
    <group position={[0, -0.05, 0]}>
      {/* Mortar Grout Bed Floor */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {/* Array of Individual Tiles */}
      {tiles.map((pos, i) => (
        <mesh key={i} position={[pos.x, (dimensions.thickness_mm / 1000) / 2, pos.z]} receiveShadow castShadow>
          <boxGeometry args={[tileWidth, dimensions.thickness_mm / 1000, tileHeight]} />
          <meshPhysicalMaterial
            color={color.primary_hex}
            roughness={finish.roughness}
            metalness={finish.metallic}
            clearcoat={finish.glaze_type === 'gloss' ? 0.9 : 0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

export const Viewport3D: React.FC<{ onExpand?: () => void; isExpanded?: boolean }> = ({
  onExpand,
  isExpanded = false,
}) => {
  const {
    dimensions,
    finish,
    referenceAssets,
    setApplicationMode,
    isWireframe,
    setIsWireframe,
    isAutoRotate,
    setIsAutoRotate,
    lightingPreset,
    setLightingPreset,
    activeArchetype,
    setArchetype,
    toggleMaterialDrawer,
  } = useTileStore();

  const isFloorSpan = referenceAssets.application_mode === 'full_floor_span';

  const archetypes = [
    { id: 'flat_tile', label: 'Flat Tile' },
    { id: 'stair_tread', label: 'Stair Tread' },
    { id: '3d_wall_panel', label: '3D Wall Panel' },
    { id: 'skirting_molding', label: 'Skirting' },
    { id: 'countertop_slab', label: 'Jumbo Slab' },
  ];

  return (
    <div
      id="viewport-3d-orbit"
      className="flex flex-col h-full bg-[#1A1A1C] border border-[#2A2A2E] rounded overflow-hidden select-none text-[#D1D1D1] shadow-xl"
    >
      {/* 3D Viewport Top Command Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141416] border-b border-[#2A2A2E] text-xs shrink-0 flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#2A2A2E] text-[9px] font-bold rounded-sm uppercase tracking-widest text-[#00F0FF]">
            Viewport 02: 3D PBR Orbit
          </div>
          <span className="text-[#2A2A2E]">|</span>

          {/* Archetype Quick Switcher */}
          <div className="flex items-center bg-[#1E1E20] border border-[#2A2A2E] rounded p-0.5 text-[9px]">
            {archetypes.map((arch) => (
              <button
                key={arch.id}
                onClick={() => setArchetype(arch.id as any)}
                className={`px-1.5 py-0.5 rounded transition font-mono ${
                  activeArchetype === arch.id
                    ? 'bg-[#00F0FF] text-black font-bold'
                    : 'text-[#888890] hover:text-white'
                }`}
              >
                {arch.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Material Drawer Button */}
          <button
            onClick={toggleMaterialDrawer}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#222228] hover:bg-[#2C2C34] text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[10px] font-mono font-bold uppercase transition"
          >
            <Palette className="w-3 h-3" />
            <span>Materials</span>
          </button>

          {/* Mode Switch: Single Tile vs Floor Array (for flat_tile) */}
          {activeArchetype === 'flat_tile' && (
            <div className="flex items-center bg-[#1E1E20] border border-[#2A2A2E] rounded p-0.5 text-[10px]">
              <button
                id="btn-mode-single-tile"
                onClick={() => setApplicationMode('single_tile')}
                className={`px-2 py-0.5 rounded-sm transition-all font-bold uppercase tracking-wider ${
                  !isFloorSpan ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-[#D1D1D1]/60 hover:text-white'
                }`}
              >
                Single
              </button>
              <button
                id="btn-mode-floor-span"
                onClick={() => setApplicationMode('full_floor_span')}
                className={`px-2 py-0.5 rounded-sm transition-all font-bold uppercase tracking-wider ${
                  isFloorSpan ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-[#D1D1D1]/60 hover:text-white'
                }`}
              >
                Span 20x10m
              </button>
            </div>
          )}

          {/* Wireframe Toggle */}
          <button
            id="btn-toggle-wireframe"
            onClick={() => setIsWireframe(!isWireframe)}
            className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono transition ${
              isWireframe
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]'
                : 'bg-[#1E1E20] text-[#D1D1D1]/70 border-[#2A2A2E] hover:text-white'
            }`}
          >
            Mesh
          </button>

          {/* Turntable Auto-Rotate */}
          <button
            id="btn-toggle-autorotate"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`p-1 rounded-sm border transition ${
              isAutoRotate
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]'
                : 'bg-[#1E1E20] text-[#D1D1D1]/70 border-[#2A2A2E] hover:text-white'
            }`}
            title="Toggle 360° Turntable Orbit"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
          </button>

          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1 bg-[#1E1E20] hover:bg-[#2A2A2E] text-[#D1D1D1] rounded border border-[#2A2A2E]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas Context */}
      <div className="flex-1 relative w-full h-full">
        <Canvas
          shadows
          camera={{
            position: activeArchetype === 'countertop_slab' ? [3.2, 2.4, 3.2] : [1.4, 1.2, 1.4],
            fov: 38,
          }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
        >
          <color attach="background" args={['#0F0F11']} />
          <ambientLight intensity={0.6} />

          {/* Studio Lighting Rig */}
          {lightingPreset === 'warm_gallery' ? (
            <>
              <directionalLight position={[4, 8, 4]} intensity={1.8} color="#FFF8E7" castShadow />
              <pointLight position={[-4, 3, -4]} intensity={0.8} color="#FFD1A4" />
            </>
          ) : lightingPreset === 'dramatic_relief' ? (
            <>
              <directionalLight position={[1.5, 0.8, 3]} intensity={2.5} color="#FFFFFF" castShadow />
              <pointLight position={[-3, -1, -2]} intensity={0.4} color="#00F0FF" />
            </>
          ) : (
            <>
              <directionalLight position={[3, 6, 4]} intensity={1.5} color="#FFFFFF" castShadow />
              <directionalLight position={[-3, 4, -3]} intensity={0.7} color="#E0F7FA" />
            </>
          )}

          <Environment preset="city" />

          {/* 3D Model Rendering by Archetype */}
          <Center>
            <group onClick={(e) => { e.stopPropagation(); useSceneStore.getState().selectObject('object_primary'); }}>
            {isFloorSpan && activeArchetype === 'flat_tile' ? (
              <FloorArrayScene />
            ) : activeArchetype === 'stair_tread' ? (
              <StairTread3DModel />
            ) : activeArchetype === '3d_wall_panel' ? (
              <WallPanel3DModel />
            ) : activeArchetype === 'skirting_molding' ? (
              <SkirtingMolding3DModel />
            ) : activeArchetype === 'countertop_slab' ? (
              <CountertopSlab3DModel />
            ) : (
              <TileModel />
            )}
            </group>
            <SceneObjectProof />
          </Center>

          {/* Ground Contact Shadow */}
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.65}
            scale={activeArchetype === 'countertop_slab' ? 6.0 : 3.5}
            blur={1.8}
            far={1.5}
          />

          <OrbitControls
            makeDefault
            minDistance={0.4}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2 + 0.05}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>

        {/* Floating Minimal HUD Status */}
        <div className="absolute bottom-2 left-2 z-10 px-2 py-1 bg-[#121214]/90 backdrop-blur border border-[#26262B] rounded text-[9px] font-mono text-[#888890] flex items-center gap-2 shadow-lg">
          <span className="text-[#00F0FF] uppercase font-bold">
            {activeArchetype.replace('_', ' ')}
          </span>
          <span>•</span>
          <span className="text-[#D4AF37] capitalize font-medium">{finish.glaze_type} Glaze</span>
          <span>•</span>
          <span>IOR 1.54</span>
        </div>
      </div>
    </div>
  );
};
