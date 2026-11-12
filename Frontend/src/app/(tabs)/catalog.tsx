import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { RockCard } from '@/components/rocks/RockCard';
import { rockApi } from '@/api/rockApi';
import { useTaxonomy } from '@/context/TaxonomyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { colors, spacing } from '@/theme';

export default function CatalogScreen() {
  const { types, categories } = useTaxonomy();
  const [search, setSearch] = useState('');
  const [typeId, setTypeId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => ({
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(typeId ? { typeId } : {}),
      ...(categoryId ? { categoryId } : {}),
    }),
    [categoryId, debouncedSearch, typeId],
  );

  const list = usePaginatedList(rockApi.list, { limit: 20, filters });

  useRefreshOnFocus(list.reload);

  const hasFilters = Boolean(search || typeId || categoryId);

  const clearFilters = () => {
    setSearch('');
    setTypeId(undefined);
    setCategoryId(undefined);
  };

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        title="Catálogo de rocas"
        subtitle={
          list.total > 0
            ? `${list.total} ${list.total === 1 ? 'roca disponible' : 'rocas disponibles'}`
            : 'Explora las fichas geológicas'
        }
      />

      <TextField
        placeholder="Buscar por nombre, color, textura…"
        value={search}
        onChangeText={setSearch}
        leftIcon="search-outline"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Buscar rocas en el catálogo"
      />

      <View style={styles.filterBlock}>
        <AppText variant="label" color={colors.textSecondary}>
          Tipo
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Todos" selected={!typeId} onPress={() => setTypeId(undefined)} />
          {types.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              selected={typeId === item.id}
              onPress={() => setTypeId(typeId === item.id ? undefined : item.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterBlock}>
        <AppText variant="label" color={colors.textSecondary}>
          Categoría
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Todas" selected={!categoryId} onPress={() => setCategoryId(undefined)} />
          {categories.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              selected={categoryId === item.id}
              onPress={() => setCategoryId(categoryId === item.id ? undefined : item.id)}
            />
          ))}
        </ScrollView>
      </View>

      {hasFilters ? (
        <View style={styles.filterSummary}>
          <View style={styles.filterSummaryText}>
            <Ionicons name="funnel-outline" size={16} color={colors.textMuted} />
            <AppText variant="small" color={colors.textMuted}>
              {list.loading ? 'Buscando…' : `${list.total} resultados con los filtros actuales`}
            </AppText>
          </View>
          <Button title="Limpiar" variant="ghost" size="sm" onPress={clearFilters} />
        </View>
      ) : null}

      {list.error && list.items.length > 0 ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar la lista. Se muestran los resultados anteriores."
          actionLabel="Reintentar"
          onAction={() => void list.reload()}
        />
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} padded={false} edges={['top', 'left', 'right']}>
      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <RockCard rock={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onEndReached={() => void list.loadMore()}
        onEndReachedThreshold={0.4}
        refreshing={list.refreshing}
        onRefresh={() => void list.reload()}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState message="Cargando catálogo…" />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={() => void list.reload()} />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No encontramos rocas"
              message={
                hasFilters
                  ? 'Prueba con otro texto o quita algunos filtros.'
                  : 'Todavía no hay rocas publicadas en el catálogo.'
              }
              actionLabel={hasFilters ? 'Limpiar filtros' : undefined}
              onAction={hasFilters ? clearFilters : undefined}
            />
          )
        }
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : list.hasMore && list.items.length > 0 ? (
            <Button
              title="Cargar más rocas"
              variant="outline"
              onPress={() => void list.loadMore()}
              style={styles.footer}
              fullWidth
            />
          ) : list.items.length > 0 ? (
            <AppText variant="caption" color={colors.textMuted} align="center" style={styles.footer}>
              Mostrando las {list.total} rocas del catálogo
            </AppText>
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: { gap: spacing.md, paddingBottom: spacing.md },
  filterBlock: { gap: spacing.xs },
  chips: { gap: spacing.xs, paddingRight: spacing.lg },
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  filterSummaryText: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  separator: { height: spacing.sm },
  footer: { marginTop: spacing.lg, marginBottom: spacing.lg },
});
