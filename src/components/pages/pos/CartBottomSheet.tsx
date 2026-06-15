'use client';

import { BottomDrawer } from '@/components/ui/BottomDrawer';
import { useTranslation } from '@/i18n/useTranslation';
import { CartPanel } from './CartPanel';

export function CartBottomSheet({
  open,
  total,
  onCheckout,
  onHold,
  onClose,
}: {
  open: boolean;
  total: number;
  onCheckout: () => void;
  onHold?: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <BottomDrawer open={open} onClose={onClose} title={t.pos.cart}>
      <CartPanel total={total} onCheckout={onCheckout} onHold={onHold} onClose={onClose} />
    </BottomDrawer>
  );
}
