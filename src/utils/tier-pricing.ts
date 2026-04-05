export type Tier = { minQty: number; price: number };

export function getTierPrice(params: {
  basePrice: number;
  qty: number;
  tiers: Tier[];
}): number {
  const { basePrice, qty, tiers } = params;

  let bestMin = -1;
  let bestPrice = basePrice;
  for (const tier of tiers) {
    if (qty >= tier.minQty && tier.minQty > bestMin) {
      bestMin = tier.minQty;
      bestPrice = tier.price;
    }
  }
  return bestPrice;
}

