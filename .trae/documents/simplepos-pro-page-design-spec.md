# Page Design Specification (Desktop-first)

## Global Styles (all pages)
- Layout system: CSS Grid for app shell (sidebar + main), Flexbox for toolbars/forms; spacing scale 4/8/12/16/24.
- Theme: light default; background `#F8FAFC`; surfaces `#FFFFFF`; border `#E2E8F0`; accent `#2563EB`; danger `#DC2626`.
- Typography: base 14–16px; H1 24, H2 18, H3 16; tabular numbers for money.
- Buttons (shadcn/ui): primary (accent), secondary (neutral), destructive; hover darken 5–8%; focus ring visible.
- Links: accent with underline on hover.
- Responsive: desktop-first; collapse sidebar at <=1024px; POS uses two-column layout that stacks at <=768px.

## 1) Login
- Meta: title “Sign in • SimplePOS Pro”; description “Secure sign-in for cashier and admin.”
- Structure: centered card (max-w 420) over neutral background.
- Components: store icon + name header; email/username input; password input; primary “Sign in”; error alert.

## 2) App Shell (used by all authenticated pages)
- Layout: grid `sidebar 260px | main 1fr`; sidebar collapsible to icon-only; state persisted.
- Top bar: page title left; user menu right (role label + logout).
- Sidebar: logo (store icon/name), nav items filtered by role.

## 3) Dashboard
- Meta: title “Dashboard • SimplePOS Pro”.
- Structure: KPI cards row + chart section + tables.
- KPI cards: Today Sales, Low Stock Count, Total Receivables.
- Chart: weekly/monthly transactions (bar/line).
- Table/card: “Top Supplier (last 30 days)” sorted by purchase value.

## 4) Cashier (POS)
- Meta: title “POS • SimplePOS Pro”.
- Structure (desktop): 2 columns (left product discovery, right cart/checkout). Sticky cart summary.
- Product discovery: search input auto-focused; category filter; list/card toggle; results list with stock badge.
- Cart panel: item rows (name, qty stepper, unit price, subtotal, remove); totals footer.
- Checkout modal/dialog: payment method selector; amount received input; quick cash buttons; computed change/outstanding debt; customer selector + “Add customer” inline for debt cases.
- Post-transaction: success toast; “Print receipt” secondary action; “Done” resets.
- Print layout: dedicated printable receipt component styled with `@media print` for 58mm.

## 5) Products & Inventory
- Meta: title “Products • SimplePOS Pro”.
- Structure: table-first with right-side (or modal) editor.
- Table: SKU, name, category, brand, base price, stock, threshold; search + filters.
- Editor (Admin): inputs for core fields; category/brand combobox with type-to-create; tier pricing repeater rows (min qty, price) with validation.

## 6) Stock Management
- Meta: title “Stock • SimplePOS Pro”.
- Structure: tabs: Stock In / Stock Out / Stock Opname / Logs.
- Stock In: product picker, qty, unit buy price, supplier type-to-create, optional expiry date, note.
- Stock Out: product picker, qty, note.
- Opname: product picker, new qty, note.
- Logs: filter by product/type/date; show prev/next stock.

## 7) Customers
- Meta: title “Customers • SimplePOS Pro”.
- Structure: split view (list left, detail right) on desktop.
- List: search by name/phone; badges for debt.
- Detail: profile fields; points + total debt summary; transactions table; points history; outstanding debt list.

## 8) Reports (Admin)
- Meta: title “Reports • SimplePOS Pro”.
- Structure: report selector tabs + filter bar (date range/supplier).
- Reports: Daily Sales table; Low/Zero Stock list; Receivables list; Profit & Loss summary; Supplier aggregation.

## 9) Settings (Admin)
- Meta: title “Settings • SimplePOS Pro”.
- Structure: sections with cards.
- Branding: store name; curated Lucide icon picker (stores icon name string); address/phone; receipt footer preview.
- User management: users table (name, email, role); create/edit role; disable/remove as needed.
