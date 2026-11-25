import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppModal } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { AchievementForm } from '@/components/forms/AchievementForm';
import { achievementApi } from '@/api/achievementApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getErrorMessage } from '@/utils/errors';
import { formatCondition } from '@/utils/format';
import type { Achievement, AchievementPayload } from '@/types/api';
import { colors, radii, spacing } from '@/theme';

export default function AdminAchievementsScreen() {
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => (debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    [debouncedSearch],
  );

  const list = usePaginatedList(achievementApi.list, { limit: 20, filters });

  useRefreshOnFocus(list.reload);

  const openCreate = () => {
    setEditing(null);
    setSuccess(null);
    setModalVisible(true);
  };

  const openEdit = (achievement: Achievement) => {
    setEditing(achievement);
    setSuccess(null);
    setModalVisible(true);
  };

  const save = async (payload: AchievementPayload) => {
    if (editing) {
      const updated = await achievementApi.update(editing.id, payload);
      setSuccess(`Guardamos el logro “${updated.name}”.`);
    } else {
      const created = await achievementApi.create(payload);
      setSuccess(`Creamos el logro “${created.name}”.`);
    }
    setModalVisible(false);
    await list.reload();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setPageError(null);
    try {
      await achievementApi.remove(deleteTarget.id);
      setSuccess(`Eliminamos el logro “${deleteTarget.name}”.`);
      setDeleteTarget(null);
      await list.reload();
    } catch (error) {
      setDeleteTarget(null);
      setPageError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <AppText variant="body" color={colors.textSecondary}>
        Los logros se desbloquean automáticamente al cumplir su condición. Puedes crear logros sin
        condición automática, pero no se otorgarán solos.
      </AppText>

      {success ? (
        <AlertBanner tone="success" message={success} actionLabel="Cerrar" onAction={() => setSuccess(null)} />
      ) : null}
      {pageError ? (
        <AlertBanner tone="danger" message={pageError} actionLabel="Cerrar" onAction={() => setPageError(null)} />
      ) : null}

      <Button title="Nuevo logro" icon="add" onPress={openCreate} fullWidth />

      <TextField
        placeholder="Buscar por nombre, slug o descripción…"
        value={search}
        onChangeText={setSearch}
        leftIcon="search-outline"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Buscar logros"
      />

      {list.error && list.items.length > 0 ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar los logros. Se muestran los resultados anteriores."
          actionLabel="Reintentar"
          onAction={() => void list.reload()}
        />
      ) : null}

      <AppText variant="caption" color={colors.textMuted}>
        {list.total} {list.total === 1 ? 'logro configurado' : 'logros configurados'}
      </AppText>
    </View>
  );

  return (
    <Screen scroll={false} padded={false} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={list.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar logro ${item.name}`}
              onPress={() => openEdit(item)}
              style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.rowIcon,
                  item.isActive ? styles.rowIconActive : styles.rowIconInactive,
                ]}
              >
                <Ionicons
                  name={item.isActive ? 'trophy-outline' : 'pause-circle-outline'}
                  size={20}
                  color={item.isActive ? colors.accentText : colors.textMuted}
                />
              </View>
              <View style={styles.rowTexts}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {item.name}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                  {item.slug}
                </AppText>
                <AppText variant="small" color={colors.textSecondary} numberOfLines={2}>
                  {item.description}
                </AppText>
                <View style={styles.badges}>
                  <Badge
                    label={item.isActive ? 'Activo' : 'Inactivo'}
                    tone={item.isActive ? 'success' : 'neutral'}
                  />
                  <Badge label={`+${item.experience} XP`} tone="warning" />
                  <Badge
                    label={formatCondition(item.conditionType, item.conditionValue)}
                    tone="info"
                  />
                </View>
              </View>
            </Pressable>
            <View style={styles.rowActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Eliminar logro ${item.name}`}
                onPress={() => setDeleteTarget(item)}
                hitSlop={4}
                style={({ pressed }) => [styles.iconButton, styles.deleteButton, pressed && styles.pressed]}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
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
            <LoadingState message="Cargando logros…" />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              title="No pudimos cargar los logros"
              onRetry={() => void list.reload()}
            />
          ) : (
            <EmptyState
              icon="trophy-outline"
              title={search.trim() ? 'Sin coincidencias' : 'Sin logros configurados'}
              message={
                search.trim()
                  ? `No encontramos logros que coincidan con “${search.trim()}”.`
                  : 'Crea el primer logro para motivar a los usuarios a completar su colección.'
              }
              actionLabel={search.trim() ? 'Limpiar búsqueda' : 'Nuevo logro'}
              onAction={search.trim() ? () => setSearch('') : openCreate}
              tone="primary"
            />
          )
        }
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : list.hasMore && list.items.length > 0 ? (
            <Button
              title="Cargar más logros"
              variant="outline"
              onPress={() => void list.loadMore()}
              style={styles.footer}
              fullWidth
            />
          ) : undefined
        }
      />

      <AppModal
        visible={modalVisible}
        title={editing ? 'Editar logro' : 'Nuevo logro'}
        subtitle={editing ? `“${editing.name}”` : 'Define la recompensa y su condición'}
        onClose={() => setModalVisible(false)}
      >
        {modalVisible ? (
          <AchievementForm
            achievement={editing}
            onSubmit={save}
            submitLabel={editing ? 'Guardar cambios' : 'Crear logro'}
          />
        ) : null}
      </AppModal>

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="¿Eliminar este logro?"
        message={`Se eliminará “${deleteTarget?.name ?? ''}” y las desbloqueos asociados dejarán de mostrarse. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar logro"
        destructive
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  header: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'stretch', padding: spacing.md, gap: spacing.sm },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconActive: { backgroundColor: colors.accentSoft },
  rowIconInactive: { backgroundColor: colors.surfaceAlt },
  rowTexts: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  rowActions: { justifyContent: 'center' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  deleteButton: { backgroundColor: colors.dangerSoft },
  pressed: { opacity: 0.7 },
  separator: { height: spacing.sm },
  footer: { marginTop: spacing.lg },
});
