import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { roleApi, userApi } from '@/api/adminApi';
import { useApiResource } from '@/hooks/useApiResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { formatDate } from '@/utils/format';
import { colors, radii, spacing } from '@/theme';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState<number | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);

  const filters = useMemo(
    () => (debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    [debouncedSearch],
  );

  const list = usePaginatedList(userApi.list, { limit: 20, filters });
  const roles = useApiResource(() => roleApi.list(), []);

  useRefreshOnFocus(list.reload);

  const roleMap = useMemo(
    () => new Map((roles.data ?? []).map((role) => [role.id, role.name])),
    [roles.data],
  );

  const items = useMemo(
    () => (roleId ? list.items.filter((user) => user.roleId === roleId) : list.items),
    [list.items, roleId],
  );

  const header = (
    <View style={styles.header}>
      <AppText variant="body" color={colors.textSecondary}>
        Consulta las cuentas registradas, su rol y estado. Los usuarios se crean desde el registro
        público; aquí puedes asignar roles y bloquear cuentas.
      </AppText>

      <TextField
        placeholder="Buscar por nombre o correo…"
        value={search}
        onChangeText={setSearch}
        leftIcon="search-outline"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Buscar usuarios"
      />

      <View style={styles.filterBlock}>
        <AppText variant="label" color={colors.textSecondary}>
          Filtrar por rol
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="Todos" selected={!roleId} onPress={() => setRoleId(undefined)} />
          {(roles.data ?? []).map((role) => (
            <Chip
              key={role.id}
              label={role.name}
              selected={roleId === role.id}
              onPress={() => setRoleId(roleId === role.id ? undefined : role.id)}
            />
          ))}
        </ScrollView>
      </View>

      {roles.error ? (
        <AlertBanner
          tone="warning"
          message="No pudimos cargar la lista de roles. Los usuarios se muestran sin nombre de rol."
          actionLabel="Reintentar"
          onAction={() => void roles.reload()}
        />
      ) : null}

      {list.error && list.items.length > 0 ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar la lista. Se muestran los resultados anteriores."
          actionLabel="Reintentar"
          onAction={() => void list.reload()}
        />
      ) : null}

      <AppText variant="caption" color={colors.textMuted}>
        {list.total} {list.total === 1 ? 'usuario registrado' : 'usuarios registrados'}
        {roleId && roles.data ? ` · ${items.length} en esta página con el rol seleccionado` : ''}
      </AppText>
    </View>
  );

  return (
    <Screen scroll={false} padded={false} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver y editar a ${item.userName}`}
            onPress={() => router.push(`/admin/users/${item.id}`)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Card style={styles.row}>
              <Avatar name={item.userName} size={46} tone={item.status === 'active' ? 'primary' : 'accent'} />
              <View style={styles.rowTexts}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {item.userName}
                </AppText>
                <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
                  {item.email}
                </AppText>
                <View style={styles.badges}>
                  <Badge
                    label={roleMap.get(item.roleId) ?? `Rol #${item.roleId}`}
                    tone="primary"
                    icon="shield-outline"
                  />
                  <Badge
                    label={item.status === 'active' ? 'Activo' : 'Bloqueado'}
                    tone={item.status === 'active' ? 'success' : 'danger'}
                  />
                  <Badge label={`Desde ${formatDate(item.createdAt)}`} tone="neutral" />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Card>
          </Pressable>
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
            <LoadingState message="Cargando usuarios…" />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              title="No pudimos cargar los usuarios"
              onRetry={() => void list.reload()}
            />
          ) : (
            <EmptyState
              icon="people-outline"
              title="Sin usuarios"
              message={
                search.trim() || roleId
                  ? 'Prueba con otro texto o quita el filtro de rol.'
                  : 'Todavía no hay cuentas registradas en el sistema.'
              }
              actionLabel={search.trim() || roleId ? 'Limpiar filtros' : undefined}
              onAction={
                search.trim() || roleId
                  ? () => {
                      setSearch('');
                      setRoleId(undefined);
                    }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : list.hasMore && list.items.length > 0 ? (
            <Button
              title="Cargar más usuarios"
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
  filterBlock: { gap: spacing.xs },
  chips: { gap: spacing.xs, paddingRight: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowTexts: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  pressed: { opacity: 0.82 },
  separator: { height: spacing.sm },
  footer: { marginTop: spacing.lg },
  empty: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
