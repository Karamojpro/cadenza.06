import React, { useMemo, useState } from 'react';
import { Boxes, Bot, CheckCircle2, Copy, Factory, FileCheck2, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { useSceneStore } from '../store/useSceneStore';
import { useEditorUIStore } from '../store/useEditorUIStore';

export function ReleaseCommandCenter({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState('Art Deco Carrara marble with brushed gold geometric inlay');
  const { objects, selectedObjectIds, manufacturingPlan, qualityReport, applyAIDesign, duplicateObject, buildManufacturingPlan, auditProject } = useSceneStore();
  const { setAiGenerating, setAgentRunning, setAgentLogs } = useEditorUIStore();
  const included = useMemo(() => Object.values(objects).filter(o => o.manufacturingIncluded).length, [objects]);
  const selected = selectedObjectIds[0];

  const runAI = () => {
    setAiGenerating(true, 'Synthesizing parametric design intent…');
    window.setTimeout(() => { applyAIDesign(prompt); setAiGenerating(false, 'Concept applied to the scene.'); }, 120);
  };
  const runQC = () => {
    setAgentRunning(true);
    setAgentLogs([{agent_name:'DesignIntegrityAgent',status:'running',message:'Auditing schema, geometry, materials and manufacturing inclusion.',timestamp:new Date().toISOString()}]);
    window.setTimeout(() => { const r=auditProject(); setAgentLogs([{agent_name:'DesignIntegrityAgent',status:r.passed?'success':'retry',message:`Release audit ${r.passed?'passed':'needs review'} — score ${r.score}/100.`,timestamp:new Date().toISOString()}]); setAgentRunning(false); }, 180);
  };

  return <div className="absolute inset-0 z-[80] bg-black/65 backdrop-blur-sm flex items-center justify-center p-6" onMouseDown={e=>e.currentTarget===e.target&&onClose()}>
    <div className="w-full max-w-5xl bg-[#111114] border border-[#303038] rounded-xl shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#29292F] flex items-center justify-between"><div><div className="text-[11px] font-mono tracking-[.2em] text-[#00F0FF]">CADENZA RELEASE COMMAND CENTER</div><h2 className="text-white text-lg font-semibold mt-1">Phases 4 → 6</h2></div><button onClick={onClose} className="text-zinc-400 hover:text-white"><XCircle size={18}/></button></div>
      <div className="grid grid-cols-3 gap-px bg-[#29292F]">
        <section className="bg-[#111114] p-5"><div className="flex items-center gap-2 text-white font-semibold"><Factory size={16}/> Phase 4 · Manufacturing</div><p className="text-[11px] text-zinc-500 mt-2">Production inclusion is independent from editor visibility.</p><div className="grid grid-cols-2 gap-2 mt-4">{[['Objects',included],['Vector ops',manufacturingPlan.vectorOperationCount],['Path mm',Math.round(manufacturingPlan.estimatedCutPathMm)],['Machine min',manufacturingPlan.estimatedMachineMinutes]].map(([k,v])=><div key={String(k)} className="bg-[#18181C] border border-[#25252B] rounded p-3"><div className="text-[9px] text-zinc-500 uppercase">{k}</div><div className="text-white font-mono mt-1">{v}</div></div>)}</div><button onClick={()=>buildManufacturingPlan()} className="mt-4 w-full py-2 border border-[#3A3A42] rounded text-[10px] text-zinc-300 hover:text-white hover:border-[#00F0FF]">REBUILD MANUFACTURING PLAN</button></section>
        <section className="bg-[#111114] p-5"><div className="flex items-center gap-2 text-white font-semibold"><Bot size={16}/> Phase 5 · AI Design Engine</div><p className="text-[11px] text-zinc-500 mt-2">Prompt → design intent → editable vector objects. Local deterministic fallback remains available.</p><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="mt-4 w-full h-24 bg-[#18181C] border border-[#2B2B31] rounded p-3 text-xs text-zinc-200 outline-none focus:border-[#00F0FF] resize-none"/><button onClick={runAI} className="mt-3 w-full py-2 bg-[#00F0FF]/10 border border-[#00F0FF]/40 rounded text-[10px] text-[#8FF8FF] hover:bg-[#00F0FF]/20 flex justify-center gap-2"><Sparkles size={13}/> SYNTHESIZE & APPLY</button></section>
        <section className="bg-[#111114] p-5"><div className="flex items-center gap-2 text-white font-semibold"><ShieldCheck size={16}/> Phase 6 · Release QA</div><p className="text-[11px] text-zinc-500 mt-2">Final integrity gate before exporting or sending the project to a factory.</p><div className="mt-4 bg-[#18181C] border border-[#25252B] rounded p-4"><div className="flex items-center justify-between"><span className="text-[10px] text-zinc-500">RELEASE SCORE</span><span className="text-xl font-mono text-white">{qualityReport.score}/100</span></div><div className="mt-3 h-1.5 bg-[#29292F] rounded overflow-hidden"><div className="h-full bg-[#00F0FF]" style={{width:`${qualityReport.score}%`}}/></div><div className="mt-3 text-[10px]">{qualityReport.passed?<span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> Release gate passed</span>:<span className="text-red-400">{qualityReport.errors.length} blocking issue(s)</span>}</div></div><button onClick={runQC} className="mt-4 w-full py-2 border border-[#3A3A42] rounded text-[10px] text-zinc-300 hover:text-white hover:border-[#00F0FF] flex justify-center gap-2"><FileCheck2 size={13}/> RUN RELEASE AUDIT</button>{selected&&<button onClick={()=>duplicateObject(selected)} className="mt-2 w-full py-2 border border-[#3A3A42] rounded text-[10px] text-zinc-300 hover:text-white flex justify-center gap-2"><Copy size={13}/> DUPLICATE SELECTED OBJECT</button>}</section>
      </div>
      <div className="px-5 py-3 border-t border-[#29292F] flex items-center justify-between text-[9px] font-mono text-zinc-500"><span className="flex items-center gap-2"><Boxes size={12}/> {Object.keys(objects).length} scene objects · {manufacturingPlan.operations.length} manufacturing operations</span><span>PHASE 3 FOUNDATION → RELEASE CANDIDATE</span></div>
    </div>
  </div>;
}
