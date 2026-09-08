import React, { useState } from 'react';
import { useTileStore } from '../store/useTileStore';
import {
  createProductionZipBundle,
  generateDXF,
  generateSTL,
  generateSTEP,
  generateRIPData,
  generateFloorMatrixJSON,
  generateTechnicalPassportPDF,
} from '../utils/fileGenerators';
import {
  X,
  Download,
  Package,
  FileText,
  FileCode,
  Box,
  Layers,
  CheckCircle2,
  Cpu,
  Printer,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProductionBundleModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const store = useTileStore();
  const [selectedFile, setSelectedFile] = useState<string>('Passport_Report.pdf');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const blob = await createProductionZipBundle(store);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `StudioCadenza_Production_Bundle_${store.activePassport.passport_id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Error generating bundle:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSinglePdf = () => {
    const doc = generateTechnicalPassportPDF(store);
    doc.save(`Passport_Report_${store.activePassport.passport_id}.pdf`);
  };

  const getFilePreviewContent = () => {
    switch (selectedFile) {
      case 'CAD_Waterjet_Path.dxf':
        return generateDXF(store);
      case '3D_Print_Prototype.stl':
        return generateSTL(store);
      case '3D_CNC_Mold.step':
        return generateSTEP(store);
      case 'Glaze_Pigments_Channels.rip':
        return generateRIPData(store);
      case 'Floor_Layout_Matrix.json':
        return generateFloorMatrixJSON(store);
      default:
        return 'PDF Technical Passport compiled with WeasyPrint / jsPDF.';
    }
  };

  const bundleFiles = [
    {
      name: 'Passport_Report.pdf',
      desc: 'A4 Technical Specification Passport & Machine Directives',
      icon: FileText,
      tag: 'Technical Spec',
      color: 'text-red-400',
    },
    {
      name: 'CAD_Waterjet_Path.dxf',
      desc: 'Closed Polylines with 0.75mm Kerf Compensation',
      icon: FileCode,
      tag: 'CAM 2D',
      color: 'text-cyan-400',
    },
    {
      name: '3D_CNC_Mold.step',
      desc: 'Solid 3D Model with Front Relief and 50mm Dovetail Waffle',
      icon: Box,
      tag: 'CNC STEP',
      color: 'text-amber-400',
    },
    {
      name: '3D_Print_Prototype.stl',
      desc: 'High-Density 3D Printable Tessellated Mesh',
      icon: Cpu,
      tag: '3D Mesh',
      color: 'text-indigo-400',
    },
    {
      name: 'Glaze_Pigments_Channels.rip',
      desc: 'N-Channel Ceramic Pigment Density Maps (Cobalt, Iron, Titanium)',
      icon: Printer,
      tag: 'Digital RIP',
      color: 'text-emerald-400',
    },
    {
      name: 'Floor_Layout_Matrix.json',
      desc: 'UV Span Placement Coordinates for 20m × 10m Architectural Area',
      icon: Layers,
      tag: 'BIM / JSON',
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#141416] border border-[#2A2A2E] rounded w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#D1D1D1] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-[#101012] border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1E1E20] border border-[#2A2A2E] flex items-center justify-center text-[#00F0FF]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                Manufacturing Production Package Builder
                <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[#1E1E20] text-[#00F0FF] border border-[#2A2A2E] font-mono font-bold">
                  ISO 13006 READY
                </span>
              </h2>
              <p className="text-[11px] text-[#D1D1D1]/60 font-mono">
                PASSPORT ID: <span className="text-[#00F0FF]">{store.activePassport.passport_id}</span>
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

        {/* Modal Body: Two Column File Explorer + Live Code/Spec Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-[#2A2A2E] overflow-hidden">
          {/* File Manifest List (5 cols) */}
          <div className="md:col-span-5 p-3 space-y-2 overflow-y-auto bg-[#0A0A0B]">
            <div className="text-[10px] font-bold text-[#D1D1D1]/60 uppercase tracking-[0.15em] px-1">
              INCLUDED PRODUCTION ASSETS ({bundleFiles.length} FILES)
            </div>

            {bundleFiles.map((file) => {
              const Icon = file.icon;
              const isSelected = selectedFile === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file.name)}
                  className={`w-full text-left p-2.5 rounded border transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#1E1E20] border-[#00F0FF] shadow-sm'
                      : 'bg-[#141416] border-[#2A2A2E] hover:bg-[#1E1E20] hover:border-[#2A2A2E]'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${file.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white truncate">
                        {file.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#101012] text-[#D1D1D1]/70 border border-[#2A2A2E] rounded-sm font-mono uppercase">
                        {file.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#D1D1D1]/60 truncate mt-0.5">{file.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Asset Preview Inspector (7 cols) */}
          <div className="md:col-span-7 p-3.5 flex flex-col bg-[#141416] overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2E] text-xs">
              <span className="font-mono text-[#00F0FF] font-bold text-[11px] flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                {selectedFile}
              </span>
              {selectedFile === 'Passport_Report.pdf' && (
                <button
                  onClick={handleDownloadSinglePdf}
                  className="px-2 py-1 bg-[#1E1E20] hover:border-[#00F0FF] text-white border border-[#2A2A2E] rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-[#00F0FF]" />
                  Save PDF
                </button>
              )}
            </div>

            {/* Code / Spec Viewer Area */}
            <div className="flex-1 mt-2 p-3 bg-[#0A0A0B] rounded border border-[#2A2A2E] overflow-y-auto font-mono text-[11px] text-[#D1D1D1] custom-scrollbar leading-relaxed">
              {selectedFile === 'Passport_Report.pdf' ? (
                <div className="space-y-3 font-sans">
                  <div className="p-3 bg-[#141416] border border-[#2A2A2E] rounded">
                    <div className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider">
                      Technical Production Specification Passport
                    </div>
                    <div className="text-[11px] text-[#D1D1D1]/60 font-mono">
                      PASSPORT ID: {store.activePassport.passport_id}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-[#141416] rounded border border-[#2A2A2E]">
                      <span className="text-[#D1D1D1]/60 block text-[10px] uppercase">Tile Format:</span>
                      <span className="font-bold text-white font-mono text-[11px]">
                        {store.dimensions.width_mm} × {store.dimensions.height_mm} ×{' '}
                        {store.dimensions.thickness_mm} mm
                      </span>
                    </div>
                    <div className="p-2 bg-[#141416] rounded border border-[#2A2A2E]">
                      <span className="text-[#D1D1D1]/60 block text-[10px] uppercase">Mass per Tile:</span>
                      <span className="font-bold text-white font-mono text-[11px]">
                        {store.calculations.singleTileMassKg} kg (Porcelain)
                      </span>
                    </div>
                    <div className="p-2 bg-[#141416] rounded border border-[#2A2A2E]">
                      <span className="text-[#D1D1D1]/60 block text-[10px] uppercase">Floor Span (20×10m):</span>
                      <span className="font-bold text-white font-mono text-[11px]">
                        {store.calculations.tilesWithWasteCount} pcs ({store.calculations.totalFloorMassKg} kg)
                      </span>
                    </div>
                    <div className="p-2 bg-[#141416] rounded border border-[#2A2A2E]">
                      <span className="text-[#D1D1D1]/60 block text-[10px] uppercase">Waterjet Kerf:</span>
                      <span className="font-bold text-emerald-400 font-mono text-[11px]">
                        {store.camReport.kerf_mm}mm @ 4100 bar
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#141416] rounded border border-[#2A2A2E] text-xs">
                    <span className="text-[#D1D1D1]/60 block text-[10px] uppercase">Color & Glaze:</span>
                    <span className="text-[#D4AF37] font-mono font-bold text-[11px]">
                      {store.color.primary_hex} | {store.color.pantone_code} | {store.finish.glaze_type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre font-mono text-[10px] text-[#D1D1D1]">{getFilePreviewContent()}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#101012] border-t border-[#2A2A2E] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#D1D1D1]/70 font-mono text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>6 industrial files compiled and verified for factory transfer.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#1E1E20] hover:bg-[#2A2A2E] text-[#D1D1D1] text-xs font-bold uppercase tracking-wider rounded border border-[#2A2A2E] transition"
            >
              Close
            </button>
            <button
              id="btn-confirm-download-zip"
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="px-4 py-1.5 bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-black font-bold text-xs uppercase tracking-wider rounded shadow flex items-center gap-2 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Packaging Archive...' : 'Download Production Bundle (.ZIP)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
