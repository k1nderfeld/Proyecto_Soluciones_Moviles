import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RockImage } from '@/components/rocks/RockImage';
import { rockApi } from '@/api/rockApi';
import { useApiResource } from '@/hooks/useApiResource';
import { formatDateTime } from '@/utils/format';
import type { RecognitionResult } from '@/types/api';
import { colors, radii, spacing } from '@/theme';

interface RecognitionResultCardProps {
  result: RecognitionResult;
  isAuthenticated: boolean;
  onRetry: () => void;
}

export const RecognitionResultCard = ({
  result,
  isAuthenticated,
  onRetry,
}: RecognitionResultCardProps) => {
  const router = useRouter();
  const { analysis, collection, newDiscovery, unlockedAchievements, guest } = result;
  const { data: rock } = useApiResource(() => rockApi.get(analysis.rockId), [analysis.rockId]);

  return (
    <View style={styles.container}>
      <Card tone="primary" style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons
              name={newDiscovery ? 'sparkles' : 'checkmark-done'}
              size={26}
              color={colors.primary}
            />
          </View>
          <View style={styles.headerTexts}>
            <AppText variant="heading" color={colors.primaryText}>
              {newDiscovery ? '¡Nuevo descubrimiento!' : 'Roca reconocida'}
            </AppText>
            <AppText variant="small" color={colors.primaryText}>
              {newDiscovery
                ? 'La agregamos a tu colección.'
                : `Ya la habías encontrado ${collection.recognitionCount} ${
                    collection.recognitionCount === 1 ? 'vez' : 'veces'
                  }.`}
            </AppText>
          </View>
        </View>
      </Card>

      <Card style={styles.rockCard}>
        <View style={styles.rockRow}>
          <RockImage
            uri={rock?.imgUrl}
            label={rock?.name ?? analysis.result}
            height={104}
            compact
            style={styles.rockImage}
          />
          <View style={styles.rockTexts}>
            <AppText variant="title" numberOfLines={2}>
              {rock?.name ?? analysis.result}
            </AppText>
            {rock?.scientificName ? (
              <AppText variant="small" color={colors.textMuted}>
                {rock.scientificName}
              </AppText>
            ) : null}
            <View style={styles.badges}>
              <Badge label={`${analysis.confidence}% de coincidencia`} tone="success" icon="analytics-outline" />
              <Badge label={`Análisis #${analysis.id}`} tone="neutral" />
            </View>
          </View>
        </View>

        <View style={styles.confidence}>
          <ProgressBar value={analysis.confidence} label="Confianza del modelo" />
        </View>

        {analysis.note ? (
          <View style={styles.note}>
            <AppText variant="label" color={colors.textSecondary}>
              Tu nota
            </AppText>
            <AppText variant="small" color={colors.textSecondary}>
              {analysis.note}
            </AppText>
          </View>
        ) : null}

        <AppText variant="caption" color={colors.textMuted}>
          Registrado el {formatDateTime(analysis.createdAt)}
        </AppText>
      </Card>

      {unlockedAchievements.length > 0 ? (
        <Card tone="accent" style={styles.achievements}>
          <View style={styles.achievementHeader}>
            <Ionicons name="trophy" size={20} color={colors.accentText} />
            <AppText variant="subheading" color={colors.accentText}>
              Logros desbloqueados
            </AppText>
          </View>
          {unlockedAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementRow}>
              <Ionicons name="medal-outline" size={18} color={colors.accentText} />
              <View style={styles.achievementTexts}>
                <AppText variant="bodyStrong" color={colors.accentText}>
                  {achievement.name}
                </AppText>
                <AppText variant="caption" color={colors.accentText}>
                  +{achievement.experience} experiencia
                </AppText>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {guest ? (
        <View style={styles.guestRow}>
          <Ionicons name="hourglass-outline" size={18} color={colors.textSecondary} />
          <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
            Te quedan {guest.remaining} de {guest.limit} reconocimientos como invitado.
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Ver ficha completa"
          onPress={() => router.push(`/catalog/${analysis.rockId}`)}
          icon="book-outline"
          fullWidth
        />
        <Button
          title="Reconocer otra roca"
          variant="secondary"
          onPress={onRetry}
          icon="camera-outline"
          fullWidth
        />
        {isAuthenticated ? (
          <Button
            title="Evaluar este resultado"
            variant="outline"
            onPress={() => router.push(`/feedback/${analysis.id}`)}
            icon="chatbubble-ellipses-outline"
            fullWidth
          />
        ) : (
          <Button
            title="Crea una cuenta para guardar tu progreso"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            icon="person-add-outline"
            fullWidth
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  headerCard: { borderColor: '#99F6E4' },
  headerRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: { flex: 1, gap: 2 },
  rockCard: { gap: spacing.md },
  rockRow: { flexDirection: 'row', gap: spacing.md },
  rockImage: { width: 104, flexShrink: 0 },
  rockTexts: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  confidence: { marginTop: spacing.xs },
  note: {
    gap: 2,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
  },
  achievements: { gap: spacing.sm, borderColor: '#FDE68A' },
  achievementHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  achievementRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  achievementTexts: { flex: 1, gap: 1 },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flex: { flex: 1 },
  actions: { gap: spacing.sm },
});
