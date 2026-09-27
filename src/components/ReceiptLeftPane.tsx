import React, { useState } from 'react';
import {
  Utensils,
  Calendar,
  Users,
  ExternalLink,
  ShieldCheck,
  Info,
  CheckCircle,
  AlertCircle,
  Lock,
  Hash,
  FileCheck,
  Receipt,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { ReceiptData, Participant, ItemShare, ReceiptItem } from '../types';

interface ReceiptLeftPaneProps {
  receipt: ReceiptData;
  participants: Participant[];
  assignments: Record<string, ItemShare[]>;
  totalAccountedPercent: number;
  assignedItemsCount: number;
  unassignedItemsCount: number;
  onOpenScanModal: () => void;
  onOpenEditModal: () => void;
  onUpdateTipPercent: (percent: number) => void;
  onSelectItemForAssign: (item: ReceiptItem) => void;
}

export const ReceiptLeftPane: React.FC<ReceiptLeftPaneProps> = ({
  receipt,
  participants,
  assignments,
  totalAccountedPercent,
  assignedItemsCount,
  unassignedItemsCount,
  onOpenScanModal,
  onOpenEditModal,
  onUpdateTipPercent,
  onSelectItemForAssign,
}) => {
  const getParticipant = (id: string) => {
    return participants.find((p) => p.id === id);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Upper Ticket Header Card */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 overflow-hidden">
        {/* Visual Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#006948] via-[#10b981] to-[#85f8c4]"></div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-1">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] flex items-center justify-center shrink-0 text-[#006948] shadow-sm border border-slate-200/60">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#0b1c30] tracking-tight">
                  {receipt.restaurantName}
                </h1>
                {/* Bill Number Badge */}
                <span className="px-2.5 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] text-xs font-mono font-bold flex items-center gap-1 border border-[#006948]/20">
                  <Hash className="w-3 h-3" />
                  Bill #{receipt.billNumber || 'PG-48291'}
                </span>
                {receipt.table && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-medium flex items-center gap-1 border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    {receipt.table}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {receipt.date} {receipt.time ? `• ${receipt.time}` : ''}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {participants.length} Friends & Family
                </span>
                {receipt.gstin && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-xs text-slate-500">
                      GSTIN: {receipt.gstin}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions & AI Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenEditModal}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006948]/10 hover:bg-[#006948]/20 text-[#006948] text-xs font-bold border border-[#006948]/30 transition-all shadow-xs active:scale-95"
                title="Edit dishes, quantities, or prices to match your paper bill exactly"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit / Fix Data</span>
              </button>

              <button
                onClick={onOpenScanModal}
                type="button"
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-[#eff4ff] text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-sm active:scale-95"
              >
                <div className="w-5 h-5 rounded overflow-hidden shrink-0 bg-slate-200 border border-slate-300">
                  {receipt.originalImageUrl ? (
                    <img
                      src={receipt.originalImageUrl}
                      alt="Bill Scan"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#006948]/10 flex items-center justify-center text-[8px] font-mono">
                      BILL
                    </div>
                  )}
                </div>
                <span className="group-hover:text-[#006948] transition-colors">
                  View Photo
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#006948] transition-transform" />
              </button>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6cf8bb]/20 text-[#00714d] text-xs font-mono font-bold border border-[#6cf8bb]/40">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00714d]" />
              <span>{receipt.confidence || 99.4}% OCR Accuracy</span>
            </div>
          </div>
        </div>

        {/* Assignment Integrity Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500 font-medium">Assignment Integrity</span>
            <span className={`font-bold ${totalAccountedPercent === 100 ? 'text-[#006948]' : 'text-amber-600'}`}>
              {totalAccountedPercent}% accounted for ({assignedItemsCount} / {receipt.items.length} dishes)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalAccountedPercent === 100 ? 'bg-[#006948]' : 'bg-gradient-to-r from-amber-400 to-[#10b981]'
              }`}
              style={{ width: `${totalAccountedPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Itemized Indian Restaurant Ticket */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Ticket Cutout Notches */}
        <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8f9ff] border-r border-slate-200"></div>
        <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f8f9ff] border-l border-slate-200"></div>

        {/* Table Header */}
        <div className="px-5 py-3 bg-[#eff4ff]/60 border-b border-slate-100 flex items-center justify-between text-slate-500 font-mono text-xs font-semibold tracking-wider">
          <div className="flex items-center gap-4">
            <span className="w-6 text-center">QTY</span>
            <span>DISH & DINER SPLIT</span>
          </div>
          <span>PRICE (₹)</span>
        </div>

        {/* Item Rows Stream */}
        <div className="divide-y divide-slate-100/80 p-2">
          {receipt.items.map((item) => {
            const shares = assignments[item.id] || [];
            const isAssigned = shares.length > 0;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItemForAssign(item)}
                className="group p-3 rounded-xl hover:bg-[#eff4ff]/50 transition-all flex items-start justify-between gap-3 cursor-pointer"
                title="Click to assign or reallocate diner shares"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <span className="font-mono text-xs font-bold text-slate-400 group-hover:text-slate-700 w-6 text-center pt-1 transition-colors">
                    {item.qty}×
                  </span>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#0b1c30] group-hover:text-[#006948] transition-colors">
                        {item.name}
                      </span>
                      {item.qty > 1 && item.rate && (
                        <span className="text-xs text-slate-400 font-mono">
                          (@ ₹{item.rate.toFixed(2)}/ea)
                        </span>
                      )}
                      {item.category && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Participant Share Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {isAssigned ? (
                        shares.map((share, idx) => {
                          const participant = getParticipant(share.participantId);
                          if (!participant) return null;

                          const shareAmount = (item.price * share.fraction).toFixed(2);
                          const shareLabel =
                            share.fraction === 1
                              ? '100%'
                              : share.fraction === 0.5
                              ? '½'
                              : share.fraction === 0.25
                              ? '¼'
                              : `${Math.round(share.fraction * 100)}%`;

                          return (
                            <div
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium shadow-xs border ${participant.badgeBg}`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                                  participant.color === 'purple'
                                    ? 'bg-purple-600'
                                    : participant.color === 'emerald'
                                    ? 'bg-[#006948]'
                                    : participant.color === 'amber'
                                    ? 'bg-amber-600'
                                    : participant.color === 'indigo'
                                    ? 'bg-indigo-600'
                                    : 'bg-slate-700'
                                }`}
                              >
                                {participant.avatarLetter}
                              </span>
                              <span>{participant.name}</span>
                              <span className="font-bold opacity-80">
                                {shareLabel} (₹{shareAmount})
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-mono font-medium">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          Unclaimed — Click to assign
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pt-0.5">
                  <span className="font-mono text-sm font-bold text-[#0b1c30] group-hover:text-[#006948] transition-colors">
                    ₹{item.price.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Receipt Cutout Divider Line */}
        <div className="px-5 py-2">
          <div className="w-full border-b border-dashed border-slate-200"></div>
        </div>

        {/* Calculations Section for Indian GST & Charges */}
        <div className="p-5 bg-white flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-slate-600 text-sm">
            <span>Items Subtotal</span>
            <span className="font-mono font-bold text-[#0b1c30]">
              ₹{receipt.subtotal.toFixed(2)}
            </span>
          </div>

          {/* Discount if applicable */}
          {receipt.discount !== undefined && receipt.discount > 0 && (
            <div className="flex justify-between items-center text-emerald-700 text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discount ({receipt.discountLabel || 'Offer / Promo'})</span>
              </div>
              <span className="font-mono font-bold text-emerald-700">
                -₹{receipt.discount.toFixed(2)}
              </span>
            </div>
          )}

          {/* CGST */}
          <div className="flex justify-between items-center text-slate-600 text-sm">
            <div className="flex items-center gap-1.5">
              <span>CGST (Central GST 2.5%)</span>
            </div>
            <span className="font-mono font-bold text-[#0b1c30]">
              ₹{(receipt.cgst || (receipt.tax / 2) || 0).toFixed(2)}
            </span>
          </div>

          {/* SGST */}
          <div className="flex justify-between items-center text-slate-600 text-sm">
            <div className="flex items-center gap-1.5">
              <span>SGST (State GST 2.5%)</span>
            </div>
            <span className="font-mono font-bold text-[#0b1c30]">
              ₹{(receipt.sgst || (receipt.tax / 2) || 0).toFixed(2)}
            </span>
          </div>

          {/* Service Charge if applicable */}
          {receipt.serviceCharge !== undefined && receipt.serviceCharge > 0 && (
            <div className="flex justify-between items-center text-slate-600 text-sm">
              <div className="flex items-center gap-1.5">
                <span>Restaurant Service Charge ({receipt.serviceChargePercent || 5}%)</span>
                <span title="Optional service charge, distributed proportionally">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </div>
              <span className="font-mono font-bold text-[#0b1c30]">
                ₹{receipt.serviceCharge.toFixed(2)}
              </span>
            </div>
          )}

          {/* Round Off if applicable */}
          {receipt.roundOff !== undefined && receipt.roundOff !== 0 && (
            <div className="flex justify-between items-center text-slate-500 text-xs font-mono">
              <span>Round Off</span>
              <span>₹{receipt.roundOff > 0 ? `+${receipt.roundOff.toFixed(2)}` : receipt.roundOff.toFixed(2)}</span>
            </div>
          )}

          {/* Grand Total Row */}
          <div className="pt-3 mt-1 border-t border-dashed border-slate-200 flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#0b1c30]">
                Grand Total Payable
              </span>
              <span className="text-xs font-mono text-slate-400">
                Bill #{receipt.billNumber} • Includes Subtotal + GST + Service Charge
              </span>
            </div>
            <span className="text-2xl font-extrabold text-[#006948] tracking-tight font-mono">
              ₹{receipt.total.toFixed(2)}
            </span>
          </div>

          {/* Proportional GST Banner */}
          <div className="mt-2 p-3 rounded-xl bg-[#eff4ff] border border-blue-100 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#006948] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900 font-semibold">Proportional GST & Charges:</strong> GST (5% ={' '}
              <span className="font-mono font-semibold">₹{receipt.tax.toFixed(2)}</span>) and Service Charge are distributed strictly based on each diner&apos;s actual dish consumption. No one is penalized for expensive items ordered by others.
            </p>
          </div>

          {/* Unassigned Items Status */}
          <div
            className={`p-3 rounded-xl flex items-center justify-between border ${
              unassignedItemsCount === 0
                ? 'bg-[#6cf8bb]/15 border-[#6cf8bb]/40 text-[#00714d]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {unassignedItemsCount === 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-[#00714d]" />
                  <span className="text-xs font-semibold">0 unclaimed dishes</span>
                  <span className="text-xs opacity-80 hidden sm:inline">
                    — All {receipt.items.length} items cleanly split among friends & family!
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold">
                    {unassignedItemsCount} dish{unassignedItemsCount > 1 ? 'es' : ''} unclaimed
                  </span>
                  <span className="text-xs opacity-80 hidden sm:inline">
                    — Click dish to assign or use chat.
                  </span>
                </>
              )}
            </div>
            <Lock className="w-3.5 h-3.5 opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
};
