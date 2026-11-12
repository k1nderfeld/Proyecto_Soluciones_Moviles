import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InfoRow } from '@/components/ui/InfoRow';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { useAuth } from '@/context/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { formatDate, formatExpiration } from '@/utils/format';
import { colors, radii, spacing } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    guest,
    isAuthenticated,
    isGuest,
    isAdmin,
    updateProfile,
    signOut,
    refreshSession,
  } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useRefreshOnFocus(
    useCallback(async () => {
      try {
        await refreshSession();
      } catch {}
    }, [refreshSession]),
  );

  const handleLogout = async () => {
    setLogoutError(null);
    setSigningOut(true);
    try {
      await signOut();
      setLogoutVisible(false);
      router.replace('/');
    } catch {
      setLogoutError('No se pudo cerrar la sesión. Intenta nuevamente.');
    } finally {
      setSigningOut(false);
    }
  };

  const roleName = user?.role?.name ?? 'Usuario autenticado';

  return (
    <Screen>
      <ScreenHeader
        title="Mi perfil"
        subtitle={isGuest ? 'Sesión de invitado' : 'Tu cuenta y preferencias'}
      />

      {logoutError ? <AlertBanner tone="danger" message={logoutError} /> : null}

      {user ? (
        <>
          <Card style={styles.identityCard}>
            <Avatar name={user.userName} size={72} />
            <View style={styles.identityTexts}>
              <AppText variant="title" numberOfLines={2}>
                {user.userName}
              </AppText>
              <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
                {user.email}
              </AppText>
              <View style={styles.badges}>
                <Badge
                  label={roleName}
                  tone={isAdmin ? 'primary' : 'info'}
                  icon={isAdmin ? 'shield-checkmark-outline' : 'person-outline'}
                />
                <Badge
                  label={user.status === 'active' ? 'Cuenta activa' : 'Cuenta bloqueada'}
                  tone={user.status === 'active' ? 'success' : 'danger'}
                  icon={user.status === 'active' ? 'checkmark-circle-outline' : 'lock-closed-outline'}
                />
              </View>
            </View>
          </Card>

          {isAdmin ? (
            <Button
              title="Ir al panel de administración"
              icon="shield-checkmark-outline"
              variant="secondary"
              onPress={() => router.push('/admin')}
              fullWidth
            />
          ) : null}

          <Card style={styles.section}>
            <AppText variant="heading">Datos de la cuenta</AppText>
            <View>
              <InfoRow label="Usuario" value={user.userName} />
              <InfoRow label="Correo" value={user.email} />
              <InfoRow label="Teléfono" value={user.phone || 'No registrado'} />
              <InfoRow label="Rol" value={roleName} />
              <InfoRow label="Estado" value={user.status === 'active' ? 'Activa' : 'Bloqueada'} />
              <InfoRow label="Miembro desde" value={formatDate(user.createdAt)} last />
            </View>
          </Card>

          <View style={styles.section}>
            <SectionHeader
              title="Editar perfil"
              subtitle="Puedes actualizar tu nombre visible y tu teléfono"
            />
            <Card>
              <ProfileForm
                user={user}
                onSubmit={async (values) => {
                  await updateProfile(values);
                }}
              />
            </Card>
          </View>
        </>
      ) : isGuest && guest ? (
        <>
          <Card tone="accent" style={styles.guestCard}>
            <View style={styles.guestHeader}>
              <View style={styles.guestIcon}>
                <Ionicons name="hourglass-outline" size={28} color={colors.accentText} />
              </View>
              <View style={styles.identityTexts}>
                <AppText variant="title" color={colors.accentText}>
                  Invitado
                </AppText>
                <AppText variant="small" color={colors.accentText}>
                  Tu progreso es temporal hasta que crees una cuenta.
                </AppText>
              </View>
            </View>
            <ProgressBar
              value={(guest.recognitionCount / guest.limit) * 100}
              label={`${guest.recognitionCount} de ${guest.limit} reconocimientos usados`}
              tone="accent"
            />
            <View style={styles.guestStats}>
              <View style={styles.guestStat}>
                <AppText variant="title" color={colors.accentText}>
                  {guest.remaining}
                </AppText>
                <AppText variant="caption" color={colors.accentText}>
                  Restantes
                </AppText>
              </View>
              <View style={styles.guestDivider} />
              <View style={styles.guestStat}>
                <AppText variant="title" color={colors.accentText}>
                  {guest.recognitionCount}
                </AppText>
                <AppText variant="caption" color={colors.accentText}>
                  Usados
                </AppText>
              </View>
              <View style={styles.guestDivider} />
              <View style={styles.guestStat}>
                <AppText variant="label" color={colors.accentText} numberOfLines={1}>
                  {guest.status === 'active' ? 'Activa' : guest.status}
                </AppText>
                <AppText variant="caption" color={colors.accentText}>
                  Estado
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color={colors.accentText}>
              Sesión válida hasta el {formatExpiration(guest.expiresAt)}
            </AppText>
          </Card>

          <Card style={styles.section}>
            <AppText variant="heading">Guarda tu progreso</AppText>
            <AppText variant="small" color={colors.textSecondary}>
              Al crear una cuenta o iniciar sesión, intentaremos transferir automáticamente tus
              descubrimientos, reconocimientos y logros temporales.
            </AppText>
            <Button
              title="Crear una cuenta"
              icon="person-add-outline"
              onPress={() => router.push('/(auth)/register')}
              fullWidth
            />
            <Button
              title="Ya tengo una cuenta"
              variant="outline"
              icon="log-in-outline"
              onPress={() => router.push('/(auth)/login')}
              fullWidth
            />
          </Card>

          <Card tone="alt">
            <View style={styles.tipRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
                Los invitados pueden reconocer hasta {guest.limit} rocas y no pueden enviar
                retroalimentación. Esas funciones requieren una cuenta registrada.
              </AppText>
            </View>
          </Card>
        </>
      ) : (
        <Card tone="alt" style={styles.section}>
          <AppText variant="subheading">No hay una sesión activa</AppText>
          <AppText variant="small" color={colors.textSecondary}>
            Inicia sesión o explora el catálogo como invitado.
          </AppText>
          <Button
            title="Volver al inicio"
            variant="secondary"
            onPress={() => router.replace('/')}
            fullWidth
          />
        </Card>
      )}

      {isAuthenticated || isGuest ? (
        <View style={styles.section}>
          <SectionHeader title="Sesión" subtitle="Cerrar sesión en este dispositivo" />
          <Button
            title={isGuest ? 'Cerrar sesión de invitado' : 'Cerrar sesión'}
            variant="danger"
            icon="log-out-outline"
            onPress={() => setLogoutVisible(true)}
            fullWidth
          />
        </View>
      ) : null}

      <AppText variant="caption" color={colors.textMuted} align="center">
        RocaDex · Reconocimiento de rocas
      </AppText>

      <ConfirmDialog
        visible={logoutVisible}
        title={isGuest ? '¿Cerrar la sesión de invitado?' : '¿Cerrar sesión?'}
        message={
          isGuest
            ? 'Si cierras la sesión de invitado, perderás el acceso a tus descubrimientos temporales. Crea una cuenta antes para conservarlos.'
            : 'Tendrás que volver a ingresar tu correo y contraseña para acceder a tu colección.'
        }
        confirmLabel={isGuest ? 'Cerrar sesión de invitado' : 'Cerrar sesión'}
        destructive
        loading={signingOut}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={() => void handleLogout()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  identityTexts: { flex: 1, gap: spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  section: { gap: spacing.md },
  guestCard: { gap: spacing.md, borderColor: '#FDE68A' },
  guestHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  guestIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestStats: { flexDirection: 'row', alignItems: 'center' },
  guestStat: { flex: 1, alignItems: 'center', gap: 2 },
  guestDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#FDE68A' },
  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  flex: { flex: 1 },
});
