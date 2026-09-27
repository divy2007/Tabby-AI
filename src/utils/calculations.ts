import { ReceiptData, Participant, ItemShare, ParticipantSettlement } from '../types';

export function calculateSettlements(
  receipt: ReceiptData,
  participants: Participant[],
  assignments: Record<string, ItemShare[]>
): {
  settlements: ParticipantSettlement[];
  totalAccountedPercent: number;
  assignedItemsCount: number;
  unassignedItemsCount: number;
  totalCalculated: number;
  isTotalMatched: boolean;
} {
  const totalItemsCount = receipt.items.length;
  let fullyOrPartiallyAssignedCount = 0;
  let totalFractionSum = 0;

  // Track assigned fraction per item
  receipt.items.forEach((item) => {
    const shares = assignments[item.id] || [];
    const sumFrac = shares.reduce((acc, s) => acc + s.fraction, 0);
    if (sumFrac > 0.001) {
      fullyOrPartiallyAssignedCount++;
      totalFractionSum += Math.min(sumFrac, 1.0);
    }
  });

  const totalAccountedPercent =
    totalItemsCount > 0
      ? Math.round((totalFractionSum / totalItemsCount) * 100)
      : 0;

  const unassignedItemsCount = totalItemsCount - fullyOrPartiallyAssignedCount;

  // Calculate items subtotal per participant
  const participantSubtotals: Record<string, number> = {};
  const participantClaimedItems: Record<
    string,
    Array<{ item: any; fraction: number; amount: number }>
  > = {};

  participants.forEach((p) => {
    participantSubtotals[p.id] = 0;
    participantClaimedItems[p.id] = [];
  });

  receipt.items.forEach((item) => {
    const shares = assignments[item.id] || [];
    if (shares.length === 0) return;

    const sumFrac = shares.reduce((acc, s) => acc + s.fraction, 0);
    // If item is completely split (sumFrac ~ 1.0), ensure sum of shares equals item.price exactly
    if (Math.abs(sumFrac - 1.0) <= 0.02) {
      let allocated = 0;
      const computedAmounts = shares.map((share, idx) => {
        if (idx === shares.length - 1) {
          const remainder = Math.max(0, Math.round((item.price - allocated) * 100) / 100);
          return remainder;
        }
        const amt = Math.round(item.price * share.fraction * 100) / 100;
        allocated += amt;
        return amt;
      });

      shares.forEach((share, idx) => {
        if (participantSubtotals[share.participantId] !== undefined) {
          const itemAmount = computedAmounts[idx];
          participantSubtotals[share.participantId] += itemAmount;
          participantClaimedItems[share.participantId].push({
            item,
            fraction: share.fraction,
            amount: itemAmount,
          });
        }
      });
    } else {
      shares.forEach((share) => {
        if (participantSubtotals[share.participantId] !== undefined) {
          const itemAmount = Math.round(item.price * share.fraction * 100) / 100;
          participantSubtotals[share.participantId] += itemAmount;
          participantClaimedItems[share.participantId].push({
            item,
            fraction: share.fraction,
            amount: itemAmount,
          });
        }
      });
    }
  });

  // Calculate proportional taxes & charges
  const itemsSubtotal =
    receipt.items.reduce((acc, it) => acc + (Number(it.price) || 0), 0) ||
    (receipt.subtotal > 0 ? receipt.subtotal : 1);

  const discount = receipt.discount || 0;
  const totalGst = (receipt.cgst || 0) + (receipt.sgst || 0) || receipt.tax || 0;
  const serviceCharge = receipt.serviceCharge || 0;
  const roundOff = receipt.roundOff || 0;
  const tipAmount = receipt.tipAmount || 0;
  const grandTotal = Math.round(receipt.total * 100) / 100;

  const settlements: ParticipantSettlement[] = participants.map((p) => {
    const pSubtotal = Math.round((participantSubtotals[p.id] || 0) * 100) / 100;
    const ratio = itemsSubtotal > 0 ? pSubtotal / itemsSubtotal : 0;

    const proportionalDiscount = Math.round(discount * ratio * 100) / 100;
    const proportionalGst = Math.round(totalGst * ratio * 100) / 100;
    const proportionalServiceCharge = Math.round(serviceCharge * ratio * 100) / 100;
    const proportionalRoundOff = Math.round(roundOff * ratio * 100) / 100;
    const proportionalTip = Math.round(tipAmount * ratio * 100) / 100;

    // Total due in INR (rounded to 2 decimal places)
    const rawTotal =
      pSubtotal -
      proportionalDiscount +
      proportionalGst +
      proportionalServiceCharge +
      proportionalRoundOff +
      proportionalTip;
    const totalDue = Math.max(0, Math.round(rawTotal * 100) / 100);

    // UPI Payment Links for India
    const upiId = p.upiId || `${p.name.toLowerCase().replace(/\s+/g, '')}@upi`;
    const noteText = encodeURIComponent(`Bill ${receipt.billNumber || 'Dining'} Split - ${receipt.restaurantName}`);
    const encodedName = encodeURIComponent(p.name);
    
    // Standard UPI URI specification
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodedName}&am=${totalDue.toFixed(2)}&cu=INR&tn=${noteText}`;
    const gpayUrl = `tez://upi/pay?pa=${upiId}&pn=${encodedName}&am=${totalDue.toFixed(2)}&cu=INR&tn=${noteText}`;
    const phonePeUrl = `phonepe://pay?pa=${upiId}&pn=${encodedName}&am=${totalDue.toFixed(2)}&cu=INR&tn=${noteText}`;
    const paytmUrl = `paytmmp://pay?pa=${upiId}&pn=${encodedName}&am=${totalDue.toFixed(2)}&cu=INR&tn=${noteText}`;

    return {
      participant: p,
      itemsCount: participantClaimedItems[p.id]?.length || 0,
      itemsSubtotal: pSubtotal,
      proportionalDiscount,
      proportionalGst,
      proportionalServiceCharge,
      proportionalRoundOff,
      proportionalTip,
      totalDue,
      claimedItems: participantClaimedItems[p.id] || [],
      upiUrl,
      gpayUrl,
      phonePeUrl,
      paytmUrl,
    };
  });

  let totalCalculated = Math.round(settlements.reduce((acc, s) => acc + s.totalDue, 0) * 100) / 100;

  // Exact Paise Reconciliation:
  // When 100% of the bill is assigned, any tiny 1-2 paise fractional discrepancy
  // is reconciled to the diner with the largest consumption so sum(dues) === bill total perfectly.
  if (totalAccountedPercent === 100 && settlements.length > 0) {
    const diff = Math.round((grandTotal - totalCalculated) * 100) / 100;
    if (Math.abs(diff) > 0 && Math.abs(diff) <= 0.25) {
      let maxIdx = 0;
      let maxSub = -1;
      settlements.forEach((s, idx) => {
        if (s.itemsSubtotal > maxSub) {
          maxSub = s.itemsSubtotal;
          maxIdx = idx;
        }
      });

      if (settlements[maxIdx]) {
        settlements[maxIdx].totalDue = Math.max(0, Math.round((settlements[maxIdx].totalDue + diff) * 100) / 100);
        const p = settlements[maxIdx].participant;
        const upiId = p.upiId || `${p.name.toLowerCase().replace(/\s+/g, '')}@upi`;
        const noteText = encodeURIComponent(`Bill ${receipt.billNumber || 'Dining'} Split - ${receipt.restaurantName}`);
        const encodedName = encodeURIComponent(p.name);
        const amtStr = settlements[maxIdx].totalDue.toFixed(2);
        settlements[maxIdx].upiUrl = `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amtStr}&cu=INR&tn=${noteText}`;
        settlements[maxIdx].gpayUrl = `tez://upi/pay?pa=${upiId}&pn=${encodedName}&am=${amtStr}&cu=INR&tn=${noteText}`;
        settlements[maxIdx].phonePeUrl = `phonepe://pay?pa=${upiId}&pn=${encodedName}&am=${amtStr}&cu=INR&tn=${noteText}`;
        settlements[maxIdx].paytmUrl = `paytmmp://pay?pa=${upiId}&pn=${encodedName}&am=${amtStr}&cu=INR&tn=${noteText}`;

        totalCalculated = Math.round(settlements.reduce((acc, s) => acc + s.totalDue, 0) * 100) / 100;
      }
    }
  }

  const isTotalMatched =
    Math.abs(totalCalculated - grandTotal) < 0.01 && totalAccountedPercent === 100;

  return {
    settlements,
    totalAccountedPercent,
    assignedItemsCount: fullyOrPartiallyAssignedCount,
    unassignedItemsCount,
    totalCalculated: Math.round(totalCalculated * 100) / 100,
    isTotalMatched,
  };
}

