import React, { useState } from 'react';
import { useTileStore } from '../store/useTileStore';
import {
  X,
  Send,
  CheckCircle2,
  Building2,
  Cpu,
  QrCode,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const FactoryTransferModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { activePassport, updatePassportStatus } = useTileStore();
  const [targetFactory, setTargetFactory] = useState('SACMI-FAC-BOLOGNA-04');
  const [isTransferred, setIsTransferred] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTransfer = () => {
    updatePassportStatus('machining_in_progress');
    setIsTransferred(true);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(activePassport.sync_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#141416] border border-[#2A2A2E] rounded w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#D1D1D1] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#101012] border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1E1E20] border border-[#2A2A2E] flex items-center justify-center text-[#00F0FF]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                Factory Cloud Transfer Portal
              </h2>
              <p className="text-[11px] text-[#D1D1D1]/60 font-mono">
                DIRECT SYNC TO INDUSTRIAL CNC KILN & WATERJET CONTROLLERS
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

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto bg-[#0A0A0B] text-xs font-mono">
          {/* Target Factory Selector */}
          <div className="p-3 bg-[#141416] border border-[#2A2A2E] rounded space-y-1.5 font-sans">
            <label className="text-[#D1D1D1] font-bold block text-[10px] uppercase tracking-wider">
              Target Automated Manufacturing Plant
            </label>
            <select
              value={targetFactory}
              onChange={(e) => setTargetFactory(e.target.value)}
              className="w-full p-2 bg-[#0A0A0B] border border-[#2A2A2E] rounded text-white text-xs outline-none focus:border-[#00F0FF]"
            >
              <option value="SACMI-FAC-BOLOGNA-04">
                SACMI Automated Kiln & Waterjet Plant (Bologna, Italy)
              </option>
              <option value="SYSTEM-CERAMICS-MODENA-01">
                System Ceramics Creadigit Glaze Line (Modena, Italy)
              </option>
              <option value="PORCELANOSA-VILLARREAL-08">
                Porcelanosa Robotic Slab Facility (Villarreal, Spain)
              </option>
              <option value="MARAZZI-SASSUOLO-12">
                Marazzi High-Speed Continuous Pressing Plant (Sassuolo, Italy)
              </option>
            </select>
          </div>

          {/* Passport Payload Card */}
          <div className="p-3.5 bg-[#141416] border border-[#2A2A2E] rounded space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-2">
              <span className="text-[#D1D1D1] font-bold uppercase text-[10px] tracking-wider">Active Digital Passport ID</span>
              <span className="text-[#00F0FF] font-bold">{activePassport.passport_id}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-[#D1D1D1]">
              <div>Dimensions: <span className="text-white font-bold">{activePassport.dimensions.width_mm}×{activePassport.dimensions.height_mm}×{activePassport.dimensions.thickness_mm}mm</span></div>
              <div>Glaze: <span className="text-[#D4AF37] font-bold capitalize">{activePassport.finish.glaze_type}</span></div>
              <div>Waterjet Kerf: <span className="text-emerald-400 font-bold">0.75mm compensated</span></div>
              <div>Waffle Matrix: <span className="text-[#00F0FF] font-bold">50mm pitch dovetails</span></div>
            </div>

            {/* Sync Token */}
            <div className="p-2.5 bg-[#0A0A0B] rounded border border-[#2A2A2E] flex items-center justify-between">
              <div>
                <span className="text-[9px] text-[#D1D1D1]/60 block uppercase tracking-wider">Digital Transfer Token:</span>
                <span className="text-[#00F0FF] font-bold text-xs">{activePassport.sync_token}</span>
              </div>
              <button
                onClick={copyToken}
                className="px-2 py-1 bg-[#1E1E20] hover:bg-[#2A2A2E] border border-[#2A2A2E] text-white rounded flex items-center gap-1 text-[10px] uppercase font-bold"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Transfer Status Banner */}
          {isTransferred ? (
            <div className="p-3 bg-[#141416] border border-emerald-500/60 rounded flex items-center gap-3 text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-xs uppercase tracking-wide">Production Job Successfully Queued</div>
                <div className="text-[10px] text-[#D1D1D1]/80 mt-0.5">
                  Transferred to {targetFactory}. Machinery controller acknowledged 0.75mm kerf and STEP CAD solid.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#141416] border border-[#2A2A2E] rounded text-[#D1D1D1]/60 text-[10px]">
              Ready to transmit digital passport via REST API (<span className="text-[#00F0FF]">POST /api/v1/factory/transfer/{activePassport.passport_id}</span>).
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#101012] border-t border-[#2A2A2E] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#1E1E20] hover:bg-[#2A2A2E] text-[#D1D1D1] text-xs font-bold uppercase tracking-wider rounded border border-[#2A2A2E] transition"
          >
            Close
          </button>
          <button
            id="btn-confirm-factory-transfer"
            onClick={handleTransfer}
            className="px-4 py-1.5 bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-black font-bold text-xs uppercase tracking-wider rounded shadow flex items-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            Dispatch Passport to Factory Cloud
          </button>
        </div>
      </div>
    </div>
  );
};
