import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { AnalysisRow } from '@/components/activity/AnalysisRow';
import { adminApi } from '@/api/adminApi';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { formatNumber } from '@/utils/format';
import { colors, spacing } from '@/theme';

const toPositive = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export default function AdminRecognitionsScreen() {
  const router = useRouter();
  const [userIdInput, setUserIdInput] = useState('');
  const [rockIdInput, setRockIdInput] = useState('');
  const [applied, setApplied] = useState<{ userId?: number; rockId?: number }>({});
  const [filterError, setFilterError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      ...(applied.userId ? { userId: applied.userId } : {}),
      ...(applied.rockId ? { rockId: applied.rockId } : {}),
    }),
    [applied],
  );

  const list = usePaginatedList(adminApi.recognitions, { limit: 20, filters });

  useRefreshOnFocus(list.reload);

  const applyFilters = () => {
    const hasUser = Boolean(userIdInput.trim());
    const hasRock = Boolean(rockIdInput.trim());
    const userId = toPositive(userIdInput);
    const rockId = toPositive(rockIdInput);
    if ((hasUser && !userId) || (hasRock && !rockId)) {
      setFilterError('Los identificadores deben ser números enteros positivos.');
      return;
    }
    setFilterError(null);
    setApplied({ userId, rockId });
  };

  const clearFilters = () => {
    setUserIdInput('');
    setRockIdInput('');
    setApplied({});
    setFilterError(null);
  };

  const header = (
    <View style={styles.header}>
      <AppText variant="body" color={colors.textSecondary}>
        Historial global de reconocimientos realizados por usuarios e invitados. Usa los filtros
        para revisar la actividad de una cuenta o de una roca concreta.
      </AppText>

      <Card tone="alt" style={styles.filters}>
        <AppText variant="label" color={colors.textSecondary}>
          Filtros
        </AppText>
        <View style={styles.filterRow}>
          <TextField
            label="ID de usuario"
            placeholder="Ej: 3"
            value={userIdInput}
            onChangeText={setUserIdInput}
            keyboardType="number-pad"
            containerStyle={styles.flex}
            accessibilityLabel="Filtrar por identificador de usuario"
          />
          <TextField
            label="ID de roca"
            placeholder="Ej: 12"
            value={rockIdInput}
            onChangeText={setRockIdInput}
            keyboardType="number-pad"
            containerStyle={styles.flex}
            accessibilityLabel="Filtrar por identificador de roca"
          />
        </View>
        {filterError ? <AlertBanner tone="danger" message={filterError} /> : null}
        <View style={styles.filterActions}>
          <Button
            title="Aplicar filtros"
            icon="funnel-outline"
            onPress={applyFilters}
            style={styles.flex}
          />
          <Button
            title="Limpiar"
            variant="outline"
            onPress={clearFilters}
            style={styles.flex}
          />
        </View>
      </Card>

      {list.error && list.items.length > 0 ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar el historial. Se muestran los resultados anteriores."
          actionLabel="Reintentar"
          onAction={() => void list.reload()}
        />
      ) : null}

      <AppText variant="caption" color={colors.textMuted}>
        {formatNumber(list.total)}{' '}
        {list.total === 1 ? 'reconocimiento encontrado' : 'reconocimientos encontrados'}
      </AppText>
    </View>
  );

  return (
    <Screen scroll={false} padded={false} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AnalysisRow
            analysis={item}
            meta={
              item.userId
                ? `Usuario #${item.userId}`
                : `Invitado${item.guestSessionId ? ` #${item.guestSessionId}` : ''}`
            }
            onPress={() => router.push(`/catalog/${item.rockId}`)}
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
            <LoadingState message="Cargando reconocimientos…" />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              title="No pudimos cargar los reconocimientos"
              onRetry={() => void list.reload()}
            />
          ) : (
            <EmptyState
              icon="scan-outline"
              title="Sin reconocimientos"
              message={
                applied.userId || applied.rockId
                  ? 'No hay resultados para los filtros seleccionados.'
                  : 'Todavía no se han realizado reconocimientos en el sistema.'
              }
              actionLabel={applied.userId || applied.rockId ? 'Limpiar filtros' : undefined}
              onAction={applied.userId || applied.rockId ? clearFilters : undefined}
            />
          )
        }
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : list.hasMore && list.items.length > 0 ? (
            <Button
              title="Cargar más reconocimientos"
              variant="outline"
              onPress={() => void list.loadMore()}
              style={styles.footer}
              fullWidth
            />
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  header: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md },
  filters: { gap: spacing.md, borderColor: colors.border },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterActions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  separator: { height: spacing.sm },
  footer: { marginTop: spacing.lg },
});
