import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ShieldCheck, ScanLine } from 'lucide-react';
import { ReceiptData } from '../types';

interface ReceiptScanModalProps {
  receipt: ReceiptData;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b1c30]/70 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="relative bg-white max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#eff4ff] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-[#006948]" />
            <span className="font-bold text-sm text-[#0b1c30]">
              Raw Receipt Optical Scan
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#6cf8bb]/30 text-[#00714d] text-xs font-mono font-bold">
              {receipt.confidence || 99.4}% AI Confidence
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="p-6 overflow-auto flex flex-col items-center gap-4 bg-slate-50 min-h-[380px] justify-center">
          <div
            className="relative rounded-xl overflow-hidden shadow-md max-w-sm w-full bg-white transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {receipt.originalImageUrl ? (
              <img
                src={receipt.originalImageUrl}
                alt="Receipt Scan"
                className="w-full h-auto object-cover max-h-[500px]"
              />
            ) : (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                Physical ticket image stream not attached.
              </div>
            )}
            <div className="absolute inset-0 bg-[#006948]/5 pointer-events-none"></div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 max-w-md w-full text-center">
            <p className="text-xs text-slate-600 leading-relaxed font-mono">
              Digitized via Tabby Vision OCR Engine v4.2. OCR extracted {receipt.items.length} distinct
              items, subtotal ${receipt.subtotal.toFixed(2)}, and ${receipt.tax.toFixed(2)} state/local tax.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
