import { ReceiptData, Participant, ItemShare } from '../types';

export const INITIAL_INDIAN_PARTICIPANTS: Participant[] = [
  {
    id: 'dhruv',
    name: 'Dhruv',
    color: 'purple',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
    badgeText: 'text-purple-700',
    avatarLetter: 'D',
    upiId: 'dhruv@okaxis',
    phoneNumber: '+91 98101 23456',
  },
  {
    id: 'aarav',
    name: 'Aarav',
    color: 'emerald',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    badgeText: 'text-emerald-700',
    avatarLetter: 'A',
    upiId: 'aarav@okhdfcbank',
    phoneNumber: '+91 98202 34567',
  },
  {
    id: 'pooja',
    name: 'Pooja',
    color: 'amber',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    badgeText: 'text-amber-800',
    avatarLetter: 'P',
    upiId: 'pooja@paytm',
    phoneNumber: '+91 98303 45678',
  },
  {
    id: 'sneha',
    name: 'Sneha',
    color: 'indigo',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    badgeText: 'text-indigo-700',
    avatarLetter: 'S',
    upiId: 'sneha@oksbi',
    phoneNumber: '+91 98404 56789',
  },
];

export const SAMPLE_INDIAN_RECEIPTS: {
  id: string;
  label: string;
  data: ReceiptData;
  defaultShares: Record<string, ItemShare[]>;
}[] = [
  {
    id: 'punjab-grill',
    label: 'Punjab Grill (Bill #PG-48291 • ₹3,845)',
    data: {
      billNumber: 'PG-48291',
      restaurantName: 'Punjab Grill',
      gstin: '07AAACP5521L1ZU',
      fssai: '10019011005821',
      table: 'Table T-12',
      date: 'Oct 24, 2024',
      time: '9:15 PM',
      dinersCount: 4,
      currency: '₹',
      items: [
        { id: 'pg-1', name: 'Paneer Tikka Multani', qty: 1, price: 475.0, category: 'Starters' },
        { id: 'pg-2', name: 'Murgh Malai Tikka', qty: 1, price: 545.0, category: 'Starters' },
        { id: 'pg-3', name: 'Dal Punjab Grill (Black Dal)', qty: 1, price: 495.0, category: 'Mains' },
        { id: 'pg-4', name: 'Butter Chicken Special', qty: 1, price: 625.0, category: 'Mains' },
        { id: 'pg-5', name: 'Garlic Naan (Basket x4)', qty: 4, price: 380.0, category: 'Breads' },
        { id: 'pg-6', name: 'Dum Murgh Biryani with Raita', qty: 1, price: 595.0, category: 'Rice' },
        { id: 'pg-7', name: 'Kesar Phirni & Gulab Jamun', qty: 2, price: 330.0, category: 'Dessert' },
      ],
      subtotal: 3445.0,
      cgst: 86.13, // 2.5%
      sgst: 86.13, // 2.5%
      taxRate: 5.0, // 5% GST on Restaurant food
      tax: 172.26,
      serviceCharge: 172.25, // 5% optional service charge
      serviceChargePercent: 5.0,
      roundOff: 0.49,
      tipPercent: 0.05,
      tipAmount: 55.0,
      total: 3845.0,
      confidence: 99.4,
      originalImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
    defaultShares: {
      'pg-1': [
        { participantId: 'pooja', fraction: 0.5 },
        { participantId: 'sneha', fraction: 0.5 },
      ],
      'pg-2': [
        { participantId: 'dhruv', fraction: 0.5 },
        { participantId: 'aarav', fraction: 0.5 },
      ],
      'pg-3': [
        { participantId: 'dhruv', fraction: 0.25 },
        { participantId: 'aarav', fraction: 0.25 },
        { participantId: 'pooja', fraction: 0.25 },
        { participantId: 'sneha', fraction: 0.25 },
      ],
      'pg-4': [
        { participantId: 'dhruv', fraction: 0.5 },
        { participantId: 'aarav', fraction: 0.5 },
      ],
      'pg-5': [
        { participantId: 'dhruv', fraction: 0.25 },
        { participantId: 'aarav', fraction: 0.25 },
        { participantId: 'pooja', fraction: 0.25 },
        { participantId: 'sneha', fraction: 0.25 },
      ],
      'pg-6': [
        { participantId: 'dhruv', fraction: 0.33 },
        { participantId: 'aarav', fraction: 0.33 },
        { participantId: 'sneha', fraction: 0.34 },
      ],
      'pg-7': [
        { participantId: 'pooja', fraction: 0.5 },
        { participantId: 'sneha', fraction: 0.5 },
      ],
    },
  },
  {
    id: 'social-cyberhub',
    label: 'Social Cyber Hub (Bill #SOC-19842 • ₹2,650)',
    data: {
      billNumber: 'SOC-19842',
      restaurantName: 'Cyber Hub Social',
      gstin: '06AABCI9021K1ZM',
      table: 'Booth 8',
      date: 'Oct 26, 2024',
      time: '10:30 PM',
      dinersCount: 4,
      currency: '₹',
      items: [
        { id: 'soc-1', name: 'Dhingra Chilli Paneer', qty: 1, price: 395.0, category: 'Munchies' },
        { id: 'soc-2', name: 'Awadhi Gosht Dum Biryani', qty: 1, price: 545.0, category: 'Mains' },
        { id: 'soc-3', name: 'Death Wings (Spicy)', qty: 1, price: 425.0, category: 'Starters' },
        { id: 'soc-4', name: 'LIIT Toxic Pitcher (1000ml)', qty: 1, price: 820.0, category: 'Beverage' },
        { id: 'soc-5', name: 'Classic Cold Coffee Shake', qty: 1, price: 210.0, category: 'Beverage' },
      ],
      subtotal: 2395.0,
      cgst: 59.88,
      sgst: 59.88,
      taxRate: 5.0,
      tax: 119.76,
      serviceCharge: 119.75,
      serviceChargePercent: 5.0,
      roundOff: 0.49,
      tipPercent: 0.0,
      tipAmount: 15.0,
      total: 2650.0,
      confidence: 98.9,
      originalImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    defaultShares: {
      'soc-1': [
        { participantId: 'pooja', fraction: 0.5 },
        { participantId: 'sneha', fraction: 0.5 },
      ],
      'soc-2': [
        { participantId: 'aarav', fraction: 1.0 },
      ],
      'soc-3': [
        { participantId: 'dhruv', fraction: 1.0 },
      ],
      'soc-4': [
        { participantId: 'dhruv', fraction: 0.33 },
        { participantId: 'aarav', fraction: 0.33 },
        { participantId: 'sneha', fraction: 0.34 },
      ],
      'soc-5': [
        { participantId: 'pooja', fraction: 1.0 },
      ],
    },
  },
  {
    id: 'saravana-bhavan',
    label: 'Saravana Bhavan (Bill #SB-9021 • ₹1,102.50)',
    data: {
      billNumber: 'SB-9021',
      restaurantName: 'Hotel Saravana Bhavan',
      gstin: '07AATCS9912F1Z4',
      table: 'Counter 4',
      date: 'Oct 27, 2024',
      time: '8:45 AM',
      dinersCount: 4,
      currency: '₹',
      items: [
        { id: 'sb-1', name: 'Ghee Roast Masala Dosa', qty: 2, price: 340.0, category: 'South Indian' },
        { id: 'sb-2', name: 'Medu Vada with Sambar (2 pcs)', qty: 1, price: 160.0, category: 'South Indian' },
        { id: 'sb-3', name: 'Rava Onion Masala Dosa', qty: 1, price: 195.0, category: 'South Indian' },
        { id: 'sb-4', name: 'Special Madras Filter Coffee (x4)', qty: 4, price: 260.0, category: 'Beverages' },
        { id: 'sb-5', name: 'Rava Pineapple Kesari', qty: 1, price: 95.0, category: 'Dessert' },
      ],
      subtotal: 1050.0,
      cgst: 26.25,
      sgst: 26.25,
      taxRate: 5.0,
      tax: 52.5,
      serviceCharge: 0.0,
      serviceChargePercent: 0.0,
      roundOff: 0.0,
      tipPercent: 0.0,
      tipAmount: 0.0,
      total: 1102.5,
      confidence: 99.2,
      originalImageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    },
    defaultShares: {
      'sb-1': [
        { participantId: 'dhruv', fraction: 0.5 },
        { participantId: 'aarav', fraction: 0.5 },
      ],
      'sb-2': [
        { participantId: 'dhruv', fraction: 0.25 },
        { participantId: 'aarav', fraction: 0.25 },
        { participantId: 'pooja', fraction: 0.25 },
        { participantId: 'sneha', fraction: 0.25 },
      ],
      'sb-3': [
        { participantId: 'sneha', fraction: 1.0 },
      ],
      'sb-4': [
        { participantId: 'dhruv', fraction: 0.25 },
        { participantId: 'aarav', fraction: 0.25 },
        { participantId: 'pooja', fraction: 0.25 },
        { participantId: 'sneha', fraction: 0.25 },
      ],
      'sb-5': [
        { participantId: 'pooja', fraction: 1.0 },
      ],
    },
  },
];
