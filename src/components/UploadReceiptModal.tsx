import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Camera,
  Loader2,
  AlertCircle,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { ReceiptData } from '../types';
import { SAMPLE_INDIAN_RECEIPTS } from '../data/sampleReceipts';

interface UploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptParsed: (newReceipt: ReceiptData) => void;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const UploadReceiptModal: React.FC<UploadReceiptModalProps> = ({
  isOpen,
  onClose,
  onReceiptParsed,
  onTriggerToast,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualBillNo, setManualBillNo] = useState('');
  const [showManualOption, setShowManualOption] = useState(false);
  const [manualRestaurant, setManualRestaurant] = useState('My Dining Bill');
  const [manualTotal, setManualTotal] = useState('2400');
  const [manualPeopleCount, setManualPeopleCount] = useState('4');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to optimize and downscale image before upload to prevent payload size errors and timeouts
  const prepareFileForUpload = async (
    file: File
  ): Promise<{ base64: string; mimeType: string }> => {
    // If PDF invoice, read base64 directly
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mimeType: 'application/pdf' });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // If image, resize to max 1800px on canvas to keep upload fast (~300KB) and prevent HTTP 413/network errors
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1800;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.88);
            resolve({ base64: compressed, mimeType: 'image/jpeg' });
            return;
          }
          resolve({ base64: dataUrl, mimeType: file.type || 'image/jpeg' });
        };
        img.onerror = () => {
          resolve({ base64: dataUrl, mimeType: file.type || 'image/jpeg' });
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        resolve({ base64: '', mimeType: 'image/jpeg' });
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setErrorMsg('Please select a valid bill photo (JPEG, PNG, WebP) or PDF invoice.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const { base64, mimeType } = await prepareFileForUpload(file);
      if (!base64) {
        throw new Error('Unable to read selected file. Please try another photo or enter manually.');
      }

      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Server returned HTTP ${response.status}. Please check your connection or enter bill numbers manually.`);
      }

      if (response.ok && data?.success && data?.receipt) {
        const parsed = data.receipt;

        // Clean & validate line items
        const items = Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : [];
        const processedItems = items.map((it: any, idx: number) => {
          const qty = Number(it.qty) || 1;
          let price = Number(it.price) || 0;
          const rate = typeof it.rate === 'number' ? it.rate : undefined;
          if (rate && rate > 0 && price === rate && qty > 1) {
            price = Math.round(rate * qty * 100) / 100;
          }
          return {
            id: it.id || `item-${Date.now()}-${idx + 1}`,
            name: String(it.name || `Dish ${idx + 1}`).trim(),
            qty,
            rate: rate || (qty > 1 ? Math.round((price / qty) * 100) / 100 : price),
            price,
            category: it.category || 'Dishes',
          };
        });

        const itemsSum = processedItems.reduce((acc: number, it: any) => acc + (Number(it.price) || 0), 0);
        const itemsSubtotal =
          typeof parsed.subtotal === 'number' && parsed.subtotal > 0
            ? parsed.subtotal
            : itemsSum;

        const discount = typeof parsed.discount === 'number' ? parsed.discount : 0;
        const discountLabel = parsed.discountLabel ? String(parsed.discountLabel).trim() : undefined;

        const cgst = typeof parsed.cgst === 'number' ? parsed.cgst : Math.round((itemsSubtotal - discount) * 0.025 * 100) / 100;
        const sgst = typeof parsed.sgst === 'number' ? parsed.sgst : Math.round((itemsSubtotal - discount) * 0.025 * 100) / 100;
        const tax = typeof parsed.tax === 'number' && parsed.tax > 0 ? parsed.tax : Math.round((cgst + sgst) * 100) / 100;
        const serviceCharge = typeof parsed.serviceCharge === 'number' ? parsed.serviceCharge : 0;
        const roundOff = typeof parsed.roundOff === 'number' ? parsed.roundOff : 0;
        
        // Exact net grand total calculation
        const calculatedTotal = Math.round((itemsSubtotal - discount + tax + serviceCharge + roundOff) * 100) / 100;
        const total =
          typeof parsed.total === 'number' && parsed.total > 0
            ? parsed.total
            : calculatedTotal;

        const completeReceipt: ReceiptData = {
          billNumber: parsed.billNumber ? String(parsed.billNumber).trim() : `BILL-${Math.floor(10000 + Math.random() * 90000)}`,
          restaurantName: parsed.restaurantName ? String(parsed.restaurantName).trim() : file.name.replace(/\.[^/.]+$/, ''),
          gstin: parsed.gstin ? String(parsed.gstin).trim() : undefined,
          fssai: parsed.fssai ? String(parsed.fssai).trim() : undefined,
          table: parsed.table ? String(parsed.table).trim() : undefined,
          date: parsed.date || new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: parsed.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dinersCount: Number(parsed.dinersCount) || 4,
          currency: '₹',
          items: processedItems,
          subtotal: itemsSubtotal,
          discount,
          discountLabel,
          cgst,
          sgst,
          taxRate: parsed.taxRate || 5.0,
          tax,
          serviceCharge,
          roundOff,
          tipPercent: 0,
          tipAmount: 0,
          total,
          confidence: parsed.confidence || 98.5,
          originalImageUrl: base64,
          isCustomUpload: true,
        };

        onReceiptParsed(completeReceipt);
        onTriggerToast(
          `Extracted Bill #${completeReceipt.billNumber} from ${completeReceipt.restaurantName} (₹${completeReceipt.total.toFixed(2)})!`,
          'success'
        );
        onClose();
      } else {
        const errMsg = data?.error || 'Failed to read bill photo clearly.';
        setErrorMsg(`${errMsg} You can also enter the bill details manually.`);
      }
    } catch (err: any) {
      console.error('OCR scanning error:', err);
      setErrorMsg(
        err?.message ||
          'Failed to process image with OCR engine. Please ensure image has readable text or try entering manually.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(manualTotal) || 2000;
    const diners = parseInt(manualPeopleCount, 10) || 4;
    const billNo = manualBillNo.trim() || `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = Math.round((tot / 1.05) * 100) / 100;
    const cgst = Math.round(subtotal * 0.025 * 100) / 100;
    const sgst = Math.round(subtotal * 0.025 * 100) / 100;

    const customReceipt: ReceiptData = {
      billNumber: billNo,
      restaurantName: manualRestaurant.trim() || 'Dinner Bill',
      gstin: '07AAACP1234L1Z2',
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dinersCount: diners,
      currency: '₹',
      items: [
        { id: `man-1-${Date.now()}`, name: 'Starters & Appetizers', qty: 1, price: Math.round(subtotal * 0.4 * 100) / 100, category: 'Food' },
        { id: `man-2-${Date.now()}`, name: 'Main Course & Breads', qty: 1, price: Math.round(subtotal * 0.45 * 100) / 100, category: 'Food' },
        { id: `man-3-${Date.now()}`, name: 'Beverages & Desserts', qty: 1, price: Math.round(subtotal * 0.15 * 100) / 100, category: 'Drinks' },
      ],
      subtotal,
      cgst,
      sgst,
      taxRate: 5.0,
      tax: Math.round((cgst + sgst) * 100) / 100,
      serviceCharge: 0,
      roundOff: 0,
      tipPercent: 0,
      tipAmount: 0,
      total: tot,
      confidence: 100,
      isCustomUpload: true,
    };

    onReceiptParsed(customReceipt);
    onTriggerToast(`Created Bill #${customReceipt.billNumber} for ${diners} people!`, 'success');
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b1c30]/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#eff4ff] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#006948]" />
            <div>
              <h3 className="font-bold text-base text-[#0b1c30]">
                Scan Real Indian Bill Photo
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                Direct Optical Character Recognition (OCR) of items, Bill #, and exact ₹ prices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {!showManualOption ? (
            <>
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#006948] bg-[#6cf8bb]/15'
                    : 'border-slate-300 hover:border-[#006948] hover:bg-[#eff4ff]/40 bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />

                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#006948]/10 text-[#006948] flex items-center justify-center animate-spin">
                      <Loader2 className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-[#0b1c30]">
                        Reading Bill Photo with Gemini 3.8 Flash Vision...
                      </span>
                      <span className="text-xs text-slate-500 font-mono mt-1">
                        Transcribing exact Bill Number, dishes, quantities, and ₹ amounts
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#006948] flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#0b1c30] block">
                        Upload or snap dinner bill photo
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        Make sure the Bill Number, line items, and Grand Total are visible
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cameraInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#006948]" />
                        <span>Snap with Phone Camera</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
                    <button
                      type="button"
                      onClick={() => setShowManualOption(true)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition-colors"
                    >
                      Enter Bill Numbers Manually
                    </button>
                    <button
                      type="button"
                      onClick={() => setErrorMsg(null)}
                      className="px-2 py-1 rounded-lg text-rose-700 hover:bg-rose-100 text-[11px] font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Toggle to manual entry */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowManualOption(true)}
                  className="text-xs font-semibold text-[#006948] hover:underline"
                >
                  Enter Bill Number & Total manually instead
                </button>
              </div>

              {/* Quick Real Indian Sample Receipts */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-mono font-semibold uppercase text-slate-400">
                  Or Test with Sample Indian Restaurant Bills:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_INDIAN_RECEIPTS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => {
                        onReceiptParsed(sample.data);
                        onTriggerToast(`Loaded Bill #${sample.data.billNumber} from ${sample.data.restaurantName}!`, 'success');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#6cf8bb]/20 border border-slate-200/80 text-left transition-all group"
                    >
                      <span className="text-xs font-bold text-[#0b1c30] block group-hover:text-[#006948] transition-colors truncate">
                        {sample.data.restaurantName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 block">
                        Bill #{sample.data.billNumber}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#006948]">
                        ₹{sample.data.total.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Manual Bill Entry Form */
            <form onSubmit={handleManualCreate} className="flex flex-col gap-3 py-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bill / Invoice Number:
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL-49201"
                  value={manualBillNo}
                  onChange={(e) => setManualBillNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Restaurant / Cafe Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Barbeque Nation"
                  value={manualRestaurant}
                  onChange={(e) => setManualRestaurant(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Total Bill Amount (₹ INR):
                  </label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={manualTotal}
                    onChange={(e) => setManualTotal(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Number of Diners / Family:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={manualPeopleCount}
                    onChange={(e) => setManualPeopleCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-full bg-[#006948] text-white hover:bg-[#00855d] text-xs font-bold transition-all shadow-xs"
                >
                  Create & Split Bill
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualOption(false)}
                  className="py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Back to Photo Upload
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
