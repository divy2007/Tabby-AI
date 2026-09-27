import React from 'react';
import { Receipt, CheckCircle, Camera, Share2, Sparkles, FileText, ChevronDown, Hash } from 'lucide-react';
import { ReceiptData } from '../types';

interface HeaderProps {
  receipt: ReceiptData;
  onOpenUpload: () => void;
  onOpenExpenseReport: () => void;
  onExportUPI: () => void;
  onSelectSampleReceipt: (id: string) => void;
  sampleOptions: Array<{ id: string; label: string }>;
  activeTab: 'workspace' | 'history' | 'reports';
  setActiveTab: (tab: 'workspace' | 'history' | 'reports') => void;
}

export const Header: React.FC<HeaderProps> = ({
  receipt,
  onOpenUpload,
  onOpenExpenseReport,
  onExportUPI,
  onSelectSampleReceipt,
  sampleOptions,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#bccac0]/40 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      <div className="h-16 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Brand & Left Details */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#006948] to-[#00855d] flex items-center justify-center text-white shadow-sm ring-2 ring-[#85f8c4]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#0b1c30] tracking-tight flex items-center gap-1.5">
                Tabby AI
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#6cf8bb]/30 text-[#006c49] font-bold">
                  India OCR
                </span>
              </span>
            </div>
          </div>

          <div className="hidden xl:block h-6 w-px bg-slate-200"></div>

          {/* Active Bill & Bill Number Banner */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80">
              <Hash className="w-3.5 h-3.5 text-[#006948]" />
              <span className="text-xs font-mono font-bold text-slate-700">
                {receipt.billNumber || 'PG-48291'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-[#006948]" />
              <span className="text-sm font-semibold text-[#0b1c30] truncate max-w-[170px]">
                {receipt.restaurantName}
              </span>
              <span className="font-mono text-sm font-bold text-[#006948]">
                ₹{receipt.total.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6cf8bb]/25 text-[#00714d] text-xs font-mono font-medium border border-[#6cf8bb]/40">
              <CheckCircle className="w-3.5 h-3.5 text-[#00714d]" />
              <span>Bill Parsed {receipt.confidence || 99.4}%</span>
            </div>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#eff4ff] p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'workspace'
                ? 'bg-white text-[#0b1c30] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bill Splitter
          </button>
          
          {/* Indian Sample Bills Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              <span>Indian Sample Bills</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50">
              <div className="px-3 py-1 text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                Select Indian Dining Bill
              </div>
              {sampleOptions.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSampleReceipt(sample.id)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#eff4ff] hover:text-[#006948] font-medium transition-colors flex items-center justify-between"
                >
                  <span className="truncate pr-2">{sample.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Load</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenExpenseReport}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-white text-[#0b1c30] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#006948]" />
            <span>Expense Report</span>
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-95"
          >
            <Camera className="w-4 h-4 text-[#006948]" />
            <span className="font-semibold">Upload Indian Bill</span>
          </button>

          <button
            onClick={onExportUPI}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-[#006948] text-white hover:bg-[#00855d] text-xs sm:text-sm font-semibold transition-all shadow-[0_1px_3px_rgba(0,105,72,0.25)] active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">UPI / WhatsApp Export</span>
            <span className="sm:hidden">Share</span>
          </button>
        </div>
      </div>
    </header>
  );
};
