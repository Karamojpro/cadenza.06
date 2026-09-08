import { Dimensions, VectorPath } from '../types';

export interface DesignIntent {
  palette: string[];
  motif: 'geometric' | 'organic' | 'fluted' | 'minimal';
  operations: Array<'inlay' | 'engrave' | 'cut' | 'relief'>;
  reliefDepthMm: number;
  confidence: number;
}

export interface GeneratedDesign {
  name: string;
  description: string;
  intent: DesignIntent;
  vectors: VectorPath[];
}

/** Deterministic local design engine used by the product even without an API key. */
export function synthesizeDesign(prompt: string, dimensions: Dimensions): GeneratedDesign {
  const p = prompt.toLowerCase();
  const geometric = /geometric|diamond|grid|art deco|deco|angular/.test(p);
  const organic = /organic|leaf|botanical|wave|floral|nature/.test(p);
  const fluted = /fluted|ribbed|linear|groove/.test(p);
  const motif = geometric ? 'geometric' : organic ? 'organic' : fluted ? 'fluted' : 'minimal';
  const palette = /blue|cobalt/.test(p) ? ['#0F3B66','#F8FAFC','#D4AF37'] : /green|emerald/.test(p) ? ['#1C382B','#C5A059','#E2E8F0'] : /black|basalt/.test(p) ? ['#18181B','#71717A','#E4E4E7'] : ['#F5F5F0','#D4AF37','#4A4A4A'];
  const reliefDepthMm = /deep|relief|bas-relief/.test(p) ? Math.min(dimensions.thickness_mm * 0.55, 5) : 2.2;
  const cx = dimensions.width_mm / 2, cy = dimensions.height_mm / 2;
  const vectors: VectorPath[] = [];
  if (motif === 'geometric') vectors.push({ id:`ai_${Date.now()}_diamond`, type:'polyline', points:[{x:cx,y:60},{x:dimensions.width_mm-60,y:cy},{x:cx,y:dimensions.height_mm-60},{x:60,y:cy},{x:cx,y:60}], color:palette[1], closed:true, layer:'LAYER_INLAY', strokeWidth:3, depth_mm:reliefDepthMm });
  else if (motif === 'fluted') for(let i=1;i<=7;i++){const y=i*dimensions.height_mm/8; vectors.push({id:`ai_${Date.now()}_${i}`,type:'polyline',points:[{x:50,y},{x:cx,y:y+(i%2?22:-22)},{x:dimensions.width_mm-50,y}],color:palette[1],closed:false,layer:'LAYER_ENGRAVE',strokeWidth:2.2,depth_mm:Math.min(reliefDepthMm,3.5)});}
  else if (motif === 'organic') vectors.push({id:`ai_${Date.now()}_organic`,type:'polyline',points:[{x:cx-180,y:cy},{x:cx-80,y:cy-120},{x:cx+40,y:cy-50},{x:cx+180,y:cy-150},{x:cx+100,y:cy},{x:cx+180,y:cy+150},{x:cx+20,y:cy+50},{x:cx-80,y:cy+120},{x:cx-180,y:cy}],color:palette[1],closed:false,layer:'LAYER_RELIEF',strokeWidth:2.5,depth_mm:reliefDepthMm});
  else vectors.push({id:`ai_${Date.now()}_minimal`,type:'circle',points:[{x:cx,y:cy-140},{x:cx+140,y:cy},{x:cx,y:cy+140},{x:cx-140,y:cy},{x:cx,y:cy-140}],color:palette[1],closed:true,layer:'LAYER_INLAY',strokeWidth:2.5,depth_mm:reliefDepthMm});
  const operations: DesignIntent['operations'] = motif === 'fluted' ? ['engrave','relief'] : motif === 'geometric' ? ['inlay','cut'] : ['relief','inlay'];
  return { name:`Cadenza ${motif[0].toUpperCase()+motif.slice(1)} Concept`, description:`Parametric concept synthesized from: ${prompt}`, intent:{palette,motif,operations,reliefDepthMm,confidence:0.82}, vectors };
}
