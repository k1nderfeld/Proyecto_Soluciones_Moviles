import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { RockImage } from '@/components/rocks/RockImage';
import { RockForm } from '@/components/forms/RockForm';
import { rockApi } from '@/api/rockApi';
import { useTaxonomy } from '@/context/TaxonomyContext';
import { useApiResource } from '@/hooks/useApiResource';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';
import type { RockPayload } from '@/types/api';
import { colors, spacing } from '@/theme';

export default function AdminRockEditScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { types, categories } = useTaxonomy();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const rockId = Number(rawId);
  const validId = Number.isInteger(rockId) && rockId > 0;

  const rock = useApiResource(() => rockApi.get(rockId), [rockId], { enabled: validId });
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const update = async (payload: RockPayload) => {
    const updated = await rockApi.update(rockId, payload);
    setSuccess(`Guardamos los cambios de “${updated.name}”.`);
    await rock.reload();
  };

  const remove = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await rockApi.remove(rockId);
      setDeleteVisible(false);
      router.back();
    } catch (error) {
      setDeleteVisible(false);
      setDeleteError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  if (!validId) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          title="Roca no válida"
          message="El identificador del enlace no es válido."
          actionLabel="Volver al catálogo"
          onAction={() => router.replace('/admin/rocks')}
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

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      {success ? (
        <AlertBanner tone="success" message={success} actionLabel="Cerrar" onAction={() => setSuccess(null)} />
      ) : null}
      {deleteError ? (
        <AlertBanner tone="danger" message={deleteError} actionLabel="Cerrar" onAction={() => setDeleteError(null)} />
      ) : null}

      <Card padded={false} style={styles.summary}>
        <RockImage uri={data.imgUrl} label={data.name} height={110} compact style={styles.image} />
        <View style={styles.summaryBody}>
          <AppText variant="subheading" numberOfLines={1}>
            {data.name}
          </AppText>
          <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
            {data.scientificName}
          </AppText>
          <View style={styles.badges}>
            <Badge label={`#${data.index}`} tone="neutral" />
            <Badge label={`ID ${data.id}`} tone="info" />
          </View>
          <AppText variant="caption" color={colors.textMuted}>
            Actualizada el {formatDateTime(data.updatedAt)}
          </AppText>
        </View>
      </Card>

      <Card tone="alt" style={styles.hint}>
        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <AppText variant="small" color={colors.textSecondary} style={styles.flex}>
            Los campos marcados con * son obligatorios. La dureza debe ser un entero entre 1 y 10 y
            la categoría requiere al menos un tipo y una categoría creados.
          </AppText>
        </View>
      </Card>

      <Card>
        <RockForm
          rock={data}
          types={types}
          categories={categories}
          onSubmit={update}
          submitLabel="Guardar cambios"
        />
      </Card>

      <Card style={styles.dangerZone}>
        <View style={styles.dangerHeader}>
          <Ionicons name="warning-outline" size={22} color={colors.danger} />
          <AppText variant="subheading" color={colors.danger}>
            Zona de riesgo
          </AppText>
        </View>
        <AppText variant="small" color={colors.textSecondary}>
          Eliminar una roca la quita del catálogo y de las colecciones visibles. Esta acción no se
          puede deshacer.
        </AppText>
        <Button
          title="Eliminar roca"
          variant="danger"
          icon="trash-outline"
          onPress={() => setDeleteVisible(true)}
          fullWidth
        />
      </Card>

      <ConfirmDialog
        visible={deleteVisible}
        title="¿Eliminar esta roca?"
        message={`Se eliminará “${data.name}” del catálogo. Los reconocimientos históricos pueden quedar sin ficha visible.`}
        confirmLabel="Eliminar roca"
        destructive
        loading={deleting}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => void remove()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center' },
  image: { width: 110, borderRadius: 0, alignSelf: 'stretch', height: 'auto' },
  summaryBody: { flex: 1, padding: spacing.md, gap: spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  hint: { borderColor: colors.border },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  dangerZone: { gap: spacing.md, borderColor: '#FECACA' },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
