/**
 * Phase 3 compatibility facade.
 *
 * The canonical document/object graph lives in useSceneStore. This module keeps
 * the Phase 2 VectorPath API stable for legacy UI/export code while ensuring
 * there is only one source of truth for objects and layers.
 */
import { useSceneStore } from './useSceneStore';
import { VectorPath, ObjectTransform } from '../types';
import { getResolvedLayerId, getTransformedPoints, IDENTITY_TRANSFORM } from '../utils/objectTransform';

export type PresetPatternKey =
  | 'geometric_brass' | 'moroccan_zellige' | 'terrazzo_florence'
  | 'chevron_relief' | 'art_deco_inlay';

export interface ProjectStoreState {
  projectId: string; projectName: string; createdAt: string; isDirty: boolean;
  layers: ReturnType<typeof useSceneStore.getState>['layers'];
  activeLayerId: string;
  setActiveLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  reorderLayers: (draggedId: string, targetId: string) => void;
  isLayerLocked: (id: string) => boolean;
  objects: VectorPath[]; selectedObjectIds: string[]; activeObjectId: string | null;
  addObject: (path: VectorPath) => void; removeObject: (id: string) => void;
  removeSelectedObjects: () => void; clearObjects: () => void; setObjects: (paths: VectorPath[]) => void;
  updateObjectTransform: (id: string, partial: Partial<ObjectTransform>) => void;
  selectObject: (id: string | null, opts?: { additive?: boolean }) => void;
  clearSelection: () => void; loadPresetPattern: (patternKey: PresetPatternKey) => void;
  setProjectName: (name: string) => void; markDirty: () => void;
  buildProjectSnapshot: () => ReturnType<ReturnType<typeof useSceneStore.getState>['buildProjectSnapshot']>;
  serializeProject: () => string; downloadProject: () => void;
  parseProjectFile: (json: string) => any; loadProject: (project: any) => void; newProject: () => void;
}

const toVector = (o: any): VectorPath => ({
  id: o.id,
  type: o.geometry?.params?.type || 'polyline',
  points: o.geometry?.params?.points || [],
  color: o.geometry?.params?.color || '#000000',
  closed: !!o.geometry?.params?.closed,
  layerId: o.layerId,
  strokeWidth: o.geometry?.params?.strokeWidth ?? 2,
  depth_mm: o.geometry?.params?.depth_mm ?? 0,
  transform: { x_mm: o.transform?.x_mm ?? 0, y_mm: o.transform?.y_mm ?? 0, rotation_deg: o.transform?.rotation_z_deg ?? 0, scale: o.transform?.scale_x ?? 1 },
});

const toScene = (v: VectorPath): any => ({
  id: v.id, name: v.id, kind: 'vector_object',
  transform: { x_mm: v.transform?.x_mm ?? 0, y_mm: v.transform?.y_mm ?? 0, z_mm: 0, rotation_x_deg: 0, rotation_y_deg: 0, rotation_z_deg: v.transform?.rotation_deg ?? 0, scale_x: v.transform?.scale ?? 1, scale_y: v.transform?.scale ?? 1, scale_z: 1 },
  visible: true, locked: false, manufacturingIncluded: true,
  layerId: v.layerId || 'layer_inlay', materialId: 'mat_default',
  geometry: { kind: 'vector_object', params: { points: v.points, closed: v.closed, type: v.type, strokeWidth: v.strokeWidth, depth_mm: v.depth_mm, color: v.color } },
});