// Function to split all items equally among all friends/family
export function splitBillEqually(
  receipt: ReceiptData,
  participants: Participant[]
): Record<string, ItemShare[]> {
  const newAssignments: Record<string, ItemShare[]> = {};
  if (participants.length === 0) return newAssignments;

  const fractionEach = 1 / participants.length;
  receipt.items.forEach((item) => {
    newAssignments[item.id] = participants.map((p) => ({
      participantId: p.id,
      fraction: fractionEach,
    }));
  });

  return newAssignments;
}

// Generate formatted copyable text for WhatsApp / Indian Group Chat
export function generateGroupChatSummary(
  receipt: ReceiptData,
  settlements: ParticipantSettlement[]
): string {
  const lines: string[] = [];
  lines.push(`🧾 *${receipt.restaurantName.toUpperCase()} — BILL SPLIT*`);
  lines.push(`🔖 *Bill No:* #${receipt.billNumber || 'N/A'} ${receipt.gstin ? `| GSTIN: ${receipt.gstin}` : ''}`);
  lines.push(`📅 ${receipt.date} ${receipt.time ? '• ' + receipt.time : ''}`);
  if (receipt.table) lines.push(`📍 Table: ${receipt.table}`);
  lines.push(
    `💰 Subtotal: ₹${receipt.subtotal.toFixed(2)} | GST (5%): ₹${receipt.tax.toFixed(2)} ${
      receipt.serviceCharge ? `| Service Charge: ₹${receipt.serviceCharge.toFixed(2)}` : ''
    }`
  );
  lines.push(`💳 *Total Bill Amount: ₹${receipt.total.toFixed(2)}*`);
  lines.push(`─────────────────────────────`);

  settlements.forEach((s) => {
    if (s.totalDue > 0) {
      lines.push(`👤 *${s.participant.name}* owes: *₹${s.totalDue.toFixed(2)}*`);
      lines.push(
        `   Dishes: ₹${s.itemsSubtotal.toFixed(2)} + Taxes/Charges: ₹${(
          s.proportionalGst +
          s.proportionalServiceCharge +
          s.proportionalTip
        ).toFixed(2)}`
      );
      s.claimedItems.forEach((c) => {
        const shareLabel =
          c.fraction === 1
            ? '100%'
            : c.fraction === 0.5
            ? '½'
            : c.fraction === 0.25
            ? '¼'
            : `${Math.round(c.fraction * 100)}%`;
        lines.push(`   • ${c.item.name} (${shareLabel} = ₹${c.amount.toFixed(2)})`);
      });
      if (s.participant.upiId) {
        lines.push(`   ⚡ Pay via UPI: ${s.participant.upiId}`);
      }
      lines.push(``);
    }
  });

  lines.push(`✨ Fairly distributed with proportional GST & Service Charge via Tabby AI`);
  return lines.join('\n');
}

