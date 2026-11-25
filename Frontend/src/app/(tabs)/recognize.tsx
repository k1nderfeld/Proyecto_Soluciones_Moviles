import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { CameraModal, type CapturedImage } from '@/components/recognition/CameraModal';
import { RecognitionResultCard } from '@/components/recognition/RecognitionResultCard';
import { recognitionApi } from '@/api/recognitionApi';
import { useAuth } from '@/context/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getErrorMessage, isGuestLimitError } from '@/utils/errors';
import {
  detectImageMime,
  estimateBase64Bytes,
  formatFileSize,
  MAX_IMAGE_BYTES,
  type SupportedImageMime,
} from '@/utils/image';
import type { RecognitionResult } from '@/types/api';
import { colors, radii, spacing } from '@/theme';

interface SelectedImage {
  uri: string;
  base64: string;
  mimeType: SupportedImageMime;
  bytes: number;
}

export default function RecognizeScreen() {
  const router = useRouter();
  const { guest, isGuest, isAuthenticated, updateGuestInfo, refreshGuest } = useAuth();
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  useRefreshOnFocus(
    useCallback(async () => {
      if (!isGuest) return;
      try {
        await refreshGuest();
      } catch {}
    }, [isGuest, refreshGuest]),
  );

  const applyImage = (base64: string, uri: string) => {
    const mimeType = detectImageMime(base64);
    if (!mimeType) {
      setError('El formato de la imagen no es compatible. Usa una foto JPG, PNG o WebP.');
      return;
    }
    const bytes = estimateBase64Bytes(base64);
    if (bytes > MAX_IMAGE_BYTES) {
      setError(
        `La imagen pesa ${formatFileSize(bytes)} y el máximo es 8 MB. Prueba con una foto más liviana.`,
      );
      return;
    }
    setError(null);
    setLimitReached(false);
    setResult(null);
    setSelected({ uri, base64, mimeType, bytes });
  };

  const pickFromGallery = async () => {
    setError(null);
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(
          'Necesitamos acceso a tus fotos para elegir una imagen. Puedes habilitarlo en los ajustes del dispositivo.',
        );
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.6,
        allowsMultipleSelection: false,
      });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = picked.assets[0];
      if (!asset.base64) {
        setError('No se pudo leer la imagen seleccionada. Prueba con otra foto.');
        return;
      }
      applyImage(asset.base64, asset.uri);
    } catch {
      setError('No se pudo abrir la galería. Intenta nuevamente.');
    } finally {
      setPicking(false);
    }
  };

  const handleCapture = (image: CapturedImage) => {
    applyImage(image.base64, image.uri);
  };

  const handleReset = () => {
    setSelected(null);
    setNote('');
    setResult(null);
    setError(null);
    setLimitReached(false);
  };

  const submit = async () => {
    if (!selected) {
      setError('Primero elige o toma una fotografía de la roca.');
      return;
    }
    if (isGuest && guest && guest.remaining <= 0) {
      setLimitReached(true);
      return;
    }
    setError(null);
    setProcessing(true);
    setResult(null);
    try {
      const response = await recognitionApi.recognize({
        image: { base64: selected.base64, mime_type: selected.mimeType },
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setResult(response);
      if (response.guest) updateGuestInfo(response.guest);
    } catch (caught) {
      if (isGuestLimitError(caught)) {
        setLimitReached(true);
        setError(getErrorMessage(caught));
        if (guest) {
          updateGuestInfo({ ...guest, recognitionCount: guest.limit, remaining: 0 });
        }
      } else {
        setError(getErrorMessage(caught));
      }
    } finally {
      setProcessing(false);
    }
  };

  if (result) {
    return (
      <Screen>
        <ScreenHeader
          title="Resultado"
          subtitle="Revisa la identificación y guarda el hallazgo"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar resultado"
              onPress={handleReset}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          }
        />
        <RecognitionResultCard result={result} isAuthenticated={isAuthenticated} onRetry={handleReset} />
      </Screen>
    );
  }

  const guestLimit = isGuest && guest ? guest.remaining <= 0 : false;

  return (
    <Screen keyboard>
      <ScreenHeader
        title="Reconocer roca"
        subtitle="Fotografía una muestra y deja que el modelo la identifique"
      />

      {isGuest && guest ? (
        <Card tone={guest.remaining === 0 ? 'accent' : 'surface'} style={styles.guestCard}>
          <View style={styles.guestRow}>
            <Ionicons name="hourglass-outline" size={20} color={colors.accentText} />
            <View style={styles.flex}>
              <AppText variant="label" color={colors.accentText}>
                Sesión de invitado
              </AppText>
              <AppText variant="small" color={colors.accentText}>
                {guest.remaining > 0
                  ? `${guest.remaining} de ${guest.limit} reconocimientos disponibles`
                  : 'Alcanzaste el límite de reconocimientos'}
              </AppText>
            </View>
            <Button
              title="Crear cuenta"
              size="sm"
              variant="secondary"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
          <ProgressBar
            value={(guest.recognitionCount / guest.limit) * 100}
            showValue={false}
            tone="accent"
          />
        </Card>
      ) : null}

      {limitReached || guestLimit ? (
        <Card tone="accent" style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.accentText} />
            <AppText variant="subheading" color={colors.accentText} style={styles.flex}>
              Límite de invitado alcanzado
            </AppText>
          </View>
          <AppText variant="small" color={colors.accentText}>
            Usaste los {guest?.limit ?? 10} reconocimientos disponibles para invitados. Crea una
            cuenta para seguir reconociendo y conservar todo tu progreso.
          </AppText>
          <Button
            title="Crear cuenta gratis"
            icon="person-add-outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
          />
          <Button
            title="Ya tengo cuenta"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
          />
          <Button
            title="Ver mis descubrimientos temporales"
            variant="ghost"
            onPress={() => router.push('/collection')}
            fullWidth
          />
        </Card>
      ) : (
        <>
          {error ? <AlertBanner tone="danger" message={error} /> : null}

          <Card style={styles.uploadCard}>
            {selected ? (
              <View style={styles.previewWrapper}>
                <Image
                  source={{ uri: selected.uri }}
                  style={styles.preview}
                  resizeMode="cover"
                  accessibilityLabel="Vista previa de la roca seleccionada"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Quitar imagen seleccionada"
                  onPress={() => setSelected(null)}
                  style={styles.removeButton}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color={colors.white} />
                </Pressable>
                <View style={styles.previewMeta}>
                  <BadgeLike icon="checkmark-circle" label="Imagen lista" />
                  <AppText variant="caption" color={colors.textSecondary}>
                    {formatFileSize(selected.bytes)} ·{' '}
                    {selected.mimeType.replace('image/', '').toUpperCase()}
                  </AppText>
                </View>
              </View>
            ) : (
              <View style={styles.dropzone}>
                <View style={styles.dropIcon}>
                  <Ionicons name="image-outline" size={34} color={colors.primary} />
                </View>
                <AppText variant="subheading" align="center">
                  Agrega una fotografía
                </AppText>
                <AppText variant="small" color={colors.textSecondary} align="center">
                  Procura que la roca ocupe la mayor parte de la imagen y que la luz sea suficiente.
                </AppText>
              </View>
            )}

            <View style={styles.imageActions}>
              <Button
                title="Tomar foto"
                icon="camera-outline"
                variant={selected ? 'outline' : 'primary'}
                onPress={() => setCameraVisible(true)}
                style={styles.flex}
              />
              <Button
                title="Elegir de galería"
                icon="images-outline"
                variant={selected ? 'outline' : 'secondary'}
                onPress={() => void pickFromGallery()}
                loading={picking}
                style={styles.flex}
              />
            </View>
            <AppText variant="caption" color={colors.textMuted} align="center">
              Formatos JPG, PNG o WebP · máximo 8 MB.
            </AppText>
          </Card>

          <TextField
            label="Nota (opcional)"
            placeholder="Ej: muestra encontrada en una salida a terreno"
            value={note}
            onChangeText={setNote}
            maxLength={255}
            multiline
            helper={`${note.length}/255 caracteres`}
          />

          <Button
            title={processing ? 'Reconociendo…' : 'Reconocer roca'}
            icon="scan-outline"
            onPress={() => void submit()}
            loading={processing}
            disabled={!selected || processing}
            fullWidth
          />

          {processing ? (
            <Card tone="alt" style={styles.processingCard}>
              <ActivityIndicator color={colors.primary} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">Analizando la imagen…</AppText>
                <AppText variant="small" color={colors.textMuted}>
                  El servidor consulta el modelo de reconocimiento. Puede tardar unos segundos.
                </AppText>
              </View>
            </Card>
          ) : null}

          <Card tone="alt">
            <View style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              <View style={styles.flex}>
                <AppText variant="label">Para mejorar el resultado</AppText>
                <AppText variant="small" color={colors.textSecondary}>
                  Evita sombras fuertes, filtros y fondos con muchas rocas. Una sola muestra por
                  fotografía funciona mejor.
                </AppText>
              </View>
            </View>
          </Card>
        </>
      )}

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={handleCapture}
      />
    </Screen>
  );
}

const BadgeLike = ({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) => (
  <View style={styles.badgeLike}>
    <Ionicons name={icon} size={14} color={colors.success} />
    <AppText variant="caption" color={colors.success}>
      {label}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  guestCard: { gap: spacing.sm },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  limitCard: { gap: spacing.md, borderColor: '#FDE68A' },
  limitHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  uploadCard: { gap: spacing.md },
  previewWrapper: { gap: spacing.sm },
  preview: { width: '100%', height: 220, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  dropzone: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  dropIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActions: { flexDirection: 'row', gap: spacing.sm },
  processingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tipRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
