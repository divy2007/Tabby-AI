import { ReceiptData, Participant, ItemShare, ReceiptItem } from '../types';

const INDIAN_COLOR_PALETTE = [
  { name: 'rose', badgeBg: 'bg-rose-100 text-rose-900 border-rose-200', badgeText: 'text-rose-700' },
  { name: 'teal', badgeBg: 'bg-teal-100 text-teal-900 border-teal-200', badgeText: 'text-teal-700' },
  { name: 'blue', badgeBg: 'bg-blue-100 text-blue-900 border-blue-200', badgeText: 'text-blue-700' },
  { name: 'orange', badgeBg: 'bg-orange-100 text-orange-900 border-orange-200', badgeText: 'text-orange-800' },
  { name: 'cyan', badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-200', badgeText: 'text-cyan-700' },
];

export function executeNLPCommand(
  rawMessage: string,
  receipt: ReceiptData,
  currentParticipants: Participant[],
  currentAssignments: Record<string, ItemShare[]>
): {
  reply: string;
  updatedReceipt: ReceiptData;
  updatedParticipants: Participant[];
  updatedAssignments: Record<string, ItemShare[]>;
} {
  const text = rawMessage.trim();
  const lower = text.toLowerCase();

  let participants = [...currentParticipants];
  let receiptData = { ...receipt, items: [...receipt.items] };
  let assignments = { ...currentAssignments };

  // 1. Equal Split Across All People
  if (
    lower.includes('split equally') ||
    lower.includes('split equal') ||
    lower.includes('divide equally') ||
    lower.includes('everyone pays equal') ||
    lower.includes('split the bill equally')
  ) {
    const fractionEach = 1 / participants.length;
    receiptData.items.forEach((item) => {
      assignments[item.id] = participants.map((p) => ({
        participantId: p.id,
        fraction: fractionEach,
      }));
    });
    const perPerson = (receiptData.total / participants.length).toFixed(2);
    return {
      reply: `Split Bill **#${receiptData.billNumber}** equally across all **${participants.length}** friends/family members (**₹${perPerson}** per person). Total matched: ₹${receiptData.total.toFixed(2)}.`,
      updatedReceipt: receiptData,
      updatedParticipants: participants,
      updatedAssignments: assignments,
    };
  }

  // 2. Set Number of People (e.g. "We were 5 people" or "Set diners to 6")
  const numPeopleMatch = lower.match(/(?:we were|make it|set diners to|set people to|total)\s*(\d{1,2})\s*(?:people|friends|family|diners|members)?/i);
  if (numPeopleMatch) {
    const targetCount = parseInt(numPeopleMatch[1], 10);
    if (targetCount > 0 && targetCount <= 20) {
      if (targetCount > participants.length) {
        const toAdd = targetCount - participants.length;
        const indianNamesPool = ['Kabir', 'Meera', 'Rohan', 'Ananya', 'Vikram', 'Tanvi', 'Ishaan', 'Diya'];
        for (let i = 0; i < toAdd; i++) {
          const name = indianNamesPool[i % indianNamesPool.length] + (participants.some((p) => p.name.startsWith(indianNamesPool[i % indianNamesPool.length])) ? ` ${i + 2}` : '');
          const palette = INDIAN_COLOR_PALETTE[participants.length % INDIAN_COLOR_PALETTE.length];
          participants.push({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            color: palette.name,
            badgeBg: palette.badgeBg,
            badgeText: palette.badgeText,
            avatarLetter: name.charAt(0),
            upiId: `${name.toLowerCase().replace(/\s+/g, '')}@upi`,
          });
        }
      } else if (targetCount < participants.length) {
        participants = participants.slice(0, targetCount);
      }
      receiptData.dinersCount = targetCount;
      return {
        reply: `Updated party size to **${targetCount} people**. Diners: ${participants.map((p) => p.name).join(', ')}.`,
        updatedReceipt: receiptData,
        updatedParticipants: participants,
        updatedAssignments: assignments,
      };
    }
  }

  // 3. Reset or Clear All
  if (lower.includes('reset') || lower.includes('clear all')) {
    assignments = {};
    return {
      reply: `Cleared all item allocations for Bill **#${receiptData.billNumber}**. Ready for fresh assignments!`,
      updatedReceipt: receiptData,
      updatedParticipants: participants,
      updatedAssignments: assignments,
    };
  }

  // 4. Add Specific Person (e.g. "Add Kabir", "Add friend Meera")
  const addPersonMatch = lower.match(/add\s+(?:person|diner|member|friend)?\s*([a-zA-Z]+)/i);
  if (addPersonMatch) {
    const rawName = addPersonMatch[1].trim();
    if (rawName && !['person', 'diner', 'member', 'friend', 'bill'].includes(rawName.toLowerCase())) {
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
      const existing = participants.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return {
          reply: `${name} is already at the table. You can assign Indian dishes to ${name}.`,
          updatedReceipt: receiptData,
          updatedParticipants: participants,
          updatedAssignments: assignments,
        };
      }
      const palette = INDIAN_COLOR_PALETTE[participants.length % INDIAN_COLOR_PALETTE.length];
      const newDiner: Participant = {
        id: name.toLowerCase(),
        name,
        color: palette.name,
        badgeBg: palette.badgeBg,
        badgeText: palette.badgeText,
        avatarLetter: name.charAt(0),
        upiId: `${name.toLowerCase()}@upi`,
      };
      participants.push(newDiner);
      receiptData.dinersCount = participants.length;
      return {
        reply: `Added **${name}** to dinner party! Total friends/family is now ${participants.length}.`,
        updatedReceipt: receiptData,
        updatedParticipants: participants,
        updatedAssignments: assignments,
      };
    }
  }

  // 5. Add custom item with ₹ amount (e.g. "Pooja had a sweet lassi ₹120" or "Add garlic naan 90")
  const addItemMatch = text.match(/(?:add|had|ordered)?\s*(?:a|an)?\s*([a-zA-Z\s]+?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{2})?)/i);
  if (addItemMatch) {
    const rawItemName = addItemMatch[1].replace(/^(add|had|ordered|also)\s+/i, '').trim();
    const price = parseFloat(addItemMatch[2]);
    if (rawItemName && price > 0 && !rawItemName.toLowerCase().includes('tip')) {
      const newItemId = `custom-item-${Date.now()}`;
      const newItem: ReceiptItem = {
        id: newItemId,
        name: rawItemName.charAt(0).toUpperCase() + rawItemName.slice(1),
        qty: 1,
        price,
        category: 'Additional',
      };
      receiptData.items.push(newItem);
      receiptData.subtotal = Math.round((receiptData.subtotal + price) * 100) / 100;
      receiptData.cgst = Math.round(receiptData.subtotal * 0.025 * 100) / 100;
      receiptData.sgst = Math.round(receiptData.subtotal * 0.025 * 100) / 100;
      receiptData.tax = Math.round((receiptData.cgst + receiptData.sgst) * 100) / 100;
      receiptData.total = Math.round((receiptData.subtotal + receiptData.tax + (receiptData.serviceCharge || 0) + (receiptData.tipAmount || 0)) * 100) / 100;

      const matchedPerson = participants.find((p) => lower.includes(p.name.toLowerCase()));
      if (matchedPerson) {
        assignments[newItemId] = [{ participantId: matchedPerson.id, fraction: 1.0 }];
        return {
          reply: `Added **${newItem.name}** (₹${price.toFixed(2)}) and assigned 100% to **${matchedPerson.name}**. Bill **#${receiptData.billNumber}** total updated to ₹${receiptData.total.toFixed(2)}.`,
          updatedReceipt: receiptData,
          updatedParticipants: participants,
          updatedAssignments: assignments,
        };
      }
      return {
        reply: `Added **${newItem.name}** (₹${price.toFixed(2)}) to Bill **#${receiptData.billNumber}**. Click it or chat to assign.`,
        updatedReceipt: receiptData,
        updatedParticipants: participants,
        updatedAssignments: assignments,
      };
    }
  }

  // 6. Detect mentions of participants in prompt
  const mentionedPeople = participants.filter((p) => {
    const regex = new RegExp(`\\b${p.name}\\b`, 'i');
    return regex.test(text);
  });

  const isEveryone =
    lower.includes('everyone') ||
    lower.includes('all') ||
    lower.includes('table') ||
    lower.includes('whole group');

  // Detect which items are mentioned
  const matchedItems: ReceiptItem[] = receiptData.items.filter((item) => {
    const itemNameLower = item.name.toLowerCase();
    const words = itemNameLower.split(/[\s,()/-]+/).filter((w) => w.length > 2);
    return (
      lower.includes(itemNameLower) ||
      words.some((w) => {
        if (['and', 'with', 'the', 'dry', 'red', 'half', 'hot', 'basket'].includes(w)) return false;
        return lower.includes(w);
      })
    );
  });

  // Handle "Split across everyone"
  if (isEveryone && matchedItems.length > 0) {
    const fractionEach = 1 / participants.length;
    matchedItems.forEach((item) => {
      assignments[item.id] = participants.map((p) => ({
        participantId: p.id,
        fraction: fractionEach,
      }));
    });

    const itemNames = matchedItems.map((i) => `**${i.name}** (₹${i.price.toFixed(2)})`).join(' and ');
    const perPersonAmt = (matchedItems.reduce((acc, i) => acc + i.price, 0) / participants.length).toFixed(2);

    return {
      reply: `Distributed ${itemNames} ${participants.length}-ways evenly across ${participants.map((p) => p.name).join(', ')} (₹${perPersonAmt}/person). Proportional GST & charges updated.`,
      updatedReceipt: receiptData,
      updatedParticipants: participants,
      updatedAssignments: assignments,
    };
  }

  // Handle Multiple People Sharing
  if (mentionedPeople.length >= 2 && matchedItems.length > 0) {
    const fractionEach = 1 / mentionedPeople.length;
    matchedItems.forEach((item) => {
      assignments[item.id] = mentionedPeople.map((p) => ({
        participantId: p.id,
        fraction: fractionEach,
      }));
    });

    const itemNames = matchedItems.map((i) => `**${i.name}** (₹${i.price.toFixed(2)})`).join(' and ');
    const peopleNames = mentionedPeople.map((p) => `**${p.name}**`).join(' and ');
    const shareEach = (matchedItems.reduce((acc, i) => acc + i.price, 0) / mentionedPeople.length).toFixed(2);

    return {
      reply: `Split ${itemNames} equally between ${peopleNames} (₹${shareEach} each). Proportional GST and service charge recalculated.`,
      updatedReceipt: receiptData,
      updatedParticipants: participants,
      updatedAssignments: assignments,
    };
  }

  // Handle Single Person Claiming Items
  if (mentionedPeople.length === 1 && matchedItems.length > 0) {
    const person = mentionedPeople[0];
    matchedItems.forEach((item) => {
      assignments[item.id] = [{ participantId: person.id, fraction: 1.0 }];
    });

    const itemNames = matchedItems.map((i) => `**${i.name}** (₹${i.price.toFixed(2)})`).join(' and ');
    const totalClaimed = matchedItems.reduce((acc, i) => acc + i.price, 0).toFixed(2);

    return {
      reply: `Got it! Assigned ${itemNames} (total ₹${totalClaimed}) to **${person.name}**. Proportional GST & service charge updated.`,
      updatedReceipt: receiptData,
      updatedParticipants: participants,
      updatedAssignments: assignments,
    };
  }

  // Generic fallback
  return {
    reply: `I understood your message. Try saying: *"Pooja and Sneha shared the paneer tikka"*, *"Split the biryani across everyone"*, or *"Split bill equally among all 4 of us"*.`,
    updatedReceipt: receiptData,
    updatedParticipants: participants,
    updatedAssignments: assignments,
  };
}
