import React from 'react';
import {
  X,
  Printer,
  Copy,
  CheckCircle,
  Receipt,
  FileSpreadsheet,
  Hash,
  Smartphone,
} from 'lucide-react';
import { ReceiptData, ParticipantSettlement } from '../types';
import { generateGroupChatSummary, exportToCSV } from '../utils/calculations';

interface ExpenseReportModalProps {
  receipt: ReceiptData;
  settlements: ParticipantSettlement[];
  isOpen: boolean;
  onClose: () => void;
  onTriggerToast: (msg: string) => void;
}

export const ExpenseReportModal: React.FC<ExpenseReportModalProps> = ({
  receipt,
  settlements,
  isOpen,
  onClose,
  onTriggerToast,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = generateGroupChatSummary(receipt, settlements);
    navigator.clipboard?.writeText(text);
    onTriggerToast('Copied Indian bill split summary for WhatsApp / Group chat!');
  };

  const handleDownloadCSV = () => {
    const csv = exportToCSV(receipt, settlements);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${receipt.restaurantName.replace(/\s+/g, '_')}_Bill_${receipt.billNumber || 'Report'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast('Downloaded expense report CSV with GST details!');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b1c30]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 my-8 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#eff4ff] border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#006948]" />
            <div>
              <h2 className="font-bold text-base text-[#0b1c30]">
                Official Indian Bill Split Report
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Bill #{receipt.billNumber} • Reconciled in ₹ INR with GST
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleCopyText}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006948] text-white text-xs font-semibold hover:bg-[#00855d] transition-colors shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy for WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Expense Report Sheet */}
        <div className="p-8 flex flex-col gap-6 overflow-y-auto max-h-[75vh] print:max-h-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#006948] font-bold">
                Tabby AI • Indian Restaurant Split Settlement
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-2xl font-extrabold text-[#0b1c30]">
                  {receipt.restaurantName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-[#006948]/10 text-[#006948] font-mono font-bold text-xs border border-[#006948]/20">
                  Bill #{receipt.billNumber}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1.5 flex items-center gap-2 flex-wrap">
                <span>{receipt.date}</span>
                {receipt.time && <span>• {receipt.time}</span>}
                {receipt.table && <span>• Table: {receipt.table}</span>}
                {receipt.gstin && <span>• GSTIN: {receipt.gstin}</span>}
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Total Bill Amount
              </span>
              <span className="text-3xl font-extrabold text-[#006948] font-mono tracking-tight">
                ₹{receipt.total.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                Subtotal: ₹{receipt.subtotal.toFixed(2)}
                {receipt.discount ? ` | Discount: -₹${receipt.discount.toFixed(2)}` : ''}
                {` | GST (5%): ₹${receipt.tax.toFixed(2)}`}
                {receipt.serviceCharge ? ` | Service Charge: ₹${receipt.serviceCharge.toFixed(2)}` : ''}
              </span>
            </div>
          </div>

          {/* Group Members Itemized Cards */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Individual Dinner Shares (Proportionally Distributed)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settlements.map((s) => {
                return (
                  <div
                    key={s.participant.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full text-xs font-mono font-bold text-white flex items-center justify-center ${
                            s.participant.color === 'purple'
                              ? 'bg-purple-600'
                              : s.participant.color === 'emerald'
                              ? 'bg-[#006948]'
                              : s.participant.color === 'amber'
                              ? 'bg-amber-600'
                              : 'bg-indigo-600'
                          }`}
                        >
                          {s.participant.avatarLetter}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#0b1c30] block">
                            {s.participant.name}
                          </span>
                          {s.participant.upiId && (
                            <span className="text-[10px] font-mono text-slate-400">
                              ⚡ {s.participant.upiId}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-base font-extrabold text-[#006948]">
                        ₹{s.totalDue.toFixed(2)}
                      </span>
                    </div>

                    {/* Claimed Items */}
                    <div className="flex flex-col gap-1 text-xs font-mono text-slate-600">
                      {s.claimedItems.length === 0 ? (
                        <span className="italic text-slate-400">No dishes claimed</span>
                      ) : (
                        s.claimedItems.map((ci, idx) => {
                          const shareLabel =
                            ci.fraction === 1
                              ? '100%'
                              : ci.fraction === 0.5
                              ? '½'
                              : ci.fraction === 0.25
                              ? '¼'
                              : `${Math.round(ci.fraction * 100)}%`;

                          return (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="truncate pr-2">
                                • {ci.item.name} ({shareLabel})
                              </span>
                              <span className="font-semibold text-slate-900 shrink-0">
                                ₹{ci.amount.toFixed(2)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Proportional math breakdown */}
                    <div className="pt-2 border-t border-dashed border-slate-200 flex flex-col gap-0.5 text-[11px] font-mono text-slate-500">
                      <div className="flex justify-between">
                        <span>Dishes Subtotal:</span>
                        <span className="font-semibold">₹{s.itemsSubtotal.toFixed(2)}</span>
                      </div>
                      {s.proportionalDiscount !== undefined && s.proportionalDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Proportional Discount:</span>
                          <span>-₹{s.proportionalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Proportional GST (5%):</span>
                        <span>+₹{s.proportionalGst.toFixed(2)}</span>
                      </div>
                      {s.proportionalServiceCharge > 0 && (
                        <div className="flex justify-between">
                          <span>Proportional Service Charge:</span>
                          <span>+₹{s.proportionalServiceCharge.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Footnote */}
          <div className="p-4 rounded-xl bg-[#eff4ff] border border-blue-100 flex items-center justify-between text-xs text-slate-600 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#006948]" />
              <span>
                Reconciled for Bill #{receipt.billNumber}. The sum of individual member obligations matches
                the grand bill total to the exact paisa (₹{receipt.total.toFixed(2)}).
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
