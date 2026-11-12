import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { adminApi } from '@/api/adminApi';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { formatDateTime, formatNumber } from '@/utils/format';
import { colors, radii, spacing } from '@/theme';

const toPositive = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export default function AdminFeedbackScreen() {
  const [userIdInput, setUserIdInput] = useState('');
  const [analysisIdInput, setAnalysisIdInput] = useState('');
  const [applied, setApplied] = useState<{ userId?: number; analysisId?: number }>({});
  const [filterError, setFilterError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      ...(applied.userId ? { userId: applied.userId } : {}),
      ...(applied.analysisId ? { analysisId: applied.analysisId } : {}),
    }),
    [applied],
  );

  const list = usePaginatedList(adminApi.feedback, { limit: 20, filters });

  useRefreshOnFocus(list.reload);

  const applyFilters = () => {
    const hasUser = Boolean(userIdInput.trim());
    const hasAnalysis = Boolean(analysisIdInput.trim());
    const userId = toPositive(userIdInput);
    const analysisId = toPositive(analysisIdInput);
    if ((hasUser && !userId) || (hasAnalysis && !analysisId)) {
      setFilterError('Los identificadores deben ser números enteros positivos.');
      return;
    }
    setFilterError(null);
    setApplied({ userId, analysisId });
  };

  const clearFilters = () => {
    setUserIdInput('');
    setAnalysisIdInput('');
    setApplied({});
    setFilterError(null);
  };

  const correctCount = list.items.filter((item) => item.isCorrect).length;

  const header = (
    <View style={styles.header}>
      <AppText variant="body" color={colors.textSecondary}>
        Evaluaciones enviadas por los usuarios sobre los resultados del reconocimiento. Esta
        información permite detectar confusiones frecuentes del modelo.
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
            label="ID de análisis"
            placeholder="Ej: 42"
            value={analysisIdInput}
            onChangeText={setAnalysisIdInput}
            keyboardType="number-pad"
            containerStyle={styles.flex}
            accessibilityLabel="Filtrar por identificador de análisis"
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
          message="No pudimos actualizar la retroalimentación. Se muestran los resultados anteriores."
          actionLabel="Reintentar"
          onAction={() => void list.reload()}
        />
      ) : null}

      <AppText variant="caption" color={colors.textMuted}>
        {formatNumber(list.total)}{' '}
        {list.total === 1 ? 'evaluación registrada' : 'evaluaciones registradas'}
        {list.items.length > 0 ? ` · ${correctCount} correctas en esta página` : ''}
      </AppText>
    </View>
  );

  return (
    <Screen scroll={false} padded={false} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.icon,
                  item.isCorrect ? styles.iconCorrect : styles.iconIncorrect,
                ]}
              >
                <Ionicons
                  name={item.isCorrect ? 'checkmark' : 'close'}
                  size={20}
                  color={item.isCorrect ? colors.success : colors.danger}
                />
              </View>
              <View style={styles.headerTexts}>
                <AppText variant="bodyStrong">
                  {item.isCorrect ? 'Resultado correcto' : 'Resultado incorrecto'}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {formatDateTime(item.createdAt)}
                </AppText>
              </View>
              <Badge
                label={`Análisis #${item.analysisId}`}
                tone="neutral"
                icon="scan-outline"
              />
            </View>

            {item.comment ? (
              <View style={styles.comment}>
                <AppText variant="small" color={colors.textSecondary}>
                  “{item.comment}”
                </AppText>
              </View>
            ) : (
              <AppText variant="caption" color={colors.textMuted}>
                El usuario no dejó comentarios.
              </AppText>
            )}

            <View style={styles.meta}>
              <Badge label={`Usuario #${item.userId}`} tone="info" icon="person-outline" />
              {item.analysis?.rockId ? (
                <Badge label={`Roca #${item.analysis.rockId}`} tone="primary" icon="diamond-outline" />
              ) : null}
              {item.analysis?.confidence != null ? (
                <Badge
                  label={`Confianza ${item.analysis.confidence}%`}
                  tone={item.analysis.confidence >= 70 ? 'success' : 'warning'}
                />
              ) : null}
            </View>
          </Card>
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
            <LoadingState message="Cargando retroalimentación…" />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              title="No pudimos cargar la retroalimentación"
              onRetry={() => void list.reload()}
            />
          ) : (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Sin evaluaciones"
              message={
                applied.userId || applied.analysisId
                  ? 'No hay evaluaciones para los filtros seleccionados.'
                  : 'Cuando los usuarios evalúen un reconocimiento, aparecerá aquí.'
              }
              actionLabel={applied.userId || applied.analysisId ? 'Limpiar filtros' : undefined}
              onAction={applied.userId || applied.analysisId ? clearFilters : undefined}
            />
          )
        }
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : list.hasMore && list.items.length > 0 ? (
            <Button
              title="Cargar más evaluaciones"
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
  card: { gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCorrect: { backgroundColor: colors.successSoft },
  iconIncorrect: { backgroundColor: colors.dangerSoft },
  headerTexts: { flex: 1, gap: 2 },
  comment: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  separator: { height: spacing.sm },
  footer: { marginTop: spacing.lg },
});
