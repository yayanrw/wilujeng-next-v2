import { STORE_TZ } from '@/utils/timezone';
import { formatIdr } from '@/utils/money';
import type { PaymentMethod } from '@/utils/checkout';

const WA_API_URL = process.env.WA_API_URL || 'http://localhost:3000';
const WA_BASIC_AUTH = process.env.WA_BASIC_AUTH ?? '';

/**
 * Sends a WhatsApp message via the local gateway's /send/message endpoint.
 */
export async function sendWhatsappMessage(
  phone: string,
  message: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${WA_API_URL}/send/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(WA_BASIC_AUTH).toString('base64')}`,
      },
      body: JSON.stringify({ phone, message }),
    });
    return res.ok;
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${phone}:`, error);
    return false;
  }
}

/**
 * Normalizes a free-text Indonesian phone number to 62-prefixed digits.
 * Returns null when the input can't be normalized into something sendable —
 * callers must treat null as "do not send", never fall back to the raw input.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  if (!digits.startsWith('62')) return null;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
  debt: 'Hutang',
};

function money(amount: number): string {
  return formatIdr(amount).replace('Rp', '').trim();
}

function formatWibDateTime(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: STORE_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function padRow(label: string, amount: string): string {
  const width = 24;
  const gap = Math.max(1, width - label.length - amount.length);
  return `${label}${' '.repeat(gap)}${amount}`;
}

type ReceiptItem = {
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  isFree: boolean;
};

export function buildReceiptMessage(input: {
  printable: {
    storeName: string;
    receiptFooter: string;
    items: ReceiptItem[];
  };
  txId: string;
  createdAt: Date;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  amountReceived: number;
  change: number;
  outstandingDebt: number;
  remainingDebt: number | null;
}): string {
  const { printable, txId, createdAt, paymentMethod, totalAmount, amountReceived, change, outstandingDebt, remainingDebt } = input;

  const lines: string[] = [];
  for (const item of printable.items) {
    if (item.isFree) {
      lines.push(`   Gratis ${item.qty}× ${item.name}`);
    } else {
      lines.push(padRow(`${item.qty}× ${item.name}`, money(item.subtotal)));
    }
  }
  lines.push('─'.repeat(21));

  if (outstandingDebt > 0) {
    lines.push(padRow('Total', money(totalAmount)));
    lines.push(padRow('Bayar', money(amountReceived)));
    lines.push(`*${padRow('Sisa hutang', money(outstandingDebt))}*`);
  } else {
    lines.push(padRow('Total', money(totalAmount)));
    lines.push(padRow(PAYMENT_METHOD_LABEL[paymentMethod], money(amountReceived)));
    lines.push(padRow('Kembali', money(change)));
  }

  const parts = [
    `*${printable.storeName}*`,
    `Nota #${txId.slice(0, 8).toUpperCase()} · ${formatWibDateTime(createdAt)}`,
    '',
    '```',
    lines.join('\n'),
    '```',
  ];

  if (remainingDebt !== null && remainingDebt > 0) {
    parts.push('', `Total hutang Anda: Rp ${money(remainingDebt)}`);
  }

  parts.push('', printable.receiptFooter || 'Terima kasih sudah berbelanja 🙏');

  return parts.join('\n');
}
