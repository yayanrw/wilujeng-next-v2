# WhatsApp Receipt on Checkout

> On execute, copy this file to `docs/plans/whatsapp-receipt-on-checkout.md` first.

## Context

`src/lib/whatsapp.ts` exists but has **zero call sites** — `sendWhatsappMessage(phone, message)` posts to a local WA gateway and is dead code waiting for a caller. Meanwhile customers already carry a `phone` column (`src/db/schema.ts:138`) that is collected at customer creation but never used for anything.

The goal: when a cashier checks out a sale for a known customer, the receipt is delivered to that customer's WhatsApp automatically — no extra step, no separate screen. Paper/thermal receipt printing stays exactly as it is; WhatsApp is additive and must never be able to fail a sale.

Three decisions were settled up front:
- **Full text receipt, no link.** `/receipt/[id]` is behind `requireSession()`, so a link would dump customers on a login page. Building a public tokenised receipt route is real work for no current need.
- **Template hardcoded** in `src/lib/whatsapp.ts`. Wording changes roughly never; a `settings` column plus admin UI plus placeholder engine is speculative.
- **Checkbox defaults ON** when the selected customer has a phone. A default-off checkbox never gets ticked and the feature dies unused.

## Approach

Client sends a `sendWhatsapp` boolean with the checkout POST. The server — which already has the full customer row and a fully-built `printable` receipt object in scope — formats the message and fires it via Next's `after()` so the HTTP response is not delayed by the gateway. Failures are logged and swallowed.

---

### 1. `src/lib/whatsapp.ts` — normalise, format, fix auth

**Fix the existing auth bug.** The current split-then-rejoin is redundant and breaks if the password contains `:`:

```ts
// replace
const [user, pass] = WA_BASIC_AUTH.split(':');
Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
// with
Authorization: `Basic ${Buffer.from(WA_BASIC_AUTH).toString('base64')}`,
```

**Add `normalizePhone(raw: string | null): string | null`.** This is a trust boundary — sending a receipt to a wrong number leaks one customer's purchases to a stranger. Customer phones are free-text (`src/app/api/customers/route.ts:71` is `z.string().max(80)` with no format check), typically `08123456789`.

- Strip everything non-digit.
- `62…` → keep as-is. `0…` → replace leading `0` with `62`. `8…` → prefix `62`.
- Return `null` if the result is shorter than 10 or longer than 15 digits, or does not start with `62`.
- Callers must treat `null` as "do not send" — never fall through to sending the raw string.

**Add `buildReceiptMessage(input): string`.** Input shape mirrors what the checkout route already has on hand:

```ts
{
  printable: { storeName, storeAddress, storePhone, receiptFooter,
               items: { name, qty, unitPrice, subtotal, isFree }[] },
  txId: string,
  createdAt: Date,
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'debt',
  totalAmount: number,
  amountReceived: number,
  change: number,
  outstandingDebt: number,
  remainingDebt: number | null,   // null for walk-in / no debt context
}
```

**Critical formatting note:** WhatsApp renders normal text in a proportional font, so space-padded column alignment will look broken. The item/total block must be wrapped in a triple-backtick monospace block; only the store name line and the closing line sit outside it.

Layout:

```
*Toko Wilujeng*
Nota #A3F9 · 21 Jul 2026 14:32

<monospace block>
2× Indomie Goreng      7.000
1× Teh Botol           5.000
   Gratis 1× Teh Botol
─────────────────────
Total            Rp 12.000
Tunai            Rp 20.000
Kembali          Rp  8.000
</monospace block>

Terima kasih sudah berbelanja 🙏
```

Rules:
- `#A3F9` is `txId.slice(0, 8).toUpperCase()`.
- Date formatted in WIB (`Asia/Jakarta`) — reuse the same timezone approach as the dashboard/reports date handling rather than raw `toLocaleString()`.
- Free lines (`isFree: true`) render as an indented `Gratis` line under the paid line, not as a `Rp 0` row.
- Payment method label comes from a small local map (`cash` → `Tunai`, `qris` → `QRIS`, `transfer` → `Transfer`, `debt` → `Hutang`).
- Money via the existing `formatIdr` in `src/utils/money.ts` where possible; strip the `Rp` prefix inside aligned columns and put it in the label column.
- `receiptFooter` from branding replaces the hardcoded thank-you when present.
- Only `*bold*` the store name and, in the debt case, the outstanding line. No other markup.
- No `Yth. Bapak/Ibu` salutation — names are frequently typo'd in the DB and warung customers don't expect formality.

