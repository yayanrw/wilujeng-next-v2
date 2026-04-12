# UI/UX Enhancement Plan

This document outlines the specific UI/UX updates required to support the backend flow enhancements we recently completed, aligning the frontend components with the new database schemas and API endpoints.

## 1. Checkout Modal (POS)
Allow cashiers to add notes when processing inline debt payments, as supported by the new backend schema.

**Files to modify:**
- `src/components/pages/pos/CheckoutModal.tsx`:
  - Add a new input field for `debtPaymentNote` inside the `CustomerDebtPayButton` component.
  - Update the `CheckoutModal` props to accept `debtPaymentNote` and `onDebtPaymentNoteChange`.
- `src/components/pages/PosClient.tsx`:
  - Add state for `debtPaymentNote`.
  - Pass the state to `CheckoutModal` and include it in the `POST /api/pos/checkout` request body.
  - Clear the note state after a successful checkout.

## 2. Pay Debt Modal (Customers)
Allow adding payment notes when paying debt from the Customers page.

**Files to modify:**
- `src/components/pages/customers/PayDebtModal.tsx`:
  - Add a text input or textarea for `note` below the payment method dropdown.
  - Update the `onSubmit` callback signature to include the `note` parameter.
- `src/components/pages/CustomersClient.tsx`:
  - Update the `PayDebtModal`'s `onSubmit` handler to send the `note` in the `POST /api/customers/[id]/pay-debt` request payload.

## 3. Stock Out / Return Flow (Stock)
Implement the new "Return" flow directly inside the Stock Management page. Based on user feedback, the Transaction ID input will be an autocomplete dropdown showing past transactions along with their dates.

**Files to modify / create:**
- **Create Autocomplete Component:** `src/components/shared/TransactionPicker.tsx`
  - A component similar to `CustomerPicker`, fetching recent transactions and displaying the Transaction ID + Date as the label. It can hit the existing `/api/reports/sales` endpoint or a new one if necessary to fetch past transactions.
- `src/components/pages/StockClient.tsx`:
  - Add a "Type" selector in the "Out" tab to choose between `Damage/Loss (Out)` and `Customer Return (Return)`.
  - If `Return` is selected, display:
    - `TransactionPicker` (Autocomplete to reference the original sale)
    - `Return Reason` (Text Input)
  - Update the `submit` function for the `out` tab to include `type`, `transactionId`, and `returnReason` in the `POST /api/stock/out` payload.

## Open Questions Resolved
- **"Print Retry" / "Print Past Receipt":** Excluded from this phase.
- **Transaction ID Input:** Determined to be an **autocomplete dropdown** referencing past transactions, displaying the date alongside the ID.