export const useProjectStore = ((selector?: any) => {
  const s = useSceneStore();
  const value: any = {
    projectId: s.projectId, projectName: s.projectName, createdAt: s.createdAt, isDirty: s.isDirty,
    layers: s.layers, activeLayerId: s.activeLayerId,
    setActiveLayer: s.setActiveLayer, toggleLayerVisibility: s.toggleLayerVisibility,
    toggleLayerLock: s.toggleLayerLock, setLayerOpacity: s.setLayerOpacity,
    reorderLayers: s.reorderLayers, isLayerLocked: s.isLayerLocked,
    objects: s.objectIds.map(id => s.objects[id]).filter(Boolean).filter(o => o.kind === 'vector_object').map(toVector),
    selectedObjectIds: s.selectedObjectIds, activeObjectId: s.activeObjectId,
    addObject: (v: VectorPath) => s.addObject(toScene(v)),
    removeObject: s.removeObject,
    removeSelectedObjects: () => s.selectedObjectIds.forEach(s.removeObject),
    clearObjects: () => s.setObjects((Object.values(s.objects) as any[]).filter(o => o.kind !== 'vector_object')),
    setObjects: (vs: VectorPath[]) => s.setObjects([...(Object.values(s.objects) as any[]).filter(o => o.kind !== 'vector_object'), ...vs.map(toScene)]),
    updateObjectTransform: (id: string, p: Partial<ObjectTransform>) => s.updateObjectTransform(id, { x_mm: p.x_mm, y_mm: p.y_mm, rotation_z_deg: p.rotation_deg, scale_x: p.scale, scale_y: p.scale }),
    selectObject: s.selectObject, clearSelection: s.clearSelection,
    loadPresetPattern: (key: PresetPatternKey) => {
      const d = s.dimensions, cx = d.width_mm / 2, cy = d.height_mm / 2;
      let vs: VectorPath[] = [];
      if (key === 'geometric_brass' || key === 'art_deco_inlay') vs = [
        { id:`geom_outer_${Date.now()}`, type:'polyline', points:[{x:cx,y:60},{x:d.width_mm-60,y:cy},{x:cx,y:d.height_mm-60},{x:60,y:cy},{x:cx,y:60}], color:'#D4AF37', closed:true, layerId:'layer_inlay', strokeWidth:3, depth_mm:2.5 },
        { id:`geom_inner_${Date.now()}`, type:'circle', points:[{x:cx,y:cy-140},{x:cx+140,y:cy},{x:cx,y:cy+140},{x:cx-140,y:cy},{x:cx,y:cy-140}], color:'#D4AF37', closed:true, layerId:'layer_cut', strokeWidth:2, depth_mm:3.5 }
      ];
      else if (key === 'moroccan_zellige') { const sx=d.width_mm/4, sy=d.height_mm/4; for(let i=1;i<=3;i++)for(let j=1;j<=3;j++){const x=i*sx,y=j*sy,wx=sx/2.5,wy=sy/2.5;vs.push({id:`zellige_${i}_${j}`,type:'rectangle',points:[{x:x-wx,y:y-wy},{x:x+wx,y:y-wy},{x:x+wx,y:y+wy},{x:x-wx,y:y+wy},{x:x-wx,y:y-wy}],color:'#1B365D',closed:true,layerId:'layer_inlay',strokeWidth:2,depth_mm:1.8});}}
      else if (key === 'chevron_relief') { const spacing=d.height_mm/7; for(let k=1;k<=6;k++)vs.push({id:`chevron_${k}`,type:'polyline',points:[{x:50,y:k*spacing},{x:cx,y:k*spacing+40},{x:d.width_mm-50,y:k*spacing}],color:'#2E5A44',closed:false,layerId:'layer_engrave',strokeWidth:2,depth_mm:2.2}); }
      else vs=[{id:`flake_${Date.now()}`,type:'polyline',points:[{x:cx-180,y:cy-120},{x:cx-110,y:cy-180},{x:cx-40,y:cy-110},{x:cx-100,y:cy-60},{x:cx-180,y:cy-120}],color:'#D4AF37',closed:true,layerId:'layer_inlay',strokeWidth:2,depth_mm:3}];
      value.setObjects(vs);
    },
    setProjectName: (name:string)=>useSceneStore.getState().setProjectName(name), markDirty: ()=>useSceneStore.setState({isDirty:true}),
    buildProjectSnapshot: s.buildProjectSnapshot, serializeProject: s.serializeProject, downloadProject: s.downloadProject,
    parseProjectFile: s.parseProjectFile, loadProject: s.loadProject, newProject: s.newProject,
  };
  return selector ? selector(value) : value;
}) as any;

useProjectStore.getState = () => {
  const s = useSceneStore.getState();
  return {
    projectId:s.projectId, projectName:s.projectName, createdAt:s.createdAt, isDirty:s.isDirty, layers:s.layers, activeLayerId:s.activeLayerId,
    setActiveLayer:s.setActiveLayer,toggleLayerVisibility:s.toggleLayerVisibility,toggleLayerLock:s.toggleLayerLock,setLayerOpacity:s.setLayerOpacity,reorderLayers:s.reorderLayers,isLayerLocked:s.isLayerLocked,
    objects:s.objectIds.map(id=>s.objects[id]).filter(o=>o?.kind==='vector_object').map(toVector),selectedObjectIds:s.selectedObjectIds,activeObjectId:s.activeObjectId,
    addObject:(v:VectorPath)=>s.addObject(toScene(v)),removeObject:s.removeObject,removeSelectedObjects:()=>s.selectedObjectIds.forEach(s.removeObject),clearObjects:()=>s.setObjects((Object.values(s.objects) as any[]).filter(o=>o.kind!=='vector_object')),
    setObjects:(vs:VectorPath[])=>s.setObjects([...(Object.values(s.objects) as any[]).filter(o=>o.kind!=='vector_object'),...vs.map(toScene)]),
    updateObjectTransform:(id:string,p:Partial<ObjectTransform>)=>s.updateObjectTransform(id,{x_mm:p.x_mm,y_mm:p.y_mm,rotation_z_deg:p.rotation_deg,scale_x:p.scale,scale_y:p.scale}),selectObject:s.selectObject,clearSelection:s.clearSelection,
    loadPresetPattern:(key:PresetPatternKey)=>{ /* hook calls through React facade */ },setProjectName:(n:string)=>s.setProjectName(n),markDirty:()=>useSceneStore.setState({isDirty:true}),buildProjectSnapshot:s.buildProjectSnapshot,serializeProject:s.serializeProject,downloadProject:s.downloadProject,parseProjectFile:s.parseProjectFile,loadProject:s.loadProject,newProject:s.newProject
  } as any;
};
useProjectStore.setState = (partial:any) => useSceneStore.setState(partial as any);

export function getVisibleOrderedObjects(): VectorPath[] {
  const s = useSceneStore.getState();
  const known = new Set(s.layers.map(l=>l.id)); const out:VectorPath[]=[];
  for(const layer of s.layers){ if(!layer.visible) continue; for(const id of s.objectIds){const o=s.objects[id]; if(o?.kind==='vector_object' && o.layerId===layer.id && o.visible) out.push(toVector(o));}}
  for(const id of s.objectIds){const o=s.objects[id]; if(o?.kind==='vector_object' && o.visible && !known.has(o.layerId)) out.push(toVector(o));}
  return out;
}
export function getTransformedVisibleObjects(): VectorPath[] { return getVisibleOrderedObjects().map(o=>({...o,points:getTransformedPoints(o)})); }

/** Manufacturing selector is intentionally independent from editor visibility. */
export function getTransformedManufacturingObjects(): VectorPath[] {
  const s = useSceneStore.getState();
  return s.objectIds
    .map(id => s.objects[id])
    .filter(o => o?.kind === 'vector_object' && o.manufacturingIncluded)
    .map(toVector)
    .map(o => ({ ...o, points: getTransformedPoints(o) }));
}