**Debt/partial variant** — same function, different tail block. When `outstandingDebt > 0`, replace the Tunai/Kembali rows with:

```
Total            Rp 12.000
Bayar            Rp  5.000
*Sisa hutang     Rp  7.000*
```

and, when `remainingDebt` is non-null, append one line after the block: `Total hutang Anda: Rp 45.000`.

Keep this as branching inside one function — not two templates.

---

### 2. `src/app/api/pos/checkout/route.ts` — wire the send

**Schema** (line 26–33): add `sendWhatsapp: z.boolean().optional().default(false)`.

**Return `debtPay` from the transaction closure.** Currently `debtPay` is a `let` scoped inside the callback (~line 207) and the closure returns `{ id, lineItems, totalAmount, payment }` (line 325). Add `debtPay` to that return so remaining debt can be computed outside.

**Compute remaining debt.** `customerRow.totalDebt` at line 59–62 is the *pre-transaction* value:

```
remainingDebt = customerRow.totalDebt + payment.outstandingDebt - debtPay
```

**Fire after the response.** Right before the existing `return json({...})` at line 336, using the `printable` object that is already built there (do not rebuild it — extract it to a `const printable = {...}` and reference it in both the JSON response and the message builder):

```ts
import { after } from 'next/server';

const waPhone = parsed.data.sendWhatsapp ? normalizePhone(customerRow?.phone ?? null) : null;
if (waPhone) {
  after(async () => {
    const ok = await sendWhatsappMessage(waPhone, buildReceiptMessage({ ... }));
    if (!ok) console.error(`WA receipt failed for tx ${txResult.id}`);
  });
}
```

`after()` is stable in Next 16.2.2 (`package.json:29`) and is currently unused in the codebase — this is its first use. It runs the callback once the response has been sent, so gateway latency never reaches the cashier. `sendWhatsappMessage` already swallows its own errors and returns `false`, so nothing here can throw into the request path.

Guard order matters: no `sendWhatsapp` flag → skip; no customer → skip; unnormalisable phone → skip. All silent.

---

### 3. `src/components/pages/PosClient.tsx` — lift the state

- Add `const [sendWhatsapp, setSendWhatsapp] = useState(true);`
- Include `sendWhatsapp` in the `doCheckout()` POST body (~line 320).
- Reset to `true` in the post-success block alongside the other resets (~line 355) and in `closeCheckout()` (~line 277) — matching how `debtPaymentAmount` / `debtPaymentNote` are already handled.
- Pass `sendWhatsapp` / `onSendWhatsappChange` down to `<CheckoutModal>` (~line 571), following the existing optional-prop convention used by `debtPaymentAmount`.

---

### 4. `src/components/pages/pos/CheckoutModal.tsx` — the toggle

Add `sendWhatsapp?: boolean` and `onSendWhatsappChange?: (v: boolean) => void` to the inline props type (lines 87–121).

The modal already imports `useCustomerStore` (line 10) and already does exactly this lookup for `CustomerDebtPayButton` (lines 30–31), so the phone is one line away:

```ts
const phone = customers.find((c) => c.id === customerId)?.phone ?? null;
```

**Placement:** inside the Customer section, immediately after `<CustomerDebtPayButton>` (~line 269). It is only meaningful when a customer is selected, so it must not appear in the walk-in case.

**Three states:**

| Condition | Render |
|---|---|
| No `customerId` | nothing |
| Customer selected, `phone` null/empty | one muted line: `t.pos.waNoPhone` ("Nomor WA belum diisi") — no toggle, no link |
| Customer selected, phone present | toggle switch, label `t.pos.waSendReceipt` + masked number |

