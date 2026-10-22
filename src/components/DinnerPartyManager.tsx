import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  Divide,
  Sparkles,
  QrCode,
  Smartphone,
  Hash,
} from 'lucide-react';
import { Participant, ReceiptData } from '../types';

interface DinnerPartyManagerProps {
  receipt: ReceiptData;
  participants: Participant[];
  onUpdateParticipants: (newParticipants: Participant[]) => void;
  onUpdateBillNumber: (newBillNumber: string) => void;
  onSplitEqually: () => void;
  isEqualSplitActive: boolean;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const DinnerPartyManager: React.FC<DinnerPartyManagerProps> = ({
  receipt,
  participants,
  onUpdateParticipants,
  onUpdateBillNumber,
  onSplitEqually,
  isEqualSplitActive,
  onTriggerToast,
}) => {
  const [isEditingBillNo, setIsEditingBillNo] = useState(false);
  const [billNoInput, setBillNoInput] = useState(receipt.billNumber);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonUpi, setNewPersonUpi] = useState('');

  useEffect(() => {
    setBillNoInput(receipt.billNumber);
  }, [receipt.billNumber]);

  const handleSaveBillNo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNoInput.trim()) return;
    onUpdateBillNumber(billNoInput.trim());
    setIsEditingBillNo(false);
    onTriggerToast(`Updated Bill Number to #${billNoInput.trim()}!`);
  };

  const handleAdjustCount = (delta: number) => {
    const newCount = Math.max(1, Math.min(16, participants.length + delta));
    if (newCount === participants.length) return;

    if (delta > 0) {
      const defaultNames = ['Kabir', 'Meera', 'Rohan', 'Ananya', 'Vikram', 'Tanvi', 'Ishaan', 'Diya'];
      const nextName =
        defaultNames[(participants.length) % defaultNames.length] +
        (participants.some((p) => p.name.startsWith(defaultNames[(participants.length) % defaultNames.length]))
          ? ` ${participants.length + 1}`
          : '');
      const colors = ['rose', 'teal', 'blue', 'orange', 'cyan'];
      const color = colors[participants.length % colors.length];

      const newParticipant: Participant = {
        id: nextName.toLowerCase().replace(/\s+/g, '-'),
        name: nextName,
        color,
        badgeBg: `bg-${color}-100 text-${color}-900 border-${color}-200`,
        badgeText: `text-${color}-700`,
        avatarLetter: nextName.charAt(0),
        upiId: `${nextName.toLowerCase().replace(/\s+/g, '')}@upi`,
      };
      onUpdateParticipants([...participants, newParticipant]);
      onTriggerToast(`Added ${nextName} to the dinner table (${newCount} people)!`);
    } else {
      const removed = participants[participants.length - 1];
      onUpdateParticipants(participants.slice(0, -1));
      onTriggerToast(`Removed ${removed.name} from the dinner table (${newCount} people).`);
    }
  };

  const handleAddPersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    const name = newPersonName.trim();
    const cleanId = name.toLowerCase().replace(/\s+/g, '-');

    if (participants.some((p) => p.id === cleanId)) {
      onTriggerToast(`${name} is already added to dinner!`, 'info');
      return;
    }

    const colors = ['purple', 'emerald', 'amber', 'indigo', 'rose', 'teal'];
    const color = colors[participants.length % colors.length];

    const newParticipant: Participant = {
      id: cleanId,
      name,
      color,
      badgeBg: `bg-${color}-100 text-${color}-900 border-${color}-200`,
      badgeText: `text-${color}-700`,
      avatarLetter: name.charAt(0).toUpperCase(),
      upiId: newPersonUpi.trim() || `${name.toLowerCase()}@upi`,
    };

    onUpdateParticipants([...participants, newParticipant]);
    setNewPersonName('');
    setNewPersonUpi('');
    setIsAddingPerson(false);
    onTriggerToast(`Added ${name} with UPI ID!`);
  };

  const handleRemovePerson = (id: string, name: string) => {
    if (participants.length <= 1) {
      onTriggerToast('You need at least 1 person at the table!', 'warning');
      return;
    }
    onUpdateParticipants(participants.filter((p) => p.id !== id));
    onTriggerToast(`Removed ${name}.`);
  };

  const perPersonEqualShare = (receipt.total / Math.max(1, participants.length)).toFixed(2);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 flex flex-col gap-4">
      {/* Top Bar: Prominent Bill Number & Diner Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Bill Number Highlight */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#006948]/10 text-[#006948] border border-[#006948]/20 font-mono">
            <Hash className="w-4 h-4 shrink-0" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Bill / Invoice No:
            </span>
            {isEditingBillNo ? (
              <form onSubmit={handleSaveBillNo} className="flex items-center gap-1 ml-1">
                <input
                  type="text"
                  value={billNoInput}
                  onChange={(e) => setBillNoInput(e.target.value)}
                  className="px-2 py-0.5 text-xs font-bold font-mono bg-white border border-[#006948] rounded text-[#006948] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 rounded bg-[#006948] text-white hover:bg-[#00855d]"
                  title="Save Bill Number"
                >
                  <Check className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <span className="font-extrabold text-sm text-[#006948]">
                #{receipt.billNumber || 'PG-48291'}
              </span>
            )}
          </div>

          {!isEditingBillNo && (
            <button
              onClick={() => {
                setBillNoInput(receipt.billNumber);
                setIsEditingBillNo(true);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Edit Bill Number"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {receipt.gstin && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 hidden md:inline-block">
              GSTIN: <strong className="text-slate-700">{receipt.gstin}</strong>
            </span>
          )}
        </div>

        {/* People Stepper & Quick Equal Split Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Stepper for number of people */}
          <div className="flex items-center gap-1 bg-[#eff4ff] p-1 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-600 px-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#006948]" />
              <span>{participants.length} Diners</span>
            </span>
            <button
              type="button"
              onClick={() => handleAdjustCount(-1)}
              disabled={participants.length <= 1}
              className="w-6 h-6 rounded-lg bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 font-bold flex items-center justify-center text-xs shadow-xs"
              title="Remove person"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => handleAdjustCount(1)}
              className="w-6 h-6 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shadow-xs"
              title="Add person"
            >
              +
            </button>
          </div>

          {/* Quick Equal Split Toggle */}
          <button
            type="button"
            onClick={onSplitEqually}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 border ${
              isEqualSplitActive
                ? 'bg-[#006948] text-white border-[#006948]'
                : 'bg-white hover:bg-[#6cf8bb]/15 text-[#006948] border-[#006948]/30'
            }`}
            title="Split entire bill equally among all diners"
          >
            <Divide className="w-3.5 h-3.5" />
            <span>Equal Split (₹{perPersonEqualShare}/head)</span>
          </button>
        </div>
      </div>

      {/* Friends & Family Avatars List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-mono font-semibold uppercase text-slate-400 shrink-0">
          Party:
        </span>

        {participants.map((p) => {
          return (
            <div
              key={p.id}
              className="group shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-xs"
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
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
              <span className="font-semibold text-slate-800">{p.name}</span>
              {p.upiId && (
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600">
                  ⚡{p.upiId.split('@')[0]}
                </span>
              )}
              {participants.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePerson(p.id, p.name)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 ml-0.5 transition-opacity"
                  title={`Remove ${p.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {/* Add Friend/Family button */}
        {!isAddingPerson ? (
          <button
            type="button"
            onClick={() => setIsAddingPerson(true)}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-slate-300 hover:border-[#006948] text-slate-600 hover:text-[#006948] text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Friend / Family</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddPersonSubmit}
            className="shrink-0 flex items-center gap-1.5 bg-[#eff4ff] p-1 rounded-full border border-slate-200"
          >
            <input
              type="text"
              placeholder="Name (e.g. Kabir)"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded-full focus:outline-none w-24"
              autoFocus
            />
            <input
              type="text"
              placeholder="UPI (optional)"
              value={newPersonUpi}
              onChange={(e) => setNewPersonUpi(e.target.value)}
              className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded-full focus:outline-none w-28 hidden sm:inline-block"
            />
            <button
              type="submit"
              className="px-2 py-0.5 rounded-full bg-[#006948] text-white text-xs font-semibold hover:bg-[#00855d]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingPerson(false)}
              className="px-1 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
