import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppModal } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { RockCard } from '@/components/rocks/RockCard';
import { RockForm } from '@/components/forms/RockForm';
import { rockApi } from '@/api/rockApi';
import { useTaxonomy } from '@/context/TaxonomyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import type { RockPayload } from '@/types/api';
import { colors, spacing } from '@/theme';

export default function AdminRocksScreen() {
  const router = useRouter();
  const { types, categories } = useTaxonomy();
  const [search, setSearch] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => (debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    [debouncedSearch],
  );

  const list = usePaginatedList(rockApi.list, { limit: 20, filters });

  useRefreshOnFocus(list.reload);

  const create = async (payload: RockPayload) => {
    const created = await rockApi.create(payload);
    setCreateVisible(false);
    setSuccess(`Creamos la roca “${created.name}”.`);
    await list.reload();
  };

  const header = (
    <View style={styles.header}>
      <AppText variant="body" color={colors.textSecondary}>
        Crea, edita y elimina las fichas del catálogo. Los cambios se reflejan de inmediato en la
        aplicación de los usuarios.
      </AppText>

      {success ? (
        <AlertBanner
          tone="success"
          message={success}
          actionLabel="Cerrar"
          onAction={() => setSuccess(null)}
        />
      ) : null}

      <Button
        title="Nueva roca"
        icon="add"
        onPress={() => {
          setSuccess(null);
          setCreateVisible(true);
        }}
        fullWidth
      />

      <TextField
        placeholder="Buscar por nombre, color, textura…"
        value={search}
        onChangeText={setSearch}
        leftIcon="search-outline"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Buscar rocas en el catálogo"
      />

      {list.error && list.items.length > 0 ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar el catálogo. Se muestran los resultados anteriores."
          actionLabel="Reintentar"
          onAction={() => void list.reload()}
        />
      ) : null}

      <AppText variant="caption" color={colors.textMuted}>
        {list.total} {list.total === 1 ? 'roca en el catálogo' : 'rocas en el catálogo'}
      </AppText>
    </View>
  );

  return (
    <Screen scroll={false} padded={false} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <RockCard
            rock={item}
            onPress={() => router.push(`/admin/rocks/${item.id}`)}
          />
        )}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={list.refreshing}
        onRefresh={() => void list.reload()}
        onEndReached={() => void list.loadMore()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState message="Cargando catálogo…" />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              title="No pudimos cargar el catálogo"
              onRetry={() => void list.reload()}
            />
          ) : (
            <EmptyState
              icon="diamond-outline"
              title={search.trim() ? 'Sin coincidencias' : 'Catálogo vacío'}
              message={
                search.trim()
                  ? `No encontramos rocas que coincidan con “${search.trim()}”.`
                  : 'Crea la primera ficha para que los usuarios puedan reconocerla.'
              }
              actionLabel={search.trim() ? 'Limpiar búsqueda' : 'Nueva roca'}
              onAction={
                search.trim()
                  ? () => setSearch('')
                  : () => {
                      setSuccess(null);
                      setCreateVisible(true);
                    }
              }
              tone="primary"
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
              Toca una roca para editar su ficha completa.
            </AppText>
          ) : undefined
        }
      />

      <AppModal
        visible={createVisible}
        title="Nueva roca"
        subtitle="Completa la ficha del catálogo"
        onClose={() => setCreateVisible(false)}
      >
        <RockForm
          types={types}
          categories={categories}
          onSubmit={create}
          submitLabel="Crear roca"
        />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  header: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md },
  separator: { height: spacing.sm },
  footer: { marginTop: spacing.lg },
});
