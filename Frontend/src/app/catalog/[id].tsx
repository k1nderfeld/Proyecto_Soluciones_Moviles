import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { InfoRow } from '@/components/ui/InfoRow';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { RockImage } from '@/components/rocks/RockImage';
import { collectionApi } from '@/api/collectionApi';
import { rockApi } from '@/api/rockApi';
import { useAuth } from '@/context/AuthContext';
import { useTaxonomy } from '@/context/TaxonomyContext';
import { useApiResource } from '@/hooks/useApiResource';
import { formatDate } from '@/utils/format';
import { colors, radii, spacing } from '@/theme';

export default function RockDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { typeName, categoryName } = useTaxonomy();
  const rockId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const validId = Number.isInteger(rockId) && rockId > 0;
  const [linkError, setLinkError] = useState<string | null>(null);

  const rock = useApiResource(() => rockApi.get(rockId), [rockId], { enabled: validId });
  const collection = useApiResource(() => collectionApi.mineByRock(rockId), [rockId, isAuthenticated], {
    enabled: validId && isAuthenticated,
  });

  const openMindat = async () => {
    if (!rock.data?.mindatUrl) return;
    setLinkError(null);
    try {
      const supported = await Linking.canOpenURL(rock.data.mindatUrl);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(rock.data.mindatUrl);
    } catch {
      setLinkError('No se pudo abrir el enlace de Mindat en este dispositivo.');
    }
  };

  if (!validId) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          title="Roca no encontrada"
          message="El identificador del enlace no es válido."
          actionLabel="Ir al catálogo"
          onAction={() => router.replace('/catalog')}
          tone="danger"
        />
      </Screen>
    );
  }

  if (rock.loading && !rock.data) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <LoadingState message="Cargando ficha de la roca…" />
      </Screen>
    );
  }

  if (rock.error || !rock.data) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ErrorState
          error={rock.error ?? new Error('La roca no existe o fue eliminada.')}
          title="No pudimos cargar esta roca"
          onRetry={() => void rock.reload()}
        />
      </Screen>
    );
  }

  const data = rock.data;
  const discovered = collection.data;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Card padded={false}>
        <RockImage uri={data.imgUrl} label={data.name} height={230} style={styles.hero} />
        <View style={styles.heroBody}>
          <View style={styles.titleRow}>
            <View style={styles.titleTexts}>
              <AppText variant="title">{data.name}</AppText>
              <AppText variant="body" color={colors.textMuted}>
                {data.scientificName}
              </AppText>
            </View>
            <Badge label={`#${data.index}`} tone="neutral" />
          </View>
          <View style={styles.badges}>
            <Badge label={typeName(data.typeId)} tone="primary" icon="layers-outline" />
            <Badge label={categoryName(data.categoryId)} tone="info" icon="pricetag-outline" />
            {discovered ? (
              <Badge
                label={`En tu colección · ${discovered.recognitionCount} ${
                  discovered.recognitionCount === 1 ? 'vez' : 'veces'
                }`}
                tone="success"
                icon="checkmark-circle"
              />
            ) : null}
          </View>
          {discovered ? (
            <AppText variant="caption" color={colors.textMuted}>
              Descubierta el {formatDate(discovered.firstDiscoveredAt)}
            </AppText>
          ) : null}
        </View>
      </Card>

      <Card style={styles.section}>
        <AppText variant="heading">Descripción</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {data.description}
        </AppText>
      </Card>

      <Card style={styles.section}>
        <AppText variant="heading">Características</AppText>
        <View>
          <InfoRow label="Dureza (Mohs)" value={data.hardness} />
          <InfoRow label="Densidad" value={data.density} />
          <InfoRow label="Color" value={data.color} />
          <InfoRow label="Raya" value={data.streak} />
          <InfoRow label="Textura" value={data.texture} />
          <InfoRow label="Transparencia" value={data.transparency} />
          <InfoRow label="Tenacidad" value={data.tenacity} />
          <InfoRow label="Peso molar" value={data.molarWeight ?? 'No aplica'} />
          <InfoRow label="Composición" value={data.composition} />
          <InfoRow label="Fórmula" value={data.formula} />
          <InfoRow label="Ambiente" value={data.environment} />
          <InfoRow label="Usos comunes" value={data.commonUses} last />
        </View>
      </Card>

      {linkError ? (
        <View style={styles.linkError}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
          <AppText variant="small" color={colors.danger} style={styles.flex}>
            {linkError}
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Reconocer una roca"
          icon="camera-outline"
          onPress={() => router.push('/recognize')}
          fullWidth
        />
        <Button
          title="Abrir ficha en Mindat"
          icon="open-outline"
          variant="outline"
          onPress={() => void openMindat()}
          fullWidth
        />
      </View>

      <AppText variant="caption" color={colors.textMuted} align="center">
        Fuente complementaria: Mindat. La ficha del catálogo pertenece a RocaDex.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 0 },
  heroBody: { padding: spacing.lg, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleTexts: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  section: { gap: spacing.sm },
  actions: { gap: spacing.sm },
  linkError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSoft,
  },
  flex: { flex: 1 },
});
