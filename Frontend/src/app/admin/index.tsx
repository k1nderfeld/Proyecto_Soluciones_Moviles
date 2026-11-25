import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionTile } from '@/components/ui/ActionTile';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { adminApi } from '@/api/adminApi';
import { useAuth } from '@/context/AuthContext';
import { useApiResource } from '@/hooks/useApiResource';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { formatNumber } from '@/utils/format';
import { colors, spacing } from '@/theme';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const stats = useApiResource(() => adminApi.stats(), []);

  useRefreshOnFocus(stats.reload);

  const topRocks = stats.data?.mostRecognizedRocks ?? [];
  const maxCount = Math.max(1, ...topRocks.map((item) => item.count));

  return (
    <Screen refreshing={stats.refreshing} onRefresh={() => void stats.reload()}>
      <ScreenHeader
        showBack
        title="Administración"
        subtitle="Gestiona usuarios, catálogo y actividad"
        right={<Avatar name={user?.userName ?? 'Admin'} size={46} />}
      />

      {stats.error ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar las estadísticas generales."
          actionLabel="Reintentar"
          onAction={() => void stats.reload()}
        />
      ) : null}

      {stats.loading && !stats.data ? (
        <LoadingState compact message="Cargando estadísticas…" />
      ) : stats.data ? (
        <View style={styles.statsGrid}>
          <StatCard
            label="Usuarios registrados"
            value={formatNumber(stats.data.registeredUsers)}
            icon="people-outline"
            tone="primary"
          />
          <StatCard
            label="Reconocimientos totales"
            value={formatNumber(stats.data.totalRecognitions)}
            icon="scan-outline"
            tone="info"
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Gestión"
          subtitle="Accesos rápidos a cada sección del panel"
        />
        <View style={styles.grid}>
          <ActionTile
            title="Usuarios"
            subtitle="Roles y estado de cuentas"
            icon="people-outline"
            onPress={() => router.push('/admin/users')}
          />
          <ActionTile
            title="Rocas"
            subtitle="Crear y editar fichas"
            icon="diamond-outline"
            tone="info"
            onPress={() => router.push('/admin/rocks')}
          />
          <ActionTile
            title="Tipos"
            subtitle="Clasificación geológica"
            icon="layers-outline"
            tone="success"
            onPress={() => router.push('/admin/types')}
          />
          <ActionTile
            title="Categorías"
            subtitle="Agrupación del catálogo"
            icon="pricetag-outline"
            tone="success"
            onPress={() => router.push('/admin/categories')}
          />
          <ActionTile
            title="Logros"
            subtitle="Reglas y recompensas"
            icon="trophy-outline"
            tone="accent"
            onPress={() => router.push('/admin/achievements')}
          />
          <ActionTile
            title="Reconocimientos"
            subtitle="Historial global de análisis"
            icon="scan-outline"
            onPress={() => router.push('/admin/recognitions')}
          />
          <ActionTile
            title="Retroalimentación"
            subtitle="Evaluaciones de usuarios"
            icon="chatbubble-ellipses-outline"
            tone="accent"
            onPress={() => router.push('/admin/feedback')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Rocas más reconocidas"
          subtitle="Los cinco resultados más frecuentes del sistema"
        />
        {stats.loading && !stats.data ? (
          <LoadingState compact message="Cargando ranking…" />
        ) : topRocks.length > 0 ? (
          <Card style={styles.ranking}>
            {topRocks.map((item, index) => (
              <View key={`${item.rockId}-${index}`} style={styles.rankingRow}>
                <View style={styles.rankBadge}>
                  <AppText variant="label" color={colors.primaryText}>
                    #{index + 1}
                  </AppText>
                </View>
                <View style={styles.rankingTexts}>
                  <View style={styles.rankingTitle}>
                    <AppText variant="bodyStrong" numberOfLines={1} style={styles.flex}>
                      {item.name ?? `Roca #${item.rockId}`}
                    </AppText>
                    <AppText variant="label" color={colors.textSecondary}>
                      {formatNumber(item.count)}
                    </AppText>
                  </View>
                  <ProgressBar
                    value={(item.count / maxCount) * 100}
                    showValue={false}
                  />
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState
            icon="analytics-outline"
            title="Aún no hay reconocimientos"
            message="Cuando los usuarios reconozcan rocas, aparecerá aquí el ranking."
          />
        )}
      </View>

      <Card tone="alt" style={styles.tip}>
        <View style={styles.tipRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
            Las acciones destructivas, como eliminar rocas, tipos, categorías o logros, siempre
            piden confirmación antes de ejecutarse.
          </AppText>
        </View>
      </Card>

      <Button
        title="Volver a la aplicación"
        variant="outline"
        icon="arrow-back-outline"
        onPress={() => router.replace('/home')}
        fullWidth
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ranking: { gap: spacing.md },
  rankingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingTexts: { flex: 1, gap: spacing.xs },
  rankingTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  tip: { borderColor: colors.border },
  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
