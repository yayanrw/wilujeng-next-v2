# Plan: UI Consistency (Action Buttons)

## Summary
Make action buttons consistently visible (no hover-only reveal) across Products, Stock Logs, and Customers tables. Also change the “Pay Debt” action in Customers to an icon-only button for a cleaner, consistent action column.

## Current State Analysis
- Products action column uses an Edit button that is hidden by default via `opacity-0 group-hover:opacity-100` in [ProductsClient.tsx](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/components/pages/ProductsClient.tsx).
- Stock Logs action column uses a View Detail button hidden by default via the same hover-only pattern in [StockClient.tsx](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/components/pages/StockClient.tsx).
- Customers action column shows:
  - A visible text “Pay Debt” button (only when `totalDebt > 0`).
  - An Edit icon button hidden by default via hover-only pattern in [CustomersClient.tsx](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/components/pages/CustomersClient.tsx).

## Proposed Changes

### 1) Always-visible action buttons (remove hover-only)
Update these three files to remove the hover-only visibility classes:
- [ProductsClient.tsx](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/components/pages/ProductsClient.tsx)
  - Change the action button `className` to remove `opacity-0 group-hover:opacity-100`.
  - Keep existing sizing (`h-8 w-8 p-0`) and hover color transitions.
- [StockClient.tsx](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/components/pages/StockClient.tsx)
  - Same as Products: remove hover-only opacity logic for the Eye (view) button in the logs table action column.
- [CustomersClient.tsx](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/components/pages/CustomersClient.tsx)
  - Remove hover-only opacity logic for the Edit (pencil) icon button.

Implementation detail:
- Replace `className="... opacity-0 group-hover:opacity-100 ... focus-visible:opacity-100"` with a stable always-visible class, e.g. `className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"`.
- Preserve `title` and `sr-only` labels for accessibility.

### 2) Customers: “Pay Debt” becomes icon-only
Update [CustomersClient.tsx](file:///Users/yayanrahmatwijaya/Herd/wilujeng-next-v2/src/components/pages/CustomersClient.tsx):
- Replace the current text `Button` labeled `{t.customers.payDebt}` with an icon-only `Button`.
- Keep the visibility rule: only render this button when `c.totalDebt > 0`.
- Use a Lucide icon appropriate for “pay/debt” (e.g., `HandCoins` or `Wallet`) and ensure:
  - Button size matches the other icon button (`h-8 w-8 p-0`).
  - `title={t.customers.payDebt}` and an `sr-only` label exists for screen readers.
  - Preserve existing click handler to open the existing `PayDebtModal`.

Styling recommendation for consistency:
- Use `variant="ghost"` + red-tinted icon color (similar intent to current red-styled text button), e.g. `text-red-600 hover:text-red-700 ...` (exact classes should follow existing app style).

## Assumptions & Decisions
- No functional logic changes: only UI visibility and button appearance changes.
- Maintain existing conditional rendering of Pay Debt (only when customer has `totalDebt > 0`).
- Keep action column layout and alignment the same (right aligned with consistent spacing).

## Verification
- Manual UI checks:
  - Products page: Edit icon is always visible for each row (not only on hover).
  - Stock Logs tab: View (Eye) icon is always visible for each log row.
  - Customers page: Edit icon is always visible; Pay Debt shows as icon-only when debt > 0 and opens the modal.
- Accessibility quick check:
  - Hover tooltips and screen-reader labels exist (`title` and `sr-only` text).
- Quality gates:
  - Run `npm run lint` and `npm run typecheck`.
