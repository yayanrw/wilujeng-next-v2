import { useEffect } from 'react';
import { useCatalogMetaStore } from '@/stores/catalogMetaStore';

export function useCatalogMeta() {
  const categories = useCatalogMetaStore((s) => s.categories);
  const brands = useCatalogMetaStore((s) => s.brands);
  const suppliers = useCatalogMetaStore((s) => s.suppliers);
  const loaded = useCatalogMetaStore((s) => s.loaded);
  const setCategories = useCatalogMetaStore((s) => s.setCategories);
  const setBrands = useCatalogMetaStore((s) => s.setBrands);
  const setSuppliers = useCatalogMetaStore((s) => s.setSuppliers);
  const setLoaded = useCatalogMetaStore((s) => s.setLoaded);

  useEffect(() => {
    if (loaded) return;
    let active = true;
    Promise.all([
      fetch('/api/categories?all=1').then((r) => r.json()),
      fetch('/api/brands?all=1').then((r) => r.json()),
      fetch('/api/suppliers').then((r) => r.json()),
    ])
      .then(([cats, brs, sups]) => {
        if (!active) return;
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(brs)) setBrands(brs);
        if (Array.isArray(sups)) setSuppliers(sups);
        setLoaded(true);
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [loaded, setCategories, setBrands, setSuppliers, setLoaded]);

  return { categories, brands, suppliers, loaded };
}
