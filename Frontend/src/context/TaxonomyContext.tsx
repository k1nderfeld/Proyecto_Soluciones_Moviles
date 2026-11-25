import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { taxonomyApi } from '@/api/taxonomyApi';
import type { CategoryItem, TypeItem } from '@/types/api';

interface TaxonomyContextValue {
  types: TypeItem[];
  categories: CategoryItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  typeName: (id?: number | null) => string;
  categoryName: (id?: number | null) => string;
}

const TaxonomyContext = createContext<TaxonomyContextValue | null>(null);

export const TaxonomyProvider = ({ children }: { children: React.ReactNode }) => {
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [nextTypes, nextCategories] = await Promise.all([
        taxonomyApi.allTypes(),
        taxonomyApi.allCategories(),
      ]);
      setTypes(nextTypes);
      setCategories(nextCategories);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const typeMap = useMemo(() => new Map(types.map((item) => [item.id, item.name])), [types]);
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  const value = useMemo<TaxonomyContextValue>(
    () => ({
      types,
      categories,
      loading,
      refresh,
      typeName: (id) => (id ? typeMap.get(id) ?? `Tipo #${id}` : 'Sin tipo'),
      categoryName: (id) => (id ? categoryMap.get(id) ?? `Categoría #${id}` : 'Sin categoría'),
    }),
    [categories, categoryMap, loading, refresh, typeMap, types],
  );

  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>;
};

export const useTaxonomy = (): TaxonomyContextValue => {
  const context = useContext(TaxonomyContext);
  if (!context) throw new Error('useTaxonomy debe usarse dentro de TaxonomyProvider');
  return context;
};
