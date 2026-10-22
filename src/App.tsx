/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DinnerPartyManager } from './components/DinnerPartyManager';
import { ReceiptLeftPane } from './components/ReceiptLeftPane';
import { SettlementBreakdown } from './components/SettlementBreakdown';
import { ChatCopilot } from './components/ChatCopilot';
import { ReceiptScanModal } from './components/ReceiptScanModal';
import { UploadReceiptModal } from './components/UploadReceiptModal';
import { ItemAssignModal } from './components/ItemAssignModal';
import { ExpenseReportModal } from './components/ExpenseReportModal';
import { EditBillModal } from './components/EditBillModal';
import { Toast, ToastInfo } from './components/Toast';
import {
  SAMPLE_INDIAN_RECEIPTS,
  INITIAL_INDIAN_PARTICIPANTS,
} from './data/sampleReceipts';
import {
  ReceiptData,
  Participant,
  ItemShare,
  ChatMessage,
  ReceiptItem,
} from './types';
import {
  calculateSettlements,
  splitBillEqually,
  generateGroupChatSummary,
} from './utils/calculations';
import { executeNLPCommand } from './utils/nlpParser';

const INITIAL_INDIAN_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    text: 'Dhruv and Aarav had the butter chicken and garlic naans',
    timestamp: '9:16 PM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    text: 'Assigned **Butter Chicken** (₹625.00) 50/50 to Dhruv & Aarav, and distributed **Garlic Naan Basket** (₹380.00) across all 4 friends. Proportional 5% GST calculated!',
    timestamp: '9:16 PM',
  },
  {
    id: 'msg-3',
    role: 'user',
    text: 'Pooja and Sneha shared the paneer tikka and dal makhani',
    timestamp: '9:17 PM',
  },
  {
    id: 'msg-4',
    role: 'assistant',
    text: 'Split **Paneer Tikka Multani** (₹475.00) and **Dal Punjab Grill** (₹495.00) between Pooja and Sneha. Subtotals & GST updated.',
    timestamp: '9:17 PM',
  },
  {
    id: 'msg-5',
    role: 'user',
    text: 'Split the biryani and dessert across everyone at the table',
    timestamp: '9:18 PM',
  },
  {
    id: 'msg-6',
    role: 'assistant',
    text: 'Distributed **Dum Murgh Biryani** (₹595.00) and **Kesar Phirni** (₹330.00) across all 4 diners. Bill **#PG-48291** is now 100% accounted for (₹3,845.00 total matched)!',
    timestamp: '9:18 PM',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'history' | 'reports'>('workspace');
  const [receipt, setReceipt] = useState<ReceiptData>(SAMPLE_INDIAN_RECEIPTS[0].data);
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_INDIAN_PARTICIPANTS);
  const [assignments, setAssignments] = useState<Record<string, ItemShare[]>>(
    SAMPLE_INDIAN_RECEIPTS[0].defaultShares
  );
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_INDIAN_MESSAGES);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isEqualSplitActive, setIsEqualSplitActive] = useState(false);

  // Modals
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExpenseReportOpen, setIsExpenseReportOpen] = useState(false);
  const [isEditBillModalOpen, setIsEditBillModalOpen] = useState(false);
  const [selectedItemForAssign, setSelectedItemForAssign] = useState<ReceiptItem | null>(null);

  // Calculate real-time settlements
  const {
    settlements,
    totalAccountedPercent,
    assignedItemsCount,
    unassignedItemsCount,
    totalCalculated,
    isTotalMatched,
  } = calculateSettlements(receipt, participants, assignments);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ id: `${Date.now()}`, message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  const handleSaveBillEdits = (updatedReceipt: ReceiptData) => {
    setReceipt(updatedReceipt);
    // Retain valid assignments, discard removed item IDs
    setAssignments((prev) => {
      const validItemIds = new Set(updatedReceipt.items.map((i) => i.id));
      const cleaned: Record<string, ItemShare[]> = {};
      Object.entries(prev).forEach(([itemId, shares]) => {
        if (validItemIds.has(itemId)) {
          cleaned[itemId] = shares;
        }
      });
      return cleaned;
    });
  };

  // Celebrate when 100% integrity is achieved
  useEffect(() => {
    if (totalAccountedPercent === 100 && receipt.items.length > 0) {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#006948', '#10b981', '#6cf8bb', '#85f8c4', '#6366f1'],
      });
    }
  }, [totalAccountedPercent]);

  // Handle Bill Number Edit
  const handleUpdateBillNumber = (newBillNumber: string) => {
    setReceipt((prev) => ({
      ...prev,
      billNumber: newBillNumber,
    }));
  };

  // Handle Tip / Service charge change
  const handleUpdateTipPercent = (newPercent: number) => {
    const tipAmount = Math.round(receipt.subtotal * newPercent * 100) / 100;
    const discount = receipt.discount || 0;
    const roundOff = receipt.roundOff || 0;
    const total = Math.round(
      (receipt.subtotal - discount + receipt.tax + (receipt.serviceCharge || 0) + roundOff + tipAmount) * 100
    ) / 100;
    setReceipt((prev) => ({
      ...prev,
      tipPercent: newPercent,
      tipAmount,
      total,
    }));
    showToast(`Updated gratuity to ${Math.round(newPercent * 100)}% (₹${tipAmount.toFixed(2)})`);
  };

  // Quick 1-click Equal Split across all N people
  const handleSplitEqually = () => {
    const newShares = splitBillEqually(receipt, participants);
    setAssignments(newShares);
    setIsEqualSplitActive(true);

    const perPerson = (receipt.total / participants.length).toFixed(2);
    setMessages((prev) => [
      ...prev,
      {
        id: `equal-${Date.now()}`,
        role: 'assistant',
        text: `Split Bill **#${receipt.billNumber}** equally across all **${participants.length}** friends/family members (**₹${perPerson}** each). Total ₹${receipt.total.toFixed(2)} cleanly accounted for!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast(`Bill #${receipt.billNumber} split equally: ₹${perPerson} per head!`);
  };

  // Handle loading sample receipts
  const handleSelectSampleReceipt = (id: string) => {
    const sample = SAMPLE_INDIAN_RECEIPTS.find((s) => s.id === id);
    if (!sample) return;

    setReceipt(sample.data);
    setAssignments(sample.defaultShares);
    setParticipants(INITIAL_INDIAN_PARTICIPANTS);
    setIsEqualSplitActive(false);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: `Loaded **${sample.data.restaurantName}** (Bill **#${sample.data.billNumber}**, ₹${sample.data.total.toFixed(2)}). You can command me to adjust shares or split items!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast(`Loaded Bill #${sample.data.billNumber} from ${sample.data.restaurantName}!`);
  };

  // Handle new receipt parsed from OCR photo upload
  const handleReceiptParsed = (newReceipt: ReceiptData) => {
    setReceipt(newReceipt);
    setAssignments({});
    setIsEqualSplitActive(false);

    setMessages([
      {
        id: `ocr-${Date.now()}`,
        role: 'assistant',
        text: `Scanned Indian Bill **#${newReceipt.billNumber}** from **${newReceipt.restaurantName}**! Extracted ${newReceipt.items.length} line items (Total ₹${newReceipt.total.toFixed(2)} with GST). Add dinner guests or command me to split!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast(`Successfully extracted Bill #${newReceipt.billNumber}!`);
  };

  // Handle natural language chat message
  const handleSendMessage = async (text: string) => {
    setIsEqualSplitActive(false);
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          items: receipt.items,
          participants,
          assignments,
          tipPercent: receipt.tipPercent,
          billNumber: receipt.billNumber,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const data = json.data;

        // Apply updated participants if any
        if (data.newParticipants && data.newParticipants.length > 0) {
          setParticipants((prev) => [...prev, ...data.newParticipants]);
        }

        // Apply new items if any
        if (data.newItems && data.newItems.length > 0) {
          setReceipt((prev) => {
            const updatedItems = [...prev.items, ...data.newItems];
            const newSubtotal = updatedItems.reduce((acc, it) => acc + it.price, 0);
            const cgst = Math.round(newSubtotal * 0.025 * 100) / 100;
            const sgst = Math.round(newSubtotal * 0.025 * 100) / 100;
            const newTax = Math.round((cgst + sgst) * 100) / 100;
            const serviceCharge = Math.round(newSubtotal * 0.05 * 100) / 100;
            return {
              ...prev,
              items: updatedItems,
              subtotal: newSubtotal,
              cgst,
              sgst,
              tax: newTax,
              serviceCharge,
              total: Math.round((newSubtotal + newTax + serviceCharge) * 100) / 100,
            };
          });
        }

        // Apply updated assignments
        if (data.updatedAssignments && data.updatedAssignments.length > 0) {
          setAssignments((prev) => {
            const next = { ...prev };
            data.updatedAssignments.forEach((ua: any) => {
              next[ua.itemId] = ua.shares.map((sh: any) => ({
                participantId: sh.participantId,
                fraction: Number(sh.fraction),
              }));
            });
            return next;
          });
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: data.assistantReply || 'Updated the dish allocations.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        showToast('Updated dish shares & proportional GST balances!');
      } else {
        localNlpFallback(text);
      }
    } catch (err) {
      console.warn('Backend chat API error, falling back to local NLP engine:', err);
      localNlpFallback(text);
    } finally {
      setIsChatLoading(false);
    }
  };

  const localNlpFallback = (text: string) => {
    const result = executeNLPCommand(text, receipt, participants, assignments);

    setReceipt(result.updatedReceipt);
    setParticipants(result.updatedParticipants);
    setAssignments(result.updatedAssignments);

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      text: result.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    showToast('Updated dish shares & proportional GST!');
  };

  // Manual Item Assign Save
  const handleSaveItemShares = (itemId: string, newShares: ItemShare[]) => {
    setIsEqualSplitActive(false);
    setAssignments((prev) => ({
      ...prev,
      [itemId]: newShares,
    }));
    showToast('Updated dish assignment!');
  };

  // Unified Batch UPI Request
  const handleRequestAllUPI = () => {
    const validDiners = settlements.filter((s) => s.totalDue > 0);
    const summary = validDiners
      .map(
        (s) =>
          `👤 ${s.participant.name}: ₹${s.totalDue.toFixed(2)} (Pay: ${s.participant.upiId || 'UPI'})`
      )
      .join('\n');

    navigator.clipboard?.writeText(
      `🧾 Bill #${receipt.billNumber} (${receipt.restaurantName}) UPI Split Requests:\n\n${summary}\n\n✨ Total: ₹${receipt.total.toFixed(2)}`
    );
    showToast(`Copied UPI payment requests for all ${validDiners.length} diners!`);
  };

  // Copy Group Chat summary for WhatsApp
  const handleCopyGroupChat = () => {
    const formatted = generateGroupChatSummary(receipt, settlements);
    navigator.clipboard?.writeText(formatted);
    showToast('Formatted WhatsApp summary copied to clipboard!');
  };

  // Reset bill assignments
  const handleResetBill = () => {
    setAssignments({});
    setIsEqualSplitActive(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        text: `Cleared all dish assignments for Bill **#${receipt.billNumber}**. Ready for fresh allocations!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast('Cleared all assignments.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Navigation Header */}
      <Header
        receipt={receipt}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenExpenseReport={() => setIsExpenseReportOpen(true)}
        onExportUPI={handleRequestAllUPI}
        onSelectSampleReceipt={handleSelectSampleReceipt}
        sampleOptions={SAMPLE_INDIAN_RECEIPTS.map((s) => ({ id: s.id, label: s.label }))}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Split-Screen Workspace Grid */}
      <main className="w-full pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1720px] mx-auto flex-1 flex flex-col gap-5">
        {/* Dedicated Friends & Family Dinner Party / Bill No Manager */}
        <DinnerPartyManager
          receipt={receipt}
          participants={participants}
          onUpdateParticipants={(newDiners) => setParticipants(newDiners)}
          onUpdateBillNumber={handleUpdateBillNumber}
          onSplitEqually={handleSplitEqually}
          isEqualSplitActive={isEqualSplitActive}
          onTriggerToast={showToast}
        />

        {/* Dual Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* ========================================== */}
          {/* LEFT PANE: Indian Bill & Dishes (col-span-6) */}
          {/* ========================================== */}
          <div className="lg:col-span-6 flex flex-col">
            <ReceiptLeftPane
              receipt={receipt}
              participants={participants}
              assignments={assignments}
              totalAccountedPercent={totalAccountedPercent}
              assignedItemsCount={assignedItemsCount}
              unassignedItemsCount={unassignedItemsCount}
              onOpenScanModal={() => setIsScanModalOpen(true)}
              onOpenEditModal={() => setIsEditBillModalOpen(true)}
              onUpdateTipPercent={handleUpdateTipPercent}
              onSelectItemForAssign={(item) => setSelectedItemForAssign(item)}
            />
          </div>

          {/* =========================================== */}
          {/* RIGHT PANE: Settlement & Copilot (col-span-6) */}
          {/* =========================================== */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Real-time Settlement Cards Grid */}
            <SettlementBreakdown
              settlements={settlements}
              totalCalculated={totalCalculated}
              grandTotal={receipt.total}
              billNumber={receipt.billNumber}
              isTotalMatched={isTotalMatched}
              onTriggerToast={showToast}
              onAddDinerPrompt={() => handleSendMessage('+ Add person')}
            />

            {/* Indian Bill Copilot & Action Dock */}
            <ChatCopilot
              messages={messages}
              receipt={receipt}
              participants={participants}
              onSendMessage={handleSendMessage}
              onRequestAllUPI={handleRequestAllUPI}
              onCopyGroupChat={handleCopyGroupChat}
              onDownloadReport={() => setIsExpenseReportOpen(true)}
              onTriggerToast={showToast}
              onResetBill={handleResetBill}
              isLoading={isChatLoading}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ReceiptScanModal
        receipt={receipt}
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      <UploadReceiptModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onReceiptParsed={handleReceiptParsed}
        onTriggerToast={showToast}
      />

      <ItemAssignModal
        item={selectedItemForAssign}
        participants={participants}
        currentShares={selectedItemForAssign ? assignments[selectedItemForAssign.id] || [] : []}
        isOpen={Boolean(selectedItemForAssign)}
        onClose={() => setSelectedItemForAssign(null)}
        onSaveShares={handleSaveItemShares}
      />

      <ExpenseReportModal
        receipt={receipt}
        settlements={settlements}
        isOpen={isExpenseReportOpen}
        onClose={() => setIsExpenseReportOpen(false)}
        onTriggerToast={showToast}
      />

      <EditBillModal
        receipt={receipt}
        isOpen={isEditBillModalOpen}
        onClose={() => setIsEditBillModalOpen(false)}
        onSave={handleSaveBillEdits}
        onTriggerToast={showToast}
      />

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#006948]">TABBY AI</span>
            <span>• Indian Bill Splitting & GST Proportional Expense Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={handleRequestAllUPI}
              className="hover:text-slate-800 transition-colors"
            >
              Unified UPI Payments (GPay / PhonePe / Paytm)
            </button>
            <button
              onClick={handleCopyGroupChat}
              className="hover:text-slate-800 transition-colors"
            >
              WhatsApp Group Share
            </button>
            <button
              onClick={() => setIsExpenseReportOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              Automated Expense Reports (CSV / Print)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
