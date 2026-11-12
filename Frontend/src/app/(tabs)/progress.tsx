import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { achievementApi } from '@/api/achievementApi';
import { progressApi } from '@/api/progressApi';
import { useAuth } from '@/context/AuthContext';
import { useApiResource } from '@/hooks/useApiResource';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { formatCondition, formatDate, formatNumber, pluralize } from '@/utils/format';
import type { Achievement, ProgressStats } from '@/types/api';
import { colors, radii, spacing } from '@/theme';

const progressFor = (achievement: Achievement, stats: ProgressStats | null): number | null => {
  if (achievement.unlocked) return 100;
  if (!achievement.conditionType || !achievement.conditionValue || !stats) return null;
  const current =
    achievement.conditionType === 'distinct_rocks' ? stats.distinctRocks : stats.totalRecognitions;
  return Math.min(100, (current / achievement.conditionValue) * 100);
};

const AchievementCard = ({
  achievement,
  stats,
}: {
  achievement: Achievement;
  stats: ProgressStats | null;
}) => {
  const value = progressFor(achievement, stats);
  return (
    <Card
      tone={achievement.unlocked ? 'accent' : 'surface'}
      style={[styles.achievement, achievement.unlocked && styles.achievementUnlocked]}
    >
      <View style={styles.achievementRow}>
        <View
          style={[
            styles.achievementIcon,
            achievement.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked,
          ]}
        >
          <Ionicons
            name={achievement.unlocked ? 'trophy' : 'lock-closed-outline'}
            size={22}
            color={achievement.unlocked ? colors.accentText : colors.textMuted}
          />
        </View>
        <View style={styles.achievementTexts}>
          <View style={styles.achievementTitleRow}>
            <AppText
              variant="subheading"
              color={achievement.unlocked ? colors.accentText : colors.text}
              style={styles.flex}
              numberOfLines={2}
            >
              {achievement.name}
            </AppText>
            <Badge
              label={`+${achievement.experience} XP`}
              tone={achievement.unlocked ? 'warning' : 'neutral'}
            />
          </View>
          <AppText
            variant="small"
            color={achievement.unlocked ? colors.accentText : colors.textSecondary}
          >
            {achievement.description}
          </AppText>
          <AppText
            variant="caption"
            color={achievement.unlocked ? colors.accentText : colors.textMuted}
          >
            {achievement.unlocked
              ? `Desbloqueado el ${formatDate(achievement.unlockedAt)}`
              : formatCondition(achievement.conditionType, achievement.conditionValue)}
          </AppText>
          {value !== null ? (
            <ProgressBar
              value={value}
              tone={achievement.unlocked ? 'accent' : 'primary'}
              showValue={false}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
};

export default function ProgressScreen() {
  const router = useRouter();
  const { isGuest, guest, isAuthenticated, user } = useAuth();

  const stats = useApiResource(() => progressApi.stats(), []);
  const achievements = useApiResource(() => achievementApi.mine(), []);

  const { reload: reloadStats } = stats;
  const { reload: reloadAchievements } = achievements;

  const refresh = useCallback(async () => {
    await Promise.all([reloadStats(), reloadAchievements()]);
  }, [reloadAchievements, reloadStats]);

  useRefreshOnFocus(refresh);

  const unlocked = achievements.data?.items.filter((item) => item.unlocked).length ?? 0;
  const total = achievements.data?.total ?? achievements.data?.items.length ?? 0;
  const refreshing = stats.refreshing || achievements.refreshing;

  return (
    <Screen refreshing={refreshing} onRefresh={() => void refresh()}>
      <ScreenHeader
        title="Mi progreso"
        subtitle={
          isGuest
            ? 'Tu avance durante esta sesión de invitado'
            : `El avance de ${user?.userName ?? 'tu cuenta'} en el catálogo`
        }
      />

      {isGuest && guest ? (
        <Card tone="accent" style={styles.guestCard}>
          <View style={styles.guestRow}>
            <Ionicons name="hourglass-outline" size={22} color={colors.accentText} />
            <View style={styles.flex}>
              <AppText variant="subheading" color={colors.accentText}>
                Progreso temporal
              </AppText>
              <AppText variant="small" color={colors.accentText}>
                {guest.remaining > 0
                  ? `Te quedan ${guest.remaining} de ${guest.limit} reconocimientos.`
                  : 'Usaste todos los reconocimientos de invitado.'}
              </AppText>
            </View>
          </View>
          <Button
            title="Crear cuenta para conservar mis logros"
            icon="person-add-outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
          />
        </Card>
      ) : null}

      {stats.error ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar tus estadísticas."
          actionLabel="Reintentar"
          onAction={() => void stats.reload()}
        />
      ) : null}

      {stats.loading && !stats.data ? (
        <LoadingState compact message="Calculando tu progreso…" />
      ) : stats.data ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              label="Reconocimientos"
              value={formatNumber(stats.data.totalRecognitions)}
              icon="scan-outline"
              tone="primary"
            />
            <StatCard
              label="Rocas distintas"
              value={formatNumber(stats.data.distinctRocks)}
              icon="diamond-outline"
              tone="success"
            />
            <StatCard
              label="Logros desbloqueados"
              value={formatNumber(stats.data.unlockedAchievements)}
              icon="trophy-outline"
              tone="accent"
            />
            <StatCard
              label="Catálogo descubierto"
              value={`${Math.round(stats.data.discoveryPercentage)} %`}
              icon="pie-chart-outline"
              tone="info"
            />
          </View>

          <Card style={styles.catalogCard}>
            <View style={styles.catalogHeader}>
              <View style={styles.flex}>
                <AppText variant="heading">Avance del catálogo</AppText>
                <AppText variant="small" color={colors.textMuted}>
                  Descubriste {pluralize(stats.data.distinctRocks, 'roca', 'rocas')} del catálogo
                  disponible.
                </AppText>
              </View>
              <Ionicons name="earth-outline" size={26} color={colors.primary} />
            </View>
            <ProgressBar value={stats.data.discoveryPercentage} showValue label="Completado" />
            <Button
              title="Seguir explorando el catálogo"
              variant="secondary"
              icon="book-outline"
              onPress={() => router.push('/catalog')}
              fullWidth
            />
          </Card>
        </>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Logros"
          subtitle={
            total > 0
              ? `${unlocked} de ${total} logros desbloqueados`
              : 'Los logros se desbloquean al reconocer rocas'
          }
        />

        {achievements.loading && !achievements.data ? (
          <LoadingState compact message="Cargando logros…" />
        ) : achievements.error ? (
          <ErrorState
            error={achievements.error}
            title="No pudimos cargar tus logros"
            compact
            onRetry={() => void achievements.reload()}
          />
        ) : achievements.data && achievements.data.items.length > 0 ? (
          <View style={styles.achievementList}>
            {achievements.data.items.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                stats={stats.data}
              />
            ))}
          </View>
        ) : (
          <Card tone="alt" style={styles.emptyAchievements}>
            <View style={styles.emptyIcon}>
              <Ionicons name="trophy-outline" size={26} color={colors.textMuted} />
            </View>
            <AppText variant="subheading" align="center">
              Todavía no hay logros disponibles
            </AppText>
            <AppText variant="small" color={colors.textSecondary} align="center">
              Cuando la administración publique logros, aparecerán aquí con tu avance.
            </AppText>
          </Card>
        )}
      </View>

      {isAuthenticated ? (
        <Button
          title="Ver mi colección"
          variant="outline"
          icon="albums-outline"
          onPress={() => router.push('/collection')}
          fullWidth
        />
      ) : (
        <Button
          title="Ver mis descubrimientos temporales"
          variant="outline"
          icon="albums-outline"
          onPress={() => router.push('/collection')}
          fullWidth
        />
      )}

      <Card tone="alt" style={styles.tip}>
        <View style={styles.tipRow}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
            La experiencia se otorga al desbloquear logros. Reconocer rocas nuevas hace avanzar tu
            colección más rápido.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  guestCard: { gap: spacing.md, borderColor: '#FDE68A' },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catalogCard: { gap: spacing.md },
  catalogHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  section: { gap: spacing.md },
  achievementList: { gap: spacing.sm },
  achievement: { gap: spacing.sm },
  achievementUnlocked: { borderColor: '#FDE68A' },
  achievementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconUnlocked: { backgroundColor: colors.surface },
  achievementIconLocked: { backgroundColor: colors.surfaceAlt },
  achievementTexts: { flex: 1, gap: spacing.xs },
  achievementTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  emptyAchievements: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: { borderColor: colors.border },
  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
