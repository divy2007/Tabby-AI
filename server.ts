import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Support large payload for high-resolution Indian bill photos
app.use(express.json({ limit: '35mb' }));

// Helper for Gemini AI client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint: Parse Real Indian Bill Photo via Gemini 3.8 Flash Vision with strict fidelity
app.post('/api/parse-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Bill image data is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in environment.',
      });
    }

    // Clean base64 string and determine valid mime type
    let cleanBase64 = String(imageBase64 || '');
    let effectiveMimeType = mimeType || 'image/jpeg';

    if (cleanBase64.startsWith('data:')) {
      const match = cleanBase64.match(/^data:([^;]+);base64,/);
      if (match) {
        effectiveMimeType = match[1] || effectiveMimeType;
        cleanBase64 = cleanBase64.replace(/^data:[^;]+;base64,/, '');
      } else if (cleanBase64.includes(';base64,')) {
        cleanBase64 = cleanBase64.split(';base64,')[1];
      }
    }
    cleanBase64 = cleanBase64.trim();

    // Map common browser mime types to Gemini-supported types
    if (effectiveMimeType.includes('pdf')) {
      effectiveMimeType = 'application/pdf';
    } else if (effectiveMimeType.includes('png')) {
      effectiveMimeType = 'image/png';
    } else if (effectiveMimeType.includes('webp')) {
      effectiveMimeType = 'image/webp';
    } else if (effectiveMimeType.includes('heic') || effectiveMimeType.includes('heif')) {
      effectiveMimeType = 'image/heic';
    } else {
      effectiveMimeType = 'image/jpeg';
    }

    const prompt = `You are a high-precision, strict OCR optical scanner for Indian restaurant bills, tax invoices, and food checks.
CRITICAL INSTRUCTIONS - READ THE BILL PHOTO EXACTLY AS PRINTED WITHOUT GUESSING:
1. "billNumber": Look carefully for the actual printed invoice / check / bill / order number (e.g., "INV-1092", "Bill: 48291", "Check #14", "Order 88"). Transcribe the EXACT number printed on the paper. Do NOT invent a fake number.
2. "restaurantName": The exact legal or brand name of the restaurant printed at the top of the bill.
3. "gstin": The printed 15-character Indian GSTIN number (e.g., 07AAAAA0000A1Z5), if present.
4. "fssai": The printed FSSAI license number, if present.
5. "table": Table number or Dine-In / Takeaway code if printed.
6. "date" and "time": The exact date and timestamp printed on the receipt.
7. "currency": Set to "₹".
8. "items": Extract EVERY SINGLE line item printed on the bill:
   - "name": The exact dish / beverage name as printed (e.g. "Paneer Tikka", "Kingfisher Premium", "Butter Roti").
   - "qty": Exact integer quantity printed (1, 2, 4, etc.).
   - "rate": Unit price per single item in ₹, if printed (e.g. 40.00).
   - "price": CRITICAL: The TOTAL LINE AMOUNT for this dish in ₹ (e.g. if 4 Butter Roti @ 40 each, the line total is 160.00). Price MUST be the total for the entire quantity, NOT the single unit rate!
9. "subtotal": The exact subtotal of items printed on the bill before discounts and taxes. If not explicitly labeled, calculate sum of item prices.
10. "discount": Any discount amount in ₹ (e.g. Zomato Gold, Swiggy Dineout, Happy Hours, Promo, Corporate Discount). If none, 0.
11. "discountLabel": Name of discount if printed (e.g., "Zomato Gold 10%", "Dineout Discount").
12. "cgst": The exact Central GST amount in ₹ printed on the receipt (usually 2.5% on food).
13. "sgst": The exact State GST amount in ₹ printed on the receipt (usually 2.5% on food).
14. "tax": The sum of taxes (CGST + SGST + VAT) printed on the bill.
15. "taxRate": The tax percentage (e.g., 5.0 for 5% GST, 18.0 for 18% GST).
16. "serviceCharge": Any service charge or service fee printed on the bill in ₹. If none is printed, set to 0.
17. "roundOff": The exact round off printed (e.g., +0.25, -0.40). If none, set to 0.
18. "total": The EXACT final net payable grand total printed at the bottom of the bill in ₹. It MUST match the printed paper total.
19. "confidence": A score between 70 and 100 based on the image clarity.

Return ONLY valid JSON matching the schema.`;

    const genaiConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          billNumber: { type: Type.STRING },
          restaurantName: { type: Type.STRING },
          gstin: { type: Type.STRING },
          fssai: { type: Type.STRING },
          table: { type: Type.STRING },
          date: { type: Type.STRING },
          time: { type: Type.STRING },
          dinersCount: { type: Type.INTEGER },
          currency: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                qty: { type: Type.INTEGER },
                rate: { type: Type.NUMBER },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING },
              },
              required: ['name', 'price'],
            },
          },
          subtotal: { type: Type.NUMBER },
          discount: { type: Type.NUMBER },
          discountLabel: { type: Type.STRING },
          cgst: { type: Type.NUMBER },
          sgst: { type: Type.NUMBER },
          taxRate: { type: Type.NUMBER },
          tax: { type: Type.NUMBER },
          serviceCharge: { type: Type.NUMBER },
          roundOff: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
          confidence: { type: Type.NUMBER },
        },
        required: ['billNumber', 'restaurantName', 'items', 'subtotal', 'total'],
      },
    };

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: effectiveMimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: genaiConfig,
      });
    } catch (primaryErr: any) {
      console.warn('Primary model error, retrying with fallback model:', primaryErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: effectiveMimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: genaiConfig,
      });
    }

    let rawText = response.text || '{}';
    // Strip markdown formatting if present
    rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    let parsedJson: any = {};
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsedJson = JSON.parse(match ? match[0] : rawText);
    } catch (parseErr) {
      console.warn('JSON.parse failed on direct text, attempting fallback match:', parseErr);
      parsedJson = JSON.parse(rawText || '{}');
    }
    
    // Ensure unique IDs, line totals, and clean numbers for all items
    if (Array.isArray(parsedJson.items)) {
      parsedJson.items = parsedJson.items.map((item: any, idx: number) => {
        const qty = Number(item.qty) || 1;
        let price = Number(item.price) || 0;
        const rate = typeof item.rate === 'number' ? item.rate : undefined;
        if (rate && rate > 0 && price === rate && qty > 1) {
          price = Math.round(rate * qty * 100) / 100;
        }
        return {
          ...item,
          id: item.id || `item-${Date.now()}-${idx + 1}`,
          qty,
          rate: rate || (qty > 1 ? Math.round((price / qty) * 100) / 100 : price),
          price,
          name: String(item.name || `Dish ${idx + 1}`).trim(),
        };
      });
    }

    const itemsSum = Array.isArray(parsedJson.items)
      ? parsedJson.items.reduce((acc: number, it: any) => acc + (Number(it.price) || 0), 0)
      : 0;

    if (!parsedJson.subtotal || parsedJson.subtotal <= 0) {
      parsedJson.subtotal = itemsSum;
    }

    const discount = typeof parsedJson.discount === 'number' ? parsedJson.discount : 0;
    const cgst = typeof parsedJson.cgst === 'number' ? parsedJson.cgst : 0;
    const sgst = typeof parsedJson.sgst === 'number' ? parsedJson.sgst : 0;
    const tax = typeof parsedJson.tax === 'number' && parsedJson.tax > 0 ? parsedJson.tax : Math.round((cgst + sgst) * 100) / 100;
    const serviceCharge = typeof parsedJson.serviceCharge === 'number' ? parsedJson.serviceCharge : 0;
    const roundOff = typeof parsedJson.roundOff === 'number' ? parsedJson.roundOff : 0;

    const calculatedTotal = Math.round((parsedJson.subtotal - discount + tax + serviceCharge + roundOff) * 100) / 100;
    if (!parsedJson.total || parsedJson.total <= 0) {
      parsedJson.total = calculatedTotal;
    }

    return res.json({ success: true, receipt: parsedJson });
  } catch (error: any) {
    console.error('Error parsing Indian bill with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to parse Indian bill image.',
    });
  }
});

