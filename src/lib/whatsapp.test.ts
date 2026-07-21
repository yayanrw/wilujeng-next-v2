import { describe, expect, it } from 'vitest';
import { normalizePhone, buildReceiptMessage } from '@/lib/whatsapp';

describe('normalizePhone', () => {
  it('keeps an already-normalized 62-prefixed number', () => {
    expect(normalizePhone('628123456789')).toBe('628123456789');
  });

  it('converts a leading 0 to 62', () => {
    expect(normalizePhone('08123456789')).toBe('628123456789');
  });

  it('prefixes a bare 8-leading number with 62', () => {
    expect(normalizePhone('8123456789')).toBe('628123456789');
  });

  it('strips punctuation and the + sign', () => {
    expect(normalizePhone('+62 812-3456-789')).toBe('628123456789');
  });

  it('rejects a too-short number', () => {
    expect(normalizePhone('0812')).toBeNull();
  });

  it('rejects empty and nullish input', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe('buildReceiptMessage', () => {
  const basePrintable = {
    storeName: 'Toko Wilujeng',
    receiptFooter: 'Terima kasih sudah berbelanja 🙏',
    items: [
      { name: 'Indomie Goreng', qty: 2, unitPrice: 3500, subtotal: 7000, isFree: false },
    ],
  };

  it('shows Tunai/Kembali and no Sisa hutang line for a fully paid cash sale', () => {
    const msg = buildReceiptMessage({
      printable: basePrintable,
      txId: 'a3f9c1d2-0000-0000-0000-000000000000',
      createdAt: new Date('2026-07-21T07:32:00Z'),
      paymentMethod: 'cash',
      totalAmount: 7000,
      amountReceived: 10000,
      change: 3000,
      outstandingDebt: 0,
      remainingDebt: null,
    });
    expect(msg).toContain('Kembali');
    expect(msg).not.toContain('Sisa hutang');
    expect(msg).toContain('#A3F9C1D2');
  });

  it('shows Sisa hutang and total debt for a partial/debt sale', () => {
    const msg = buildReceiptMessage({
      printable: basePrintable,
      txId: 'a3f9c1d2-0000-0000-0000-000000000000',
      createdAt: new Date('2026-07-21T07:32:00Z'),
      paymentMethod: 'debt',
      totalAmount: 7000,
      amountReceived: 2000,
      change: 0,
      outstandingDebt: 5000,
      remainingDebt: 45000,
    });
    expect(msg).toContain('Sisa hutang');
    expect(msg).toContain('Total hutang Anda: Rp 45.000');
    expect(msg).not.toContain('Kembali');
  });
});
