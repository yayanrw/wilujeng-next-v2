# Camera Barcode Scanner — Feature Spec

## Overview

Add camera-based barcode scanning to the POS page. Scans 1D barcodes only. Adds products to cart using the same logic as keyboard scan. Camera stays open for multi-scan sessions. Closes automatically after checkout completes.

**Library:** `@zxing/browser` (`BrowserBarcodeReader`) — cross-browser, 1D barcode only, works on Safari/iOS.

---

## Files

| File | Action |
|---|---|
| `package.json` | Add `@zxing/browser` |
| `src/components/pages/pos/BarcodeScannerModal.tsx` | **New** — camera UI + ZXing scanning logic |
| `src/components/pages/PosClient.tsx` | Add `scannerOpen` state + `handleBarcodeScan()` |
| `src/components/pages/pos/SearchPanel.tsx` | Add camera icon button beside search input |
| `src/i18n/en.json` + `id.json` | New i18n keys for scanner UI |

---

## Data Flow

```
User clicks camera button
  → setScannerOpen(true)
  → BarcodeScannerModal opens
  → ZXing starts decoding video stream
  → On decode: onScan(sku) fires
  → PosClient.handleBarcodeScan(sku)
      → lookup SKU in catalogStore.products
      → check stock in catalogStore.stocks
      → posStore.addProduct(product, 1)
      → showToast("ProductName +1")
  → Camera stays open, loop continues
  → On checkout success: setScannerOpen(false)
```

---

## `handleBarcodeScan` (PosClient.tsx)

Mirrors the existing Enter-key handler in SearchPanel. Reads from the same Zustand stores.

```ts
const products   = useCatalogStore((s) => s.products);
const stocks     = useCatalogStore((s) => s.stocks);
const addProduct = usePosStore((s) => s.addProduct);

function handleBarcodeScan(sku: string) {
  const product = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
  if (!product) { showToast(t.pos.productNotFound); return; }
  const stock = stocks[product.id] ?? 0;
  if (stock === 0)  { showToast(t.pos.outOfStock); return; }
  addProduct({ ...product, stock }, 1);
  showToast(`${product.name} +1`);
}
```

---

## `BarcodeScannerModal.tsx`

### Props

```ts
{
  open: boolean;
  onScan: (sku: string) => void;
  onClose: () => void;
  isMobile: boolean;    // true → fullscreen, false → centered popup
  totalQty: number;     // for mobile sticky cart bar
  total: number;
  onOpenCart: () => void;
}
```

### Internal State

| State | Type | Purpose |
|---|---|---|
| `devices` | `MediaDeviceInfo[]` | Available video input devices |
| `activeDeviceIndex` | `number` | Current camera (default: back camera) |
| `lastScanned` | `string \| null` | Shown briefly after each scan (800ms) |
| `error` | `string \| null` | Permission denied or no camera message |

### ZXing Scanning Logic

```ts
const reader = new BrowserBarcodeReader();

// Enumerate cameras, prefer back camera
const deviceList = await BrowserBarcodeReader.listVideoInputDevices();
const backCam = deviceList.find(d => /back|rear|environment/i.test(d.label))
  ?? deviceList[0];

// Continuous decode loop
reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
  if (result) {
    onScan(result.getText());
    setLastScanned(result.getText());
    setTimeout(() => setLastScanned(null), 800);
  }
  // NotFoundException (no barcode in frame) → silently ignore, keep scanning
});

// Cleanup on unmount or camera switch
return () => reader.reset();
```

### Camera Switch

- Flip button only rendered if `devices.length > 1`
- On click: `reader.reset()` → increment `activeDeviceIndex` (cycle) → restart

---

## UI Layout

### Mobile — Fullscreen (`isMobile === true`)

```
┌─ fixed inset-0 z-[110] bg-black flex flex-col ──────────────┐
│                                                              │
│  ┌─ Header (shrink-0) ───────────────────────────────────┐  │
│  │  [X]          Scan Barcode          [flip camera icon] │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Camera viewport (flex-1) ────────────────────────────┐  │
│  │                                                        │  │
│  │  <video autoPlay playsInline muted>                    │  │
│  │         (fills full width)                             │  │
│  │                                                        │  │
│  │     ┌────────────────────────────────┐                 │  │
│  │     │                                │                 │  │
│  │     │   ─────── red line ──────────  │  ← targeting   │  │
│  │     │                                │     overlay    │  │
│  │     └────────────────────────────────┘                 │  │
│  │                                                        │  │
│  │   "Point camera at barcode"  (hint text, bottom)       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Scan feedback (shrink-0) ────────────────────────────┐  │
│  │  ✓ Added — SKU-XXXXXX           (fades after 800ms)   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Sticky cart bar (lg:hidden) ─────────────────────────┐  │
│  │  🛒 3 items                           Rp 45.000       │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Desktop — Centered Popup (`isMobile === false`)

```
┌─ fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm ────────┐
│                  grid place-items-center                     │
│                                                              │
│         ┌─ max-w-md rounded-2xl bg-zinc-950 ─────────┐      │
│         │  Scan Barcode      [flip]    [X]            │      │
│         │  ─────────────────────────────────────────  │      │
│         │                                             │      │
│         │  <video> aspect-ratio 4/3  rounded-xl       │      │
│         │  targeting overlay (red line + brackets)    │      │
│         │  "Point camera at barcode"                  │      │
│         │                                             │      │
│         │  ─────────────────────────────────────────  │      │
│         │  ✓ Added — SKU-XXXXXX                       │      │
│         └─────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Error States

