import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AnalysisRow } from '@/components/activity/AnalysisRow';
import { FeedbackForm } from '@/components/forms/FeedbackForm';
import { feedbackApi } from '@/api/feedbackApi';
import { progressApi } from '@/api/progressApi';
import { useAuth } from '@/context/AuthContext';
import { useApiResource } from '@/hooks/useApiResource';
import { getErrorStatus } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';
import type { Feedback } from '@/types/api';
import { colors, radii, spacing } from '@/theme';

export default function FeedbackScreen() {
  const params = useLocalSearchParams<{ analysisId?: string }>();
  const router = useRouter();
  const { isAuthenticated, isGuest } = useAuth();
  const rawId = Array.isArray(params.analysisId) ? params.analysisId[0] : params.analysisId;
  const analysisId = Number(rawId);
  const validId = Number.isInteger(analysisId) && analysisId > 0;
  const [saved, setSaved] = useState(false);

  const feedback = useApiResource(() => feedbackApi.get(analysisId), [analysisId], {
    enabled: validId && isAuthenticated,
  });
  const history = useApiResource(() => progressApi.history({ page: 1, limit: 100 }), [analysisId], {
    enabled: validId && isAuthenticated,
  });

  const analysis = useMemo(
    () => history.data?.items.find((item) => item.id === analysisId) ?? null,
    [analysisId, history.data],
  );

  const notFound = getErrorStatus(feedback.error) === 404;
  const loadError = feedback.error && !notFound ? feedback.error : null;
  const existing: Feedback | null = feedback.data;

  if (!validId) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          title="Reconocimiento no válido"
          message="El enlace no contiene un identificador de reconocimiento válido."
          actionLabel="Ir a mi colección"
          onAction={() => router.replace('/collection')}
          tone="danger"
        />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ScreenHeader
          showBack
          title="Evaluar reconocimiento"
          subtitle={`Análisis #${analysisId}`}
        />
        <Card tone="accent" style={styles.guardCard}>
          <View style={styles.guardIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.accentText} />
          </View>
          <AppText variant="subheading" color={colors.accentText}>
            Necesitas una cuenta para enviar retroalimentación
          </AppText>
          <AppText variant="small" color={colors.accentText}>
            {isGuest
              ? 'Estás explorando como invitado. Crea una cuenta para evaluar resultados y conservar tu progreso.'
              : 'Inicia sesión para evaluar este resultado y ayudarnos a mejorar el reconocimiento.'}
          </AppText>
          <Button
            title="Crear una cuenta"
            icon="person-add-outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
          />
          <Button
            title="Iniciar sesión"
            variant="outline"
            icon="log-in-outline"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
          />
        </Card>
      </Screen>
    );
  }

  if (feedback.loading && !feedback.data && !notFound) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <LoadingState message="Cargando la evaluación…" />
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ErrorState
          error={loadError}
          title="No pudimos cargar esta evaluación"
          onRetry={() => void feedback.reload()}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboard edges={['left', 'right', 'bottom']}>
      <ScreenHeader
        showBack
        title={existing ? 'Editar evaluación' : 'Evaluar reconocimiento'}
        subtitle={`Análisis #${analysisId}`}
        right={
          existing ? (
            <Badge
              label={existing.isCorrect ? 'Marcado correcto' : 'Marcado incorrecto'}
              tone={existing.isCorrect ? 'success' : 'danger'}
              icon={existing.isCorrect ? 'checkmark-circle' : 'close-circle'}
            />
          ) : undefined
        }
      />

      {saved ? (
        <AlertBanner
          tone="success"
          title="Evaluación guardada"
          message="Gracias por ayudarnos a mejorar el reconocimiento de rocas."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      ) : null}

      {analysis ? (
        <View style={styles.analysisBlock}>
          <AppText variant="label" color={colors.textSecondary}>
            Reconocimiento evaluado
          </AppText>
          <AnalysisRow analysis={analysis} onPress={() => router.push(`/catalog/${analysis.rockId}`)} />
        </View>
      ) : (
        <Card tone="alt" style={styles.analysisFallback}>
          <Ionicons name="scan-outline" size={22} color={colors.primary} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Reconocimiento #{analysisId}</AppText>
            <AppText variant="small" color={colors.textSecondary}>
              No encontramos el detalle en tu historial reciente, pero puedes enviar tu evaluación.
            </AppText>
          </View>
        </Card>
      )}

      {existing ? (
        <Card tone="alt" style={styles.existingCard}>
          <View style={styles.existingRow}>
            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
            <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
              Ya enviaste una evaluación el {formatDateTime(existing.createdAt)}. Puedes actualizarla.
            </AppText>
          </View>
        </Card>
      ) : (
        <Card tone="alt" style={styles.existingCard}>
          <View style={styles.existingRow}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
              Indica si la roca identificada coincide con tu muestra. Tu respuesta es opcional para
              el resto de usuarios y se usa con fines académicos.
            </AppText>
          </View>
        </Card>
      )}

      <Card>
        <FeedbackForm
          initial={existing}
          onSubmit={async (values) => {
            const result = existing
              ? await feedbackApi.update(analysisId, values)
              : await feedbackApi.create(analysisId, values);
            feedback.setData(result);
            setSaved(true);
          }}
        />
      </Card>

      {saved ? (
        <Button
          title="Volver al reconocimiento"
          variant="outline"
          icon="arrow-back-outline"
          onPress={() => router.back()}
          fullWidth
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  guardCard: { gap: spacing.md, borderColor: '#FDE68A', alignItems: 'flex-start' },
  guardIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisBlock: { gap: spacing.xs },
  analysisFallback: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  existingCard: { borderColor: colors.border },
  existingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
});
