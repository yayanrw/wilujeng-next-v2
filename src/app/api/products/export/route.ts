import * as xlsx from 'xlsx';
import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { brands, categories, products } from '@/db/schema';
import { requireApiRole } from '@/server/api-helpers';

export async function GET(req: Request) {
  const { response } = await requireApiRole(req, 'admin');
  if (response) return response;

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      basePrice: products.basePrice,
      buyPrice: products.buyPrice,
      stock: products.stock,
      minStockThreshold: products.minStockThreshold,
      categoryName: categories.name,
      brandName: brands.name,
      isActive: products.isActive,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.isDeleted, false))
    .orderBy(asc(products.name));

  const sheetData = rows.map((r) => ({
    id: r.id,
    SKU: r.sku,
    Name: r.name,
    Category: r.categoryName ?? '',
    Brand: r.brandName ?? '',
    'Base Price': r.basePrice,
    'Buy Price': r.buyPrice,
    Stock: r.stock,
    'Min Stock': r.minStockThreshold,
  }));

  // If no products exist yet, add an example row (with empty id to indicate new product)
  if (sheetData.length === 0) {
    sheetData.push({
      id: '',
      SKU: 'PROD-001',
      Name: 'Example Product',
      Category: 'Beverages',
      Brand: 'Brand A',
      'Base Price': 15000,
      'Buy Price': 10000,
      Stock: 100,
      'Min Stock': 10,
    });
  }

  const ws = xlsx.utils.json_to_sheet(sheetData);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 38 }, // id
    { wch: 14 }, // SKU
    { wch: 28 }, // Name
    { wch: 16 }, // Category
    { wch: 16 }, // Brand
    { wch: 12 }, // Base Price
    { wch: 12 }, // Buy Price
    { wch: 8 },  // Stock
    { wch: 10 }, // Min Stock
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Products');

  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="products_export.xlsx"',
    },
  });
}