**Mask the number** in the label (`0812••••3456`) rather than printing it in full — the modal is on a counter-facing screen.

Copy the toggle-switch markup from `src/components/pages/products/ProductForm.tsx:~635-666` (the `role="switch"` / `aria-checked` pattern with the `⌥` kbd badge). Do not add a `Checkbox` component to `src/components/ui/` for one use site.

**Keyboard:** wire `Alt+7` in the existing `e.altKey` block (lines 145–172), which currently handles `1`–`6`.

**Enter-confirm gotcha:** the modal confirms the sale on plain `Enter` whenever focus is inside `modalContentRef` and not the customer input (lines 161–168). A focused toggle button would therefore submit the sale on `Enter` instead of flipping. Exclude the toggle ref the same way the customer input is excluded.

---

### 5. i18n — `src/i18n/en.json` and `src/i18n/id.json`

Add under `pos`: `waSendReceipt`, `waNoPhone`, `shortcutSendWhatsapp`.

| key | en | id |
|---|---|---|
| `waSendReceipt` | Send receipt to WhatsApp | Kirim nota ke WhatsApp |
| `waNoPhone` | Customer has no WhatsApp number | Pelanggan belum punya nomor WA |
| `shortcutSendWhatsapp` | Toggle WhatsApp receipt | Nyalakan/matikan nota WA |

Add `shortcutSendWhatsapp` to the "In Checkout" shortcut list in `PosClient.tsx` (~line 528) as `['⌥7', t.pos.shortcutSendWhatsapp]`.

Note: the two files are currently out of sync — `pos.initialDebt` and `pos.initialDebtDesc` exist only in `id.json`. Check which file the `t` type is derived from before adding, and add to both regardless.

---

### 6. `docs/prd/05-pos.md`

Per the project's PRD update rule: document the checkout `sendWhatsapp` request field, the conditional toggle behaviour, the three UI states, and the fire-and-forget delivery guarantee (receipt send never blocks or fails a sale).

---

## Verification

1. **Phone normalisation is the one piece with real branching — it gets the check.** Add `src/lib/whatsapp.test.ts` next to the existing `src/lib/auth.test.ts` / `login.test.ts`, asserting: `08123456789` → `628123456789`; `628123456789` → unchanged; `8123456789` → `628123456789`; `+62 812-3456-789` → digits only; `0812` → `null`; `''` → `null`; `null` → `null`. Also one `buildReceiptMessage` snapshot-ish assertion that a debt sale contains "Sisa hutang" and a cash sale does not.
2. **Without a gateway running:** leave `WA_API_URL` pointing nowhere, check out a sale with the toggle on. Sale must complete normally, receipt prints, one `WA receipt failed for tx …` line in the server log, no error toast.
3. **With the gateway:** set real `WA_API_URL` / `WA_BASIC_AUTH`, use a customer whose phone is your own number. Verify the message arrives and — importantly — that the monospace block actually aligns on a real phone, not just in the terminal.
4. **Walk-in sale:** no customer selected → no toggle rendered, no send attempted.
5. **Customer without phone:** toggle absent, muted "no number" line shown, sale completes.
6. **Debt sale:** partial payment to a customer with existing debt → message shows `Sisa hutang` and a correct `Total hutang Anda` matching the customer's new `totalDebt` in the DB.
7. **Latency:** confirm checkout response time is unchanged with the toggle on versus off — that is the whole point of `after()`.
8. `npx tsc --noEmit` and the existing test suite.

## Deliberately skipped

- **`waSentAt` column on `transactions`** — add when someone actually asks "why didn't the customer get it?". One column, not a log table.
- **Rate limiting / queue** — a personal WA gateway can get banned by blasting, but a receipt-per-sale is naturally throttled by human pace. Needed only if bulk debt reminders get built later.
- **Hiding the toggle when `WA_BASIC_AUTH` is unset** — requires plumbing a server flag to the client for a config mistake that shows up immediately in the logs.
- **Settings-editable template / public receipt route** — both explicitly deferred above; each is a clean follow-up if asked for.
