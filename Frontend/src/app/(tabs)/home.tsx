import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionTile } from '@/components/ui/ActionTile';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnalysisRow } from '@/components/activity/AnalysisRow';
import { RockTile } from '@/components/rocks/RockTile';
import { progressApi } from '@/api/progressApi';
import { rockApi } from '@/api/rockApi';
import { useApiResource } from '@/hooks/useApiResource';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useAuth } from '@/context/AuthContext';
import { formatNumber, pluralize } from '@/utils/format';
import { colors, radii, spacing } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const {
    user,
    guest,
    isGuest,
    isAdmin,
    hasSession,
    lastMigration,
    clearLastMigration,
  } = useAuth();

  const stats = useApiResource(() => progressApi.stats(), [], { enabled: hasSession });
  const history = useApiResource(() => progressApi.history({ page: 1, limit: 4 }), [], {
    enabled: hasSession,
  });
  const rocks = useApiResource(() => rockApi.list({ page: 1, limit: 6 }), []);

  const { reload: reloadStats } = stats;
  const { reload: reloadHistory } = history;
  const { reload: reloadRocks } = rocks;

  const refreshAll = useCallback(async () => {
    await Promise.all([reloadStats(), reloadHistory(), reloadRocks()]);
  }, [reloadHistory, reloadRocks, reloadStats]);

  useRefreshOnFocus(refreshAll);

  const firstName = user?.userName?.split(/\s+/)[0] ?? 'explorador';
  const greeting = user ? `Hola, ${firstName}` : 'Hola, explorador';
  const subtitle = isGuest
    ? 'Estás explorando como invitado'
    : user
      ? 'Este es el resumen de tu colección'
      : 'Explora el catálogo de rocas';

  const refreshing = stats.refreshing || history.refreshing || rocks.refreshing;

  return (
    <Screen refreshing={refreshing} onRefresh={() => void refreshAll()}>
      <ScreenHeader
        title={greeting}
        subtitle={subtitle}
        right={<Avatar name={user?.userName ?? 'Invitado'} size={46} tone={isGuest ? 'accent' : 'primary'} />}
      />

      {lastMigration ? (
        <AlertBanner
          tone="success"
          title="Progreso transferido"
          message={`Movimos ${pluralize(lastMigration.discoveries, 'descubrimiento', 'descubrimientos')} y ${pluralize(
            lastMigration.recognitions,
            'reconocimiento',
            'reconocimientos',
          )} a tu cuenta.`}
          actionLabel="Entendido"
          onAction={clearLastMigration}
        />
      ) : null}

      {isGuest && guest ? (
        <Card tone="accent" style={styles.guestCard}>
          <View style={styles.guestHeader}>
            <View style={styles.guestIcon}>
              <Ionicons name="hourglass-outline" size={22} color={colors.accentText} />
            </View>
            <View style={styles.guestTexts}>
              <AppText variant="subheading" color={colors.accentText}>
                Sesión de invitado
              </AppText>
              <AppText variant="small" color={colors.accentText}>
                {guest.remaining > 0
                  ? `Te quedan ${guest.remaining} de ${guest.limit} reconocimientos.`
                  : 'Alcanzaste el límite de reconocimientos.'}
              </AppText>
            </View>
            <Badge
              label={`${guest.recognitionCount}/${guest.limit}`}
              tone={guest.remaining === 0 ? 'danger' : 'warning'}
            />
          </View>
          <ProgressBar
            value={(guest.recognitionCount / guest.limit) * 100}
            label="Reconocimientos usados"
            tone="accent"
          />
          <Button
            title={guest.remaining > 0 ? 'Crear cuenta y guardar progreso' : 'Crear cuenta para continuar'}
            variant="primary"
            icon="person-add-outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
          />
        </Card>
      ) : null}

      {stats.error ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar tu resumen de progreso."
          actionLabel="Reintentar"
          onAction={() => void stats.reload()}
        />
      ) : null}

      {stats.data ? (
        <Card style={styles.statsCard}>
          <View style={styles.statItem}>
            <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(stats.data.totalRecognitions)}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Reconocimientos
            </AppText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(stats.data.distinctRocks)}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Rocas distintas
            </AppText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(stats.data.unlockedAchievements)}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Logros
            </AppText>
          </View>
          <View style={styles.progressWrapper}>
            <ProgressBar
              value={stats.data.discoveryPercentage}
              label="Catálogo descubierto"
              showValue
            />
          </View>
        </Card>
      ) : stats.loading && hasSession ? (
        <LoadingState compact message="Cargando tu resumen…" />
      ) : null}

      <View style={styles.quickActions}>
        <ActionTile
          title="Reconocer roca"
          subtitle="Toma o elige una foto"
          icon="camera-outline"
          onPress={() => router.push('/recognize')}
        />
        <ActionTile
          title="Catálogo"
          subtitle="Explora todas las rocas"
          icon="book-outline"
          tone="info"
          onPress={() => router.push('/catalog')}
        />
        <ActionTile
          title="Mi colección"
          subtitle={isGuest ? 'Descubrimientos temporales' : 'Tus rocas descubiertas'}
          icon="albums-outline"
          tone="success"
          onPress={() => router.push('/collection')}
        />
        <ActionTile
          title="Mi progreso"
          subtitle="Estadísticas y logros"
          icon="stats-chart-outline"
          tone="accent"
          onPress={() => router.push('/progress')}
        />
        {isAdmin ? (
          <ActionTile
            title="Administración"
            subtitle="Usuarios, catálogo y reportes"
            icon="shield-checkmark-outline"
            onPress={() => router.push('/admin')}
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Rocas destacadas"
          subtitle="Una muestra del catálogo"
          actionLabel="Ver catálogo"
          onAction={() => router.push('/catalog')}
        />
        {rocks.loading && !rocks.data ? (
          <LoadingState compact message="Cargando rocas…" />
        ) : rocks.error ? (
          <ErrorState error={rocks.error} compact onRetry={() => void rocks.reload()} />
        ) : rocks.data && rocks.data.items.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rockList}
          >
            {rocks.data.items.map((rock) => (
              <RockTile key={rock.id} rock={rock} />
            ))}
          </ScrollView>
        ) : (
          <EmptyState
            icon="diamond-outline"
            title="Catálogo vacío"
            message="Todavía no hay rocas publicadas."
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={isGuest ? 'Descubrimientos temporales' : 'Actividad reciente'}
          subtitle={
            isGuest
              ? 'Se guardan solo mientras dure tu sesión de invitado'
              : 'Tus últimos reconocimientos'
          }
          actionLabel={hasSession ? 'Ver historial' : undefined}
          onAction={hasSession ? () => router.push('/progress') : undefined}
        />
        {history.loading && !history.data ? (
          <LoadingState compact message="Cargando actividad…" />
        ) : history.error ? (
          <ErrorState error={history.error} compact onRetry={() => void history.reload()} />
        ) : history.data && history.data.items.length > 0 ? (
          <View style={styles.activityList}>
            {history.data.items.map((analysis) => (
              <AnalysisRow
                key={analysis.id}
                analysis={analysis}
                onPress={() => router.push(`/catalog/${analysis.rockId}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="scan-outline"
            title="Aún no hay reconocimientos"
            message="Fotografía tu primera roca para empezar tu colección."
            actionLabel="Reconocer ahora"
            onAction={() => router.push('/recognize')}
            tone="primary"
          />
        )}
      </View>

      <Card tone="alt" style={styles.tip}>
        <View style={styles.tipRow}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <AppText variant="small" color={colors.textSecondary} style={styles.tipText}>
            Consejo: usa buena luz y muestra la roca completa, sin filtros, para mejorar la
            identificación.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guestCard: { gap: spacing.md, borderColor: '#FDE68A' },
  guestHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  guestIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTexts: { flex: 1, gap: 1 },
  statsCard: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statItem: { flex: 1, minWidth: 80, alignItems: 'center', gap: 2 },
  divider: { width: 1, backgroundColor: colors.border, alignSelf: 'stretch' },
  progressWrapper: { width: '100%', marginTop: spacing.sm },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { gap: spacing.md },
  rockList: { gap: spacing.md, paddingRight: spacing.lg },
  activityList: { gap: spacing.sm },
  tip: { borderColor: colors.border },
  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  tipText: { flex: 1 },
});
