import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Plus,
  Copy,
  Smartphone,
  QrCode,
  Hash,
} from 'lucide-react';
import { ParticipantSettlement } from '../types';

interface SettlementBreakdownProps {
  settlements: ParticipantSettlement[];
  totalCalculated: number;
  grandTotal: number;
  billNumber: string;
  isTotalMatched: boolean;
  onTriggerToast: (message: string) => void;
  onAddDinerPrompt: () => void;
}

export const SettlementBreakdown: React.FC<SettlementBreakdownProps> = ({
  settlements,
  totalCalculated,
  grandTotal,
  billNumber,
  isTotalMatched,
  onTriggerToast,
  onAddDinerPrompt,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleUpiClick = (settlement: ParticipantSettlement) => {
    if (settlement.totalDue <= 0) {
      onTriggerToast(`${settlement.participant.name} has no balance due.`);
      return;
    }

    // Try opening UPI URI handler, also copy UPI details
    const upiLink = settlement.upiUrl;
    navigator.clipboard?.writeText(
      `Pay ₹${settlement.totalDue.toFixed(2)} to ${settlement.participant.name} (${settlement.participant.upiId || 'UPI'}) for Bill #${billNumber}: ${upiLink}`
    );

    // Attempt direct UPI app trigger
    try {
      window.location.href = upiLink;
    } catch (e) {
      console.log('UPI app direct invocation:', e);
    }

    onTriggerToast(
      `UPI payment link copied for ${settlement.participant.name} (₹${settlement.totalDue.toFixed(2)})! Use GPay, PhonePe, or Paytm.`
    );
  };

  const handleCopyBreakdown = (settlement: ParticipantSettlement) => {
    const text = `${settlement.participant.name}'s share for Bill #${billNumber}: ₹${settlement.totalDue.toFixed(2)} (Dishes: ₹${settlement.itemsSubtotal.toFixed(2)} + GST/Charges: ₹${(settlement.proportionalGst + settlement.proportionalServiceCharge).toFixed(2)}) • UPI: ${settlement.participant.upiId || 'N/A'}`;
    navigator.clipboard?.writeText(text);
    onTriggerToast(`Copied breakdown for ${settlement.participant.name}!`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#006948]" />
            <h2 className="text-lg font-bold text-[#0b1c30]">
              Settlement Breakdown (Bill #{billNumber || 'PG-48291'})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual dues calculated with proportional 5% GST and service charge in ₹ INR
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-xs border ${
              isTotalMatched
                ? 'bg-[#6cf8bb]/20 text-[#00714d] border-[#6cf8bb]/40'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>
              {isTotalMatched
                ? `Total Matched: ₹${totalCalculated.toFixed(2)}`
                : `Matched: ₹${totalCalculated.toFixed(2)} / ₹${grandTotal.toFixed(2)}`}
            </span>
          </div>

          <button
            onClick={onAddDinerPrompt}
            type="button"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Add Friend/Family Member"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Participant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {settlements.map((s) => {
          const isExpanded = expandedId === s.participant.id;
          const p = s.participant;

          const colorClass =
            p.color === 'purple'
              ? 'bg-purple-600'
              : p.color === 'emerald'
              ? 'bg-[#006948]'
              : p.color === 'amber'
              ? 'bg-amber-600'
              : p.color === 'indigo'
              ? 'bg-indigo-600'
              : p.color === 'rose'
              ? 'bg-rose-600'
              : 'bg-teal-600';

          const btnHoverClass =
            p.color === 'purple'
              ? 'bg-purple-600 hover:bg-purple-700'
              : p.color === 'emerald'
              ? 'bg-[#006948] hover:bg-[#00855d]'
              : p.color === 'amber'
              ? 'bg-amber-600 hover:bg-amber-700'
              : p.color === 'indigo'
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-slate-700 hover:bg-slate-800';

          return (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-[#eff4ff]/40 hover:bg-[#eff4ff]/80 border border-slate-200/70 transition-all flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full ${colorClass} text-white font-bold flex items-center justify-center font-mono text-sm shadow-xs`}
                  >
                    {p.avatarLetter}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0b1c30]">{p.name}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {s.itemsCount} dish{s.itemsCount !== 1 ? 'es' : ''} claimed
                    </span>
                    {p.upiId && (
                      <span className="text-[10px] font-mono text-[#006948] flex items-center gap-0.5 mt-0.5">
                        <Smartphone className="w-3 h-3" />
                        {p.upiId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-lg font-extrabold text-[#0b1c30]">
                    ₹{s.totalDue.toFixed(2)}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Total Due
                  </span>
                </div>
              </div>

              {/* Dishes vs Net Taxes/Extras breakdown */}
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 bg-white/90 px-3 py-1.5 rounded-lg border border-slate-200/50">
                <span>
                  Dishes: <strong className="text-slate-900">₹{s.itemsSubtotal.toFixed(2)}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Taxes & Charges:{' '}
                  <strong className="text-slate-900">
                    {s.totalDue >= s.itemsSubtotal ? '+' : ''}₹{(s.totalDue - s.itemsSubtotal).toFixed(2)}
                  </strong>
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleUpiClick(s)}
                  className={`flex-1 py-1.5 px-3 rounded-full ${btnHoverClass} text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95`}
                  title="Pay using UPI (GPay / PhonePe / Paytm)"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleExpand(p.id)}
                  className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-500 transition-colors"
                  title={isExpanded ? 'Hide dish breakdown' : 'Show dish breakdown'}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Collapsible itemized list */}
              {isExpanded && (
                <div className="text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200/60 flex flex-col gap-1.5 animate-fadeIn">
                  <div className="text-[10px] font-semibold uppercase text-slate-400 pb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>Itemized Dishes</span>
                    <button
                      onClick={() => handleCopyBreakdown(s)}
                      className="text-slate-400 hover:text-slate-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  {s.claimedItems.length === 0 ? (
                    <span className="text-slate-400 italic text-[11px]">No dishes claimed yet.</span>
                  ) : (
                    s.claimedItems.map((ci, idx) => {
                      const shareFractionText =
                        ci.fraction === 1
                          ? '100%'
                          : ci.fraction === 0.5
                          ? '½'
                          : ci.fraction === 0.25
                          ? '¼'
                          : `${Math.round(ci.fraction * 100)}%`;

                      return (
                        <div key={idx} className="flex justify-between items-center text-slate-700">
                          <span className="truncate pr-2">
                            {ci.item.name} ({shareFractionText})
                          </span>
                          <span className="font-semibold text-slate-900 shrink-0">
                            ₹{ci.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  {s.proportionalDiscount !== undefined && s.proportionalDiscount > 0 && (
                    <div className="pt-1 mt-0.5 border-t border-dashed border-slate-200 flex justify-between text-[11px] text-emerald-700">
                      <span>Proportional Discount</span>
                      <span>-₹{s.proportionalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-[11px] text-slate-500 ${!s.proportionalDiscount ? 'pt-1 mt-0.5 border-t border-dashed border-slate-200' : ''}`}>
                    <span>Proportional GST</span>
                    <span>₹{s.proportionalGst.toFixed(2)}</span>
                  </div>
                  {s.proportionalServiceCharge > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Proportional Service Charge</span>
                      <span>₹{s.proportionalServiceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {s.proportionalRoundOff !== undefined && s.proportionalRoundOff !== 0 && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Proportional Round Off</span>
                      <span>₹{s.proportionalRoundOff > 0 ? `+${s.proportionalRoundOff.toFixed(2)}` : s.proportionalRoundOff.toFixed(2)}</span>
                    </div>
                  )}
                  {s.proportionalTip > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Proportional Gratuity</span>
                      <span>₹{s.proportionalTip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-1 mt-0.5 border-t border-slate-200 flex justify-between text-xs font-bold text-[#0b1c30]">
                    <span>Net Total Payable</span>
                    <span className="text-[#006948]">₹{s.totalDue.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
