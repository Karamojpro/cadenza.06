import React from 'react';
import { useTileStore } from '../store/useTileStore';
import {
  X,
  Sparkles,
  Bot,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

export const AgentOrchestrationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    isAgentRunning,
    agentLogs,
    runAgentPipeline,
    activePassport,
    camReport,
  } = useTileStore();

  if (!isOpen) return null;

  const agents = [
    {
      id: 'DesignRoutingAgent',
      title: 'DesignRoutingAgent',
      role: 'Routes prompt, reference texture, & vector inlays to CAM path generation.',
      icon: Layers,
      color: 'border-cyan-500 text-cyan-400 bg-cyan-950/40',
    },
    {
      id: 'CADGenerationAgent',
      title: 'CADGenerationAgent',
      role: 'Calls CadQuery 3D Kernel to generate STEP solid, STL mesh, and Shapely kerf compensation.',
      icon: Cpu,
      color: 'border-blue-500 text-blue-400 bg-blue-950/40',
    },
    {
      id: 'QualityControlAgent',
      title: 'QualityControlAgent',
      role: 'Audits loop closure and wall thickness (>= 2.0mm). Loops back with repair instructions if breached.',
      icon: ShieldCheck,
      color: 'border-amber-500 text-amber-400 bg-amber-950/40',
    },
    {
      id: 'PassportSyncAgent',
      title: 'PassportSyncAgent',
      role: 'Compiles technical A4 passport and syncs digital token to factory machinery queue.',
      icon: FileText,
      color: 'border-emerald-500 text-emerald-400 bg-emerald-950/40',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#141416] border border-[#2A2A2E] rounded w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#D1D1D1] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#101012] border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1E1E20] border border-[#2A2A2E] flex items-center justify-center text-[#00F0FF]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                LangGraph Multi-Agent QC & CAM Orchestration Pipeline
              </h2>
              <p className="text-[11px] text-[#D1D1D1]/60 font-mono">
                AUTONOMOUS GEOMETRIC INSPECTION & REPAIR LOOP (max_retries=3)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#D1D1D1]/60 hover:text-white hover:bg-[#1E1E20] border border-transparent hover:border-[#2A2A2E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#0A0A0B]">
          {/* Agent Workflow Visual DAG Nodes */}
          <div className="p-3.5 bg-[#141416] border border-[#2A2A2E] rounded space-y-2">
            <div className="text-[10px] font-bold text-[#D1D1D1]/60 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
              LangGraph State Graph Topology
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1">
              {agents.map((agent, idx) => {
                const Icon = agent.icon;
                const activeLog = agentLogs.find((l) => l.agent_name === agent.id);
                const isRunning = isAgentRunning && activeLog?.status === 'running';
                const isSuccess = activeLog?.status === 'success';
                const isRetry = activeLog?.status === 'retry';

                return (
                  <div
                    key={agent.id}
                    className={`p-3 rounded border relative transition-all ${
                      isRunning
                        ? 'border-[#00F0FF] bg-[#1E1E20] shadow-md animate-pulse'
                        : isSuccess
                        ? 'border-emerald-500/60 bg-[#141416]'
                        : isRetry
                        ? 'border-[#D4AF37] bg-[#141416]'
                        : 'border-[#2A2A2E] bg-[#101012]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4 text-[#00F0FF]" />
                      <span className="text-[9px] font-mono text-[#D1D1D1]/50 uppercase">Node 0{idx + 1}</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-white mt-2 truncate">
                      {agent.title}
                    </div>
                    <p className="text-[10px] text-[#D1D1D1]/60 mt-1 leading-snug">{agent.role}</p>

                    {/* Status indicator badge */}
                    <div className="mt-2.5 pt-2 border-t border-[#2A2A2E] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#D1D1D1]/50">Status:</span>
                      {isRunning && <span className="text-[#00F0FF] font-bold">Running...</span>}
                      {isSuccess && <span className="text-emerald-400 font-bold">Passed ✓</span>}
                      {isRetry && <span className="text-[#D4AF37] font-bold">Repair Loop ⟳</span>}
                      {!activeLog && <span className="text-[#D1D1D1]/40">Idle</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Execution Logs Terminal */}
          <div className="p-3.5 bg-[#141416] border border-[#2A2A2E] rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D1D1D1]/60 font-mono uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Live Agent Execution Logs & Geometric Repair Telemetry
              </span>
              <span className="text-[10px] font-mono text-[#00F0FF]">
                {agentLogs.length} events logged
              </span>
            </div>

            <div className="h-52 bg-[#0A0A0B] border border-[#2A2A2E] rounded p-3 overflow-y-auto font-mono text-[10px] space-y-1.5 custom-scrollbar">
              {agentLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#D1D1D1]/40 text-xs">
                  Click "Run Pipeline Now" to execute the LangGraph multi-agent inspection loop.
                </div>
              ) : (
                agentLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded border flex items-start gap-2 ${
                      log.status === 'success'
                        ? 'bg-[#141416] border-emerald-500/50 text-emerald-300'
                        : log.status === 'retry'
                        ? 'bg-[#141416] border-[#D4AF37]/50 text-[#D4AF37]'
                        : log.status === 'running'
                        ? 'bg-[#141416] border-[#00F0FF]/50 text-[#00F0FF]'
                        : 'bg-[#101012] border-[#2A2A2E] text-[#D1D1D1]'
                    }`}
                  >
                    <span className="text-[9px] text-[#D1D1D1]/40 whitespace-nowrap">[{log.timestamp}]</span>
                    <span className="font-bold whitespace-nowrap">[{log.agent_name}]</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#101012] border-t border-[#2A2A2E] flex items-center justify-between">
          <div className="text-[11px] text-[#D1D1D1]/60 font-mono">
            ACTIVE PASSPORT: <span className="text-[#00F0FF]">{activePassport.passport_id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#1E1E20] hover:bg-[#2A2A2E] text-[#D1D1D1] text-xs font-bold uppercase tracking-wider rounded border border-[#2A2A2E] transition"
            >
              Close
            </button>
            <button
              id="btn-trigger-agent-run"
              onClick={runAgentPipeline}
              disabled={isAgentRunning}
              className="px-4 py-1.5 bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-black font-bold text-xs uppercase tracking-wider rounded shadow flex items-center gap-2 transition disabled:opacity-50"
            >
              {isAgentRunning ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isAgentRunning ? 'Executing Agents...' : 'Run Pipeline Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
