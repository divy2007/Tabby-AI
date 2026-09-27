export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  rate?: number; // Unit price if printed (e.g. ₹60)
  price: number; // Total line item amount (qty * rate, e.g. ₹180)
  category?: string;
}

export interface Participant {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  avatarLetter: string;
  upiId?: string;
  phoneNumber?: string;
}

export interface ItemShare {
  participantId: string;
  fraction: number; // 0 to 1.0
  customAmount?: number;
}

export interface ReceiptData {
  billNumber: string; // e.g. "BILL-48291", "INV-2024-8841"
  restaurantName: string;
  gstin?: string; // e.g. "07AAAAA0000A1Z5"
  fssai?: string;
  table?: string;
  date: string;
  time: string;
  dinersCount: number;
  currency: string; // "₹"
  items: ReceiptItem[];
  subtotal: number;
  discount?: number; // Discount in ₹ (e.g. Zomato Gold, Dineout, Promo)
  discountLabel?: string;
  cgst: number; // Central GST
  sgst: number; // State GST
  taxRate: number; // Combined GST % (usually 5% or 18%)
  tax: number; // Total GST (cgst + sgst)
  serviceCharge?: number; // Service charge in Indian restaurants (usually 5% - 10%)
  serviceChargePercent?: number;
  roundOff?: number; // Rounding off (+/- ₹0.xx)
  tipPercent: number; // e.g. 0.05 or 0.10
  tipAmount: number;
  total: number;
  confidence: number;
  originalImageUrl?: string;
  isCustomUpload?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  highlightedItems?: string[];
  highlightedParticipants?: string[];
}

export interface ParticipantSettlement {
  participant: Participant;
  itemsCount: number;
  itemsSubtotal: number;
  proportionalDiscount?: number;
  proportionalGst: number;
  proportionalServiceCharge: number;
  proportionalRoundOff?: number;
  proportionalTip: number;
  totalDue: number;
  claimedItems: Array<{
    item: ReceiptItem;
    fraction: number;
    amount: number;
  }>;
  upiUrl: string;
  gpayUrl: string;
  phonePeUrl: string;
  paytmUrl: string;
}