// Export as CSV with Indian Bill details
export function exportToCSV(
  receipt: ReceiptData,
  settlements: ParticipantSettlement[]
): string {
  const rows: string[][] = [
    ['Restaurant Name', receipt.restaurantName],
    ['Bill / Invoice Number', receipt.billNumber || 'N/A'],
    ['GSTIN', receipt.gstin || 'N/A'],
    ['Date', receipt.date],
    ['Subtotal (INR)', `₹${receipt.subtotal.toFixed(2)}`],
    ['CGST (INR)', `₹${receipt.cgst.toFixed(2)}`],
    ['SGST (INR)', `₹${receipt.sgst.toFixed(2)}`],
    ['Service Charge (INR)', `₹${(receipt.serviceCharge || 0).toFixed(2)}`],
    ['Grand Total (INR)', `₹${receipt.total.toFixed(2)}`],
    [],
    [
      'Friend / Family Member',
      'Items Subtotal (INR)',
      'Proportional GST (INR)',
      'Proportional Service Charge (INR)',
      'Total Due (INR)',
      'UPI ID',
    ],
  ];

  settlements.forEach((s) => {
    rows.push([
      s.participant.name,
      `₹${s.itemsSubtotal.toFixed(2)}`,
      `₹${s.proportionalGst.toFixed(2)}`,
      `₹${s.proportionalServiceCharge.toFixed(2)}`,
      `₹${s.totalDue.toFixed(2)}`,
      s.participant.upiId || '',
    ]);
  });

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}