| Condition | UI |
|---|---|
| Permission denied | Lock icon + "Camera access denied. Enable in browser settings." |
| No camera found | CameraOff icon + "No camera found on this device." |
| NotFoundException (no barcode in frame) | Silent — continue scanning, no toast |

---

## `SearchPanel.tsx` Changes

Add `onCameraClick: () => void` to props. Insert camera button inside the search input wrapper after the X clear button:

```tsx
// New prop
onCameraClick: () => void;

// Button placement: absolute, right of input, left of X button
<button
  type="button"
  onClick={onCameraClick}
  className="absolute right-8 top-1/2 -translate-y-1/2
             text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300
             transition-colors"
  title={t.pos.scanWithCamera}
  aria-label={t.pos.scanWithCamera}
>
  <Camera className="h-4 w-4" />
</button>
```

Adjust input right padding from `pr-8` → `pr-16` to fit both buttons.

---

## `PosClient.tsx` Changes

```ts
// 1. New state
const [scannerOpen, setScannerOpen] = useState(false);

// 2. New store reads
const products   = useCatalogStore((s) => s.products);
const stocks     = useCatalogStore((s) => s.stocks);
const addProduct = usePosStore((s) => s.addProduct);

// 3. isMobile detection
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const mq = window.matchMedia('(max-width: 1023px)');
  setIsMobile(mq.matches);
  mq.addEventListener('change', (e) => setIsMobile(e.matches));
}, []);

// 4. handleBarcodeScan — see Data Flow section above

// 5. doCheckout success path — add:
setScannerOpen(false);

// 6. JSX — pass to SearchPanel:
<SearchPanel onCameraClick={() => setScannerOpen(true)} ... />

// 7. JSX — render scanner:
<BarcodeScannerModal
  open={scannerOpen}
  onScan={handleBarcodeScan}
  onClose={() => setScannerOpen(false)}
  isMobile={isMobile}
  totalQty={totalQty}
  total={total}
  onOpenCart={() => setCartOpen(true)}
/>
```

---

## i18n Keys

Add under `"pos"` in both `en.json` and `id.json`:

| Key | English | Indonesian |
|---|---|---|
| `scanWithCamera` | Scan with camera | Scan dengan kamera |
| `scannerTitle` | Scan Barcode | Scan Barcode |
| `scannerHint` | Point camera at barcode | Arahkan kamera ke barcode |
| `scannerPermissionDenied` | Camera access denied. Enable in browser settings. | Akses kamera ditolak. Aktifkan di pengaturan browser. |
| `scannerNoCamera` | No camera found on this device. | Tidak ada kamera yang ditemukan. |
| `scannerSwitchCamera` | Switch camera | Ganti kamera |
| `scannerAdded` | Added | Ditambahkan |
| `productNotFound` | Product not found | Produk tidak ditemukan |
| `outOfStock` | Out of stock | Stok habis |

---

## What Is NOT Changed

- Keyboard barcode scan (Enter key on search input)
- Cart, checkout, stock polling
- Desktop 2-column POS layout
- CartBottomSheet (reused as-is for mobile sticky bar inside scanner)

---

## Verification Checklist

- [ ] Camera button visible beside search input
- [ ] Click → browser permission prompt on first use
- [ ] Mobile: fullscreen black overlay, sticky cart bar at bottom
- [ ] Desktop: centered popup with blurred backdrop
- [ ] Valid scan → toast "ProductName +1", product in cart, camera stays open
- [ ] Unknown SKU → toast "Product not found", camera stays open
- [ ] Out-of-stock scan → toast "Out of stock", camera stays open
- [ ] 2+ cameras → flip button visible; switches on click; defaults to back camera
- [ ] Checkout completes → scanner closes automatically
- [ ] X button / backdrop → scanner closes
