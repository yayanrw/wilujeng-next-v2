import { useEffect } from 'react';
import { useCatalogMetaStore } from '@/stores/catalogMetaStore';

export function useCatalogMeta() {
  const categories = useCatalogMetaStore((s) => s.categories);
  const brands = useCatalogMetaStore((s) => s.brands);
  const loaded = useCatalogMetaStore((s) => s.loaded);
  const setCategories = useCatalogMetaStore((s) => s.setCategories);
  const setBrands = useCatalogMetaStore((s) => s.setBrands);
  const setLoaded = useCatalogMetaStore((s) => s.setLoaded);

  useEffect(() => {
    if (loaded) return;
    let active = true;
    Promise.all([
      fetch('/api/categories?all=1').then((r) => r.json()),
      fetch('/api/brands?all=1').then((r) => r.json()),
    ])
      .then(([cats, brs]) => {
        if (!active) return;
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(brs)) setBrands(brs);
        setLoaded(true);
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [loaded, setCategories, setBrands, setLoaded]);

  return { categories, brands };
}
