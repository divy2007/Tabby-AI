import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Calculator,
  AlertCircle,
  Receipt,
  Sparkles,
  Info,
} from 'lucide-react';
import { ReceiptData, ReceiptItem } from '../types';

interface EditBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData;
  onSave: (updatedReceipt: ReceiptData) => void;
  onTriggerToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const EditBillModal: React.FC<EditBillModalProps> = ({
  isOpen,
  onClose,
  receipt,
  onSave,
  onTriggerToast,
}) => {
  const [billNumber, setBillNumber] = useState(receipt.billNumber);
  const [restaurantName, setRestaurantName] = useState(receipt.restaurantName);
  const [gstin, setGstin] = useState(receipt.gstin || '');
  const [table, setTable] = useState(receipt.table || '');
  const [items, setItems] = useState<ReceiptItem[]>(
    receipt.items.map((it) => ({ ...it }))
  );
  const [discount, setDiscount] = useState<number>(receipt.discount || 0);
  const [discountLabel, setDiscountLabel] = useState<string>(
    receipt.discountLabel || 'Discount / Promo'
  );
  const [cgst, setCgst] = useState<number>(receipt.cgst);
  const [sgst, setSgst] = useState<number>(receipt.sgst);
  const [serviceCharge, setServiceCharge] = useState<number>(
    receipt.serviceCharge || 0
  );
  const [roundOff, setRoundOff] = useState<number>(receipt.roundOff || 0);
  const [customTotal, setCustomTotal] = useState<number>(receipt.total);

  if (!isOpen) return null;

  // Calculate items sum
  const itemsSubtotal = items.reduce((acc, it) => acc + (Number(it.price) || 0), 0);

  const handleItemChange = (
    index: number,
    field: keyof ReceiptItem,
    value: string | number
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'qty') {
        const qty = Math.max(1, parseInt(String(value), 10) || 1);
        item.qty = qty;
        if (item.rate) {
          item.price = Math.round(qty * item.rate * 100) / 100;
        }
      } else if (field === 'rate') {
        const rate = Math.max(0, parseFloat(String(value)) || 0);
        item.rate = rate;
        item.price = Math.round((item.qty || 1) * rate * 100) / 100;
      } else if (field === 'price') {
        const price = Math.max(0, parseFloat(String(value)) || 0);
        item.price = price;
        if (item.qty && item.qty > 0) {
          item.rate = Math.round((price / item.qty) * 100) / 100;
        }
      } else if (field === 'name') {
        item.name = String(value);
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      name: 'New Dish',
      qty: 1,
      rate: 150,
      price: 150,
      category: 'Food',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      onTriggerToast('Bill must have at least one item.', 'warning');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAutoCalculateTaxesAndTotal = () => {
    const sub = items.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
    const taxableAmount = Math.max(0, sub - (discount || 0));
    const autoCgst = Math.round(taxableAmount * 0.025 * 100) / 100;
    const autoSgst = Math.round(taxableAmount * 0.025 * 100) / 100;
    const calculatedTotal = Math.round(
      (taxableAmount + autoCgst + autoSgst + (serviceCharge || 0) + (roundOff || 0)) * 100
    ) / 100;

    setCgst(autoCgst);
    setSgst(autoSgst);
    setCustomTotal(calculatedTotal);
    onTriggerToast('Auto-calculated GST (2.5% + 2.5%) and Total!', 'info');
  };

  const handleSave = () => {
    const sub = items.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
    const tax = Math.round(((cgst || 0) + (sgst || 0)) * 100) / 100;
    const total = customTotal > 0 ? customTotal : Math.round((sub - (discount || 0) + tax + (serviceCharge || 0) + (roundOff || 0)) * 100) / 100;

    const updated: ReceiptData = {
      ...receipt,
      billNumber: billNumber.trim() || receipt.billNumber,
      restaurantName: restaurantName.trim() || receipt.restaurantName,
      gstin: gstin.trim() || undefined,
      table: table.trim() || undefined,
      items: items.map((it) => ({
        ...it,
        name: it.name.trim() || 'Dish',
        price: Number(it.price) || 0,
        qty: Number(it.qty) || 1,
      })),
      subtotal: sub,
      discount: discount > 0 ? discount : undefined,
      discountLabel: discount > 0 ? discountLabel : undefined,
      cgst,
      sgst,
      tax,
      serviceCharge: serviceCharge > 0 ? serviceCharge : 0,
      roundOff,
      total,
    };

    onSave(updated);
    onTriggerToast(`Bill #${updated.billNumber} successfully updated and recalculated!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006948] flex items-center justify-center text-white shadow-md">
              <Receipt className="w-5 h-5 text-[#85f8c4]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Review & Correct Bill Data</h2>
              <p className="text-xs text-slate-300">
                Adjust any OCR discrepancies to match your printed receipt to the exact rupee.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bill Meta Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Bill / Invoice No.
              </label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. 48291 or INV-102"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006948]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g. Punjab Grill"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006948]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                GSTIN / Table
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="GSTIN (optional)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006948]"
              />
            </div>
          </div>

          {/* Dish Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Line Items ({items.length} dishes)
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Subtotal: ₹{itemsSubtotal.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006948]/10 hover:bg-[#006948]/20 text-[#006948] text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Dish
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase font-mono border-b border-slate-200">
                <span className="col-span-1 text-center">QTY</span>
                <span className="col-span-5">DISH NAME</span>
                <span className="col-span-2 text-right">RATE (₹)</span>
                <span className="col-span-3 text-right">LINE TOTAL (₹)</span>
                <span className="col-span-1 text-center">DEL</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-slate-50/70 text-xs"
                  >
                    {/* QTY */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                        className="w-full text-center px-1.5 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#006948]"
                      />
                    </div>

                    {/* Dish Name */}
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#006948]"
                      />
                    </div>

                    {/* Rate */}
                    <div className="col-span-2 text-right">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={item.rate || (item.qty > 1 ? Math.round((item.price / item.qty) * 100) / 100 : item.price)}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full text-right px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#006948]"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="col-span-3 text-right">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                        className="w-full text-right px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-[#006948] focus:outline-none focus:ring-1 focus:ring-[#006948]"
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Taxes, Discounts, and Totals */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Taxes, Discount & Grand Total
              </h4>
              <button
                type="button"
                onClick={handleAutoCalculateTaxesAndTotal}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#eff4ff] hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                Auto-Calc 5% GST
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Discount */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Discount in ₹ (e.g. Zomato Gold)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              {/* CGST */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  CGST (₹ 2.5%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cgst}
                  onChange={(e) => setCgst(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              {/* SGST */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  SGST (₹ 2.5%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sgst}
                  onChange={(e) => setSgst(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              {/* Service Charge */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Service Charge (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              {/* Round Off */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Round Off (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={roundOff}
                  onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>

              {/* Grand Total */}
              <div>
                <label className="block text-[11px] font-semibold text-[#006948] mb-0.5">
                  Net Grand Total (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={customTotal}
                  onChange={(e) => setCustomTotal(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-extrabold text-[#006948] focus:outline-none focus:ring-2 focus:ring-[#006948]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Changes immediately sync to real-time diner splits & UPI requests.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200/70 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006948] hover:bg-[#005238] text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              Save Bill Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
