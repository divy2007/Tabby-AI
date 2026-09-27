import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { ReceiptItem, Participant, ItemShare } from '../types';

interface ItemAssignModalProps {
  item: ReceiptItem | null;
  participants: Participant[];
  currentShares: ItemShare[];
  isOpen: boolean;
  onClose: () => void;
  onSaveShares: (itemId: string, newShares: ItemShare[]) => void;
}

export const ItemAssignModal: React.FC<ItemAssignModalProps> = ({
  item,
  participants,
  currentShares,
  isOpen,
  onClose,
  onSaveShares,
}) => {
  if (!isOpen || !item) return null;

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return currentShares.map((s) => s.participantId);
  });

  const toggleParticipant = (pId: string) => {
    if (selectedIds.includes(pId)) {
      setSelectedIds(selectedIds.filter((id) => id !== pId));
    } else {
      setSelectedIds([...selectedIds, pId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participants.map((p) => p.id));
    }
  };

  const handleSave = () => {
    if (selectedIds.length === 0) {
      onSaveShares(item.id, []);
      onClose();
      return;
    }

    const fractionEach = 1 / selectedIds.length;
    const newShares: ItemShare[] = selectedIds.map((pId) => ({
      participantId: pId,
      fraction: fractionEach,
    }));

    onSaveShares(item.id, newShares);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b1c30]/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#eff4ff] border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-semibold uppercase text-slate-500">
              Assign Dish to Friends & Family
            </span>
            <h3 className="font-bold text-base text-[#0b1c30] mt-0.5 truncate">
              {item.name}
            </h3>
          </div>
          <div className="text-right">
            <span className="font-mono text-base font-extrabold text-[#006948]">
              ₹{item.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Select who shared this dish:</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-semibold text-[#006948] hover:underline"
            >
              {selectedIds.length === participants.length ? 'Clear All' : 'Select All Diners'}
            </button>
          </div>

          {/* Participant checklist */}
          <div className="flex flex-col gap-2">
            {participants.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const calculatedShare =
                selectedIds.length > 0 && isSelected
                  ? (item.price / selectedIds.length).toFixed(2)
                  : '0.00';

              return (
                <div
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#006948] bg-[#6cf8bb]/15 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full font-mono text-xs font-bold text-white flex items-center justify-center ${
                        p.color === 'purple'
                          ? 'bg-purple-600'
                          : p.color === 'emerald'
                          ? 'bg-[#006948]'
                          : p.color === 'amber'
                          ? 'bg-amber-600'
                          : p.color === 'indigo'
                          ? 'bg-indigo-600'
                          : 'bg-slate-700'
                      }`}
                    >
                      {p.avatarLetter}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#0b1c30] block">{p.name}</span>
                      {p.upiId && (
                        <span className="text-[10px] font-mono text-slate-400">⚡{p.upiId}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSelected && (
                      <span className="text-xs font-mono font-bold text-[#006948]">
                        ₹{calculatedShare}
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#006948] border-[#006948] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick shortcuts */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 rounded-full bg-[#006948] text-white hover:bg-[#00855d] text-xs font-bold transition-all shadow-xs"
            >
              Save Dish Split
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