// Endpoint: Conversational Copilot for Indian Bill Splitting
app.post('/api/chat-assign', async (req, res) => {
  try {
    const { message, items, participants, assignments, tipPercent, billNumber } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message command is required.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in environment.',
      });
    }

    const systemInstruction = `You are Tabby AI, an intelligent bill splitting assistant designed specifically for Indian dining and bills (in ₹ INR).
Current Bill Number: "${billNumber || 'PG-48291'}"
Available Items: ${JSON.stringify(items || [])}
Current Friends/Family Diners: ${JSON.stringify(participants || [])}
Current Item Assignments: ${JSON.stringify(assignments || {})}

The user commands you in natural language such as:
- "Dhruv and Aarav had the butter chicken and garlic naans"
- "Pooja and Sneha shared paneer tikka and dal makhani"
- "Split the biryani and cold drinks across everyone at the table"
- "Add Kabir and Meera to dinner"
- "Split the entire bill equally among all 5 of us"
- "Pooja also had a sweet lassi ₹120"
- "Aarav pays 60% of biryani"

Your rules:
1. All amounts are in Indian Rupees (₹).
2. If new family/friends are mentioned (e.g. "Add Rohan", "Meera is joining"), add them to newParticipants with clean Indian names and upiId (e.g. name.toLowerCase() + '@upi').
3. For "Split bill equally" or "everyone share everything": set all items to equal fractions across all participants.
4. For specific dishes: match the dish name to available items. Assign 1.0 (100%) or split 1/N.
5. In assistantReply, provide a crisp, friendly summary referencing dishes, diner names, and ₹ amounts, noting that GST (CGST+SGST) and service charge are shared proportionally.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assistantReply: { type: Type.STRING },
            newParticipants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  color: { type: Type.STRING },
                  upiId: { type: Type.STRING },
                },
                required: ['id', 'name'],
              },
            },
            newItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  qty: { type: Type.INTEGER },
                  price: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                },
                required: ['name', 'price'],
              },
            },
            updatedAssignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemId: { type: Type.STRING },
                  itemName: { type: Type.STRING },
                  shares: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        participantId: { type: Type.STRING },
                        participantName: { type: Type.STRING },
                        fraction: { type: Type.NUMBER },
                      },
                      required: ['fraction'],
                    },
                  },
                },
                required: ['itemId', 'shares'],
              },
            },
            splitMode: { type: Type.STRING }, // "equal" or "itemized"
          },
          required: ['assistantReply'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in chat-assign:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process Indian bill chat command.',
    });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tabby AI Indian Bill Splitter running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
