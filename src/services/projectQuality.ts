import { ProjectV2 } from '../types/scene';

export interface ProjectQualityReport { passed:boolean; score:number; errors:string[]; warnings:string[]; checks:Record<string,boolean>; }

export function auditProject(project: ProjectV2): ProjectQualityReport {
  const errors:string[]=[]; const warnings:string[]=[];
  const scene=project.scenes[project.activeSceneId];
  if(!scene) errors.push('Active scene is missing.');
  if(scene && scene.objectIds.some(id=>!scene.objects[id])) errors.push('Scene object index contains missing objects.');
  if(scene && Object.values(scene.objects).some(o=>!scene.materials[o.materialId])) errors.push('One or more objects reference missing materials.');
  if(scene && Object.values(scene.objects).some(o=>o.geometry.kind==='vector_object' && o.geometry.params.points.length<2)) errors.push('A vector object has fewer than two points.');
  if(project.schemaVersion!==2) errors.push('Unsupported project schema.');
  if(!project.manufacturing.targetFactoryId) warnings.push('No target factory selected.');
  if(scene && Object.values(scene.objects).some(o=>o.visible===false && o.manufacturingIncluded)) warnings.push('Hidden objects remain included in manufacturing; this is intentional but should be reviewed.');
  const checks={schema:project.schemaVersion===2,scene:!!scene,objectIndex:!!scene&&!scene.objectIds.some(id=>!scene.objects[id]),materials:!!scene&&!Object.values(scene.objects).some(o=>!scene.materials[o.materialId]),geometry:!!scene&&!Object.values(scene.objects).some(o=>o.geometry.kind==='vector_object'&&o.geometry.params.points.length<2)};
  const passed=errors.length===0; const score=Math.max(0,Math.round((Object.values(checks).filter(Boolean).length/Object.values(checks).length)*100)-errors.length*10-warnings.length*3);
  return {passed,score,errors,warnings,checks};
}
