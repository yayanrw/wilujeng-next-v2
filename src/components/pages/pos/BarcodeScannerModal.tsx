'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { BrowserMultiFormatOneDReader, IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { CameraOff, FlipHorizontal, Lock, ShoppingCart, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { formatIdr } from '@/utils/money';
import { useTranslation } from '@/i18n/useTranslation';

const DEFAULT_SCAN_INTERVAL_MS = 2000;

interface BarcodeScannerModalProps {
  open: boolean;
  onScan: (sku: string) => void;
  onClose: () => void;
  isMobile?: boolean;
  totalQty?: number;
  total?: number;
  onOpenCart?: () => void;
  scanIntervalMs?: number;
}

export function BarcodeScannerModal({
  open,
  onScan,
  onClose,
  isMobile = false,
  totalQty = 0,
  total = 0,
  onOpenCart,
  scanIntervalMs = DEFAULT_SCAN_INTERVAL_MS,
}: BarcodeScannerModalProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatOneDReader | null>(null);
  // tracks last scan timestamp per barcode to enforce per-SKU cooldown
  const scanTimestamps = useRef<Map<string, number>>(new Map());

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback(() => {
    try { controlsRef.current?.stop(); } catch { /* ignore */ }
    controlsRef.current = null;
  }, []);

  const startScanning = useCallback(
    async (deviceId: string | undefined) => {
      if (!videoRef.current) return;
      stopScanning();

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatOneDReader();
      }

      try {
        controlsRef.current = await readerRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              const now = Date.now();
              const lastTime = scanTimestamps.current.get(text) ?? 0;
              if (now - lastTime < scanIntervalMs) return; // still in cooldown
              scanTimestamps.current.set(text, now);
              onScan(text);
              setLastScanned(text);
              setTimeout(() => setLastScanned(null), 1200);
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error('ZXing error:', err);
            }
          },
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
          setError(t.pos.scannerPermissionDenied);
        } else {
          setError(t.pos.scannerNoCamera);
        }
      }
    },
    [onScan, scanIntervalMs, stopScanning, t.pos.scannerNoCamera, t.pos.scannerPermissionDenied],
  );

  useEffect(() => {
    if (!open) return;

    setError(null);
    setLastScanned(null);
    scanTimestamps.current.clear();

    async function init() {
      try {
        const deviceList = await BrowserMultiFormatOneDReader.listVideoInputDevices();
        if (!deviceList.length) {
          setError(t.pos.scannerNoCamera);
          return;
        }
        setDevices(deviceList);

        const backIdx = deviceList.findIndex((d) =>
          /back|rear|environment/i.test(d.label),
        );
        const idx = backIdx >= 0 ? backIdx : 0;
        setActiveIndex(idx);
        await startScanning(deviceList[idx]?.deviceId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
          setError(t.pos.scannerPermissionDenied);
        } else {
          setError(t.pos.scannerNoCamera);
        }
      }
    }

    void init();

    return () => {
      stopScanning();
      readerRef.current = null;
    };
  }, [open, startScanning, stopScanning, t.pos.scannerNoCamera, t.pos.scannerPermissionDenied]);

  async function handleSwitchCamera() {
    if (devices.length < 2) return;
    const next = (activeIndex + 1) % devices.length;
    setActiveIndex(next);
    await startScanning(devices[next]?.deviceId);
  }

  if (!open) return null;

  const scanFeedback = lastScanned ? (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 animate-in fade-in duration-150">
      <span className="text-base">✓</span>
      <span>{t.pos.scannerAdded} — {lastScanned}</span>
    </div>
  ) : (
    <div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
      &nbsp;
    </div>
  );

  const errorScreen = (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      {error?.includes('denied') || error?.includes('ditolak') ? (
        <Lock className="h-12 w-12 text-zinc-400" />
      ) : (
        <CameraOff className="h-12 w-12 text-zinc-400" />
      )}
      <p className="text-sm text-zinc-300 max-w-xs">{error}</p>
      <Button variant="secondary" onClick={onClose} size="sm">
        {t.common.cancel}
      </Button>
    </div>
  );

  const header = (
    <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        aria-label={t.common.cancel}
      >
        <X className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold text-zinc-100">
        {t.pos.scannerTitle}
      </span>
      {devices.length > 1 ? (
        <button
          type="button"
          onClick={() => void handleSwitchCamera()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label={t.pos.scannerSwitchCamera}
          title={t.pos.scannerSwitchCamera}
        >
          <FlipHorizontal className="h-5 w-5" />
        </button>
      ) : (
        <div className="h-8 w-8" />
      )}
    </div>
  );

  const viewport = (
    <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-3/4 max-w-xs aspect-[3/1]">
          <span className="absolute top-0 left-0 h-5 w-5 border-t-2 border-l-2 border-red-400 rounded-tl" />
          <span className="absolute top-0 right-0 h-5 w-5 border-t-2 border-r-2 border-red-400 rounded-tr" />
          <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-red-400 rounded-bl" />
          <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-red-400 rounded-br" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-400/80 shadow-[0_0_6px_2px_rgba(248,113,113,0.5)]" />
        </div>
      </div>
      <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none">
        <span className="text-xs text-white/60 bg-black/40 px-3 py-1 rounded-full">
          {t.pos.scannerHint}
        </span>
      </div>
    </div>
  );

  const mobileCartBar = (
    <div className="shrink-0 px-3 pb-3 pt-1">
      <button
        type="button"
        onClick={() => onOpenCart?.()}
        className="w-full flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl transition-colors active:opacity-80"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-zinc-400" />
          <span className="text-sm font-medium">
            {totalQty} {totalQty === 1 ? t.pos.item : t.pos.items}
          </span>
        </div>
        <span className="text-sm font-semibold tabular-nums">{formatIdr(total)}</span>
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[110] bg-zinc-950 flex flex-col">
        {header}
        {error ? errorScreen : viewport}
        {!error && scanFeedback}
        {mobileCartBar}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-zinc-950 overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {header}
        {error ? (
          errorScreen
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="relative aspect-[4/3] bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-3/4 max-w-xs aspect-[3/1]">
                  <span className="absolute top-0 left-0 h-5 w-5 border-t-2 border-l-2 border-red-400 rounded-tl" />
                  <span className="absolute top-0 right-0 h-5 w-5 border-t-2 border-r-2 border-red-400 rounded-tr" />
                  <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-red-400 rounded-bl" />
                  <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-red-400 rounded-br" />
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-400/80 shadow-[0_0_6px_2px_rgba(248,113,113,0.5)]" />
                </div>
              </div>
              <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                <span className="text-xs text-white/60 bg-black/40 px-3 py-1 rounded-full">
                  {t.pos.scannerHint}
                </span>
              </div>
            </div>
            <div className="border-t border-zinc-800">
              {scanFeedback}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
