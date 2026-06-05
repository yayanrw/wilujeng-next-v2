# Improvement Suggestions

_Recorded: 2026-06-05_

## High-impact UX (quick wins)

- **Keyboard shortcut to open POS / focus SKU** — retail staff rarely use a mouse. `F2` to jump to the barcode/SKU field in POS is standard in retail software.
- **ProductForm keyboard flow** — SKU → Name is already wired. Name → Buy Price is not. Completes the full keyboard entry flow consistent with the category/brand improvements.
- **Toast positioning on mobile** — verify success/error toasts are visible on small screens, especially when the on-screen keyboard is open.

## Reliability / Offline

- **PWA / service worker** — POS apps need to survive a brief WiFi drop. A service worker that queues transactions locally and syncs when reconnected would be a significant differentiator. `next-pwa` integrates cleanly with Next.js.

## Feature Gaps

- **Low-stock alert widget on dashboard** — `minStockThreshold` already exists on every product. A widget listing items below threshold saves the owner from discovering stockouts at the cashier. Zero schema change needed.
- **Split payment** — cash + transfer in one transaction is common in Indonesian retail. POS currently accepts one payment method per transaction.
- **Quick stock-in from product detail** — instead of navigating Stock → IN, a `+Stock` shortcut button directly on the product edit panel.

## Technical Hygiene

- **Fix `onBlur` setTimeout in `AutocompleteInput`** — the 200ms hack can misfire on slow devices. The correct fix is calling `preventDefault` on `mousedown` of dropdown items so blur never fires before the click registers.
- **Redis cache warm-up on startup** — if the POS catalog cache is cold, the first cashier gets a slow experience. A startup hook or route handler that pre-warms the catalog cache would eliminate this.

## Priority Order

1. Low-stock dashboard widget — uses existing data, zero schema change
2. Keyboard flow completion in `ProductForm` — ~5 min fix
3. Split payment — directly affects daily revenue handling
4. PWA offline support — largest effort, highest reliability value
