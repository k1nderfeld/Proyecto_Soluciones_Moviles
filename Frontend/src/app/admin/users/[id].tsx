import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { InfoRow } from '@/components/ui/InfoRow';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { adminApi, roleApi, userApi } from '@/api/adminApi';
import { useAuth } from '@/context/AuthContext';
import { useApiResource } from '@/hooks/useApiResource';
import { getErrorMessage } from '@/utils/errors';
import { formatDate, formatDateTime, pluralize } from '@/utils/format';
import { colors, radii, spacing } from '@/theme';

const BLOCKED_ROLE = 'Usuario no autenticado';

export default function AdminUserDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const userId = Number(rawId);
  const validId = Number.isInteger(userId) && userId > 0;

  const userResource = useApiResource(() => userApi.get(userId), [userId], { enabled: validId });
  const roles = useApiResource(() => roleApi.list(), []);
  const collection = useApiResource(() => adminApi.userCollection(userId), [userId], {
    enabled: validId,
  });
  const achievements = useApiResource(() => adminApi.userAchievements(userId), [userId], {
    enabled: validId,
  });

  const [pendingRoleId, setPendingRoleId] = useState<number | null>(null);
  const [roleConfirm, setRoleConfirm] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const target = userResource.data;
  const selectedRoleId = pendingRoleId ?? target?.roleId ?? null;
  const isSelf = Boolean(target && currentUser && target.id === currentUser.id);

  const assignableRoles = useMemo(
    () => (roles.data ?? []).filter((role) => role.name !== BLOCKED_ROLE),
    [roles.data],
  );

  const roleName = useMemo(() => {
    const map = new Map((roles.data ?? []).map((role) => [role.id, role.name]));
    return (id?: number) => (id ? map.get(id) ?? `Rol #${id}` : 'Sin rol');
  }, [roles.data]);

  const nextRole = selectedRoleId ? roleName(selectedRoleId) : '—';
  const roleChanged = Boolean(target && selectedRoleId && selectedRoleId !== target.roleId);
  const blocking = target?.status === 'active';

  const applyUpdate = async (payload: { roleId?: number; status?: 'active' | 'blocked' }) => {
    if (!target) return;
    setSaving(true);
    setActionError(null);
    setSuccess(null);
    try {
      await adminApi.updateUser(target.id, payload);
      await userResource.reload();
      setPendingRoleId(null);
      setSuccess('Usuario actualizado correctamente.');
      setRoleConfirm(false);
      setStatusConfirm(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
      setRoleConfirm(false);
      setStatusConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  if (!validId) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          title="Usuario no válido"
          message="El identificador del enlace no es válido."
          actionLabel="Volver a usuarios"
          onAction={() => router.replace('/admin/users')}
          tone="danger"
        />
      </Screen>
    );
  }

  if (userResource.loading && !userResource.data) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <LoadingState message="Cargando usuario…" />
      </Screen>
    );
  }

  if (userResource.error || !target) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ErrorState
          error={userResource.error ?? new Error('El usuario no existe o fue eliminado.')}
          title="No pudimos cargar este usuario"
          onRetry={() => void userResource.reload()}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      {success ? (
        <AlertBanner tone="success" message={success} actionLabel="Cerrar" onAction={() => setSuccess(null)} />
      ) : null}
      {actionError ? (
        <AlertBanner tone="danger" message={actionError} actionLabel="Cerrar" onAction={() => setActionError(null)} />
      ) : null}
      {roles.error ? (
        <AlertBanner
          tone="warning"
          message="No pudimos cargar los roles disponibles."
          actionLabel="Reintentar"
          onAction={() => void roles.reload()}
        />
      ) : null}

      <Card style={styles.identityCard}>
        <Avatar
          name={target.userName}
          size={64}
          tone={target.status === 'active' ? 'primary' : 'accent'}
        />
        <View style={styles.identityTexts}>
          <AppText variant="title" numberOfLines={2}>
            {target.userName}
          </AppText>
          <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
            {target.email}
          </AppText>
          <View style={styles.badges}>
            <Badge label={roleName(target.roleId)} tone="primary" icon="shield-outline" />
            <Badge
              label={target.status === 'active' ? 'Activo' : 'Bloqueado'}
              tone={target.status === 'active' ? 'success' : 'danger'}
              icon={target.status === 'active' ? 'checkmark-circle-outline' : 'lock-closed-outline'}
            />
            {isSelf ? <Badge label="Tu cuenta" tone="info" icon="person-circle-outline" /> : null}
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="heading">Información</AppText>
        <View>
          <InfoRow label="ID" value={target.id} />
          <InfoRow label="Usuario" value={target.userName} />
          <InfoRow label="Correo" value={target.email} />
          <InfoRow label="Teléfono" value={target.phone || 'No registrado'} />
          <InfoRow label="Rol actual" value={roleName(target.roleId)} />
          <InfoRow label="Estado" value={target.status === 'active' ? 'Activo' : 'Bloqueado'} />
          <InfoRow label="Creado" value={formatDate(target.createdAt)} />
          <InfoRow label="Actualizado" value={formatDateTime(target.updatedAt)} last />
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="heading">Rol del usuario</AppText>
        <AppText variant="small" color={colors.textSecondary}>
          Cambia el nivel de acceso de la cuenta. Los invitados usan sesiones temporales y no
          cuentan con un rol asignable.
        </AppText>
        <View style={styles.chips}>
          {assignableRoles.map((role) => (
            <Chip
              key={role.id}
              label={role.name}
              selected={selectedRoleId === role.id}
              onPress={() => setPendingRoleId(role.id)}
            />
          ))}
        </View>
        {roles.loading && !roles.data ? (
          <LoadingState compact message="Cargando roles…" />
        ) : null}
        {isSelf ? (
          <AppText variant="caption" color={colors.textMuted}>
            No puedes cambiar tu propio rol desde el panel.
          </AppText>
        ) : null}
        <Button
          title="Guardar rol"
          icon="shield-checkmark-outline"
          onPress={() => setRoleConfirm(true)}
          disabled={!roleChanged || isSelf}
          fullWidth
        />
      </Card>

      <Card style={styles.section}>
        <AppText variant="heading">Estado de la cuenta</AppText>
        <AppText variant="small" color={colors.textSecondary}>
          {blocking
            ? 'Al bloquear la cuenta, el usuario no podrá iniciar sesión ni usar la API hasta que la reactives.'
            : 'La cuenta está bloqueada. Reactívala para permitir que el usuario vuelva a iniciar sesión.'}
        </AppText>
        {isSelf ? (
          <AlertBanner
            tone="info"
            message="No puedes bloquear tu propia cuenta desde el panel."
          />
        ) : null}
        <Button
          title={blocking ? 'Bloquear cuenta' : 'Reactivar cuenta'}
          icon={blocking ? 'lock-closed-outline' : 'lock-open-outline'}
          variant={blocking ? 'danger' : 'primary'}
          onPress={() => setStatusConfirm(true)}
          disabled={isSelf}
          fullWidth
        />
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Colección del usuario"
          subtitle={
            collection.data
              ? `${pluralize(collection.data.total, 'roca descubierta', 'rocas descubiertas')}`
              : 'Rocas descubiertas por esta cuenta'
          }
        />
        {collection.loading && !collection.data ? (
          <LoadingState compact message="Cargando colección…" />
        ) : collection.error ? (
          <ErrorState
            error={collection.error}
            title="No pudimos cargar la colección"
            compact
            onRetry={() => void collection.reload()}
          />
        ) : collection.data && collection.data.items.length > 0 ? (
          <Card padded={false} style={styles.listCard}>
            {collection.data.items.map((entry, index) => (
              <Pressable
                key={entry.id}
                accessibilityRole="link"
                accessibilityLabel={`Ver ficha de ${entry.rock?.name ?? `roca ${entry.rockId}`}`}
                onPress={() => router.push(`/catalog/${entry.rockId}`)}
                style={({ pressed }) => [
                  styles.collectionRow,
                  index < collection.data!.items.length - 1 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.collectionIcon}>
                  <Ionicons name="diamond-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {entry.rock?.name ?? `Roca #${entry.rockId}`}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {pluralize(entry.recognitionCount, 'reconocimiento', 'reconocimientos')} · desde{' '}
                    {formatDate(entry.firstDiscoveredAt)}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        ) : (
          <EmptyState
            icon="albums-outline"
            title="Sin descubrimientos"
            message="Este usuario todavía no ha reconocido ninguna roca."
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Logros"
          subtitle={
            achievements.data
              ? `${achievements.data.items.filter((item) => item.unlocked).length} de ${
                  achievements.data.items.length
                } desbloqueados`
              : 'Logros automáticos del usuario'
          }
        />
        {achievements.loading && !achievements.data ? (
          <LoadingState compact message="Cargando logros…" />
        ) : achievements.error ? (
          <ErrorState
            error={achievements.error}
            title="No pudimos cargar los logros"
            compact
            onRetry={() => void achievements.reload()}
          />
        ) : achievements.data && achievements.data.items.length > 0 ? (
          <View style={styles.achievementList}>
            {achievements.data.items.map((item) => (
              <Card
                key={item.id}
                tone={item.unlocked ? 'accent' : 'surface'}
                style={styles.achievementRow}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    item.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked,
                  ]}
                >
                  <Ionicons
                    name={item.unlocked ? 'trophy' : 'lock-closed-outline'}
                    size={20}
                    color={item.unlocked ? colors.accentText : colors.textMuted}
                  />
                </View>
                <View style={styles.flex}>
                  <AppText
                    variant="bodyStrong"
                    color={item.unlocked ? colors.accentText : colors.text}
                    numberOfLines={2}
                  >
                    {item.name}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={item.unlocked ? colors.accentText : colors.textMuted}
                  >
                    {item.unlocked
                      ? `Desbloqueado el ${formatDate(item.unlockedAt)}`
                      : 'Todavía bloqueado'}
                  </AppText>
                </View>
                <Badge
                  label={item.unlocked ? 'Desbloqueado' : 'Bloqueado'}
                  tone={item.unlocked ? 'warning' : 'neutral'}
                />
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="trophy-outline"
            title="Sin logros configurados"
            message="Cuando existan logros activos, aquí verás el avance de este usuario."
          />
        )}
      </View>

      <ConfirmDialog
        visible={roleConfirm}
        title="¿Cambiar el rol?"
        message={`El rol de ${target.userName} pasará de “${roleName(target.roleId)}” a “${nextRole}”. Los permisos se aplican de inmediato.`}
        confirmLabel="Cambiar rol"
        loading={saving}
        onCancel={() => setRoleConfirm(false)}
        onConfirm={() => void applyUpdate({ roleId: selectedRoleId ?? undefined })}
      />

      <ConfirmDialog
        visible={statusConfirm}
        title={blocking ? '¿Bloquear esta cuenta?' : '¿Reactivar esta cuenta?'}
        message={
          blocking
            ? `${target.userName} no podrá iniciar sesión hasta que reactives la cuenta.`
            : `${target.userName} podrá volver a iniciar sesión y usar la aplicación.`
        }
        confirmLabel={blocking ? 'Bloquear cuenta' : 'Reactivar cuenta'}
        destructive={blocking}
        loading={saving}
        onCancel={() => setStatusConfirm(false)}
        onConfirm={() =>
          void applyUpdate({ status: blocking ? 'blocked' : 'active' })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  identityTexts: { flex: 1, gap: spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  section: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  listCard: { overflow: 'hidden' },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 64,
  },
  collectionIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  pressed: { opacity: 0.75 },
  achievementList: { gap: spacing.sm },
  achievementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconUnlocked: { backgroundColor: colors.surface },
  achievementIconLocked: { backgroundColor: colors.surfaceAlt },
  flex: { flex: 1 },
});
