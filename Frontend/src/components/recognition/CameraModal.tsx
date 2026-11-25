import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { colors, radii, spacing } from '@/theme';

export interface CapturedImage {
  uri: string;
  base64: string;
  mimeType: 'image/jpeg';
}

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (image: CapturedImage) => void;
}

export const CameraModal = ({ visible, onClose, onCapture }: CameraModalProps) => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setError(null);
    setCapturing(true);
    try {
      const picture: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      });
      if (!picture.base64) {
        setError('No se pudo leer la imagen capturada. Intenta nuevamente.');
        return;
      }
      onCapture({ uri: picture.uri, base64: picture.base64, mimeType: 'image/jpeg' });
      onClose();
    } catch {
      setError('No se pudo tomar la fotografía. Revisa los permisos de cámara e intenta de nuevo.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {!permission ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.white} size="large" />
          </View>
        ) : !permission.granted ? (
          <SafeAreaView style={styles.permission}>
            <View style={styles.permissionIcon}>
              <Ionicons name="camera-outline" size={40} color={colors.primary} />
            </View>
            <AppText variant="title" align="center">
              Permiso de cámara
            </AppText>
            <AppText variant="body" color={colors.textSecondary} align="center">
              Para fotografiar una roca y reconocerla necesitamos acceso a la cámara. Puedes
              habilitarlo cuando quieras desde los ajustes del dispositivo.
            </AppText>
            <Button
              title="Permitir cámara"
              onPress={() => void requestPermission()}
              icon="camera-outline"
              fullWidth
            />
            <Button title="Cancelar" variant="ghost" onPress={onClose} fullWidth />
          </SafeAreaView>
        ) : (
          <>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
              <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
                <View style={styles.topBar}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar cámara"
                    onPress={onClose}
                    style={styles.roundButton}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={24} color={colors.white} />
                  </Pressable>
                  <AppText variant="label" color={colors.white}>
                    Encuadra la roca
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar cámara"
                    onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
                    style={styles.roundButton}
                    hitSlop={8}
                  >
                    <Ionicons name="camera-reverse-outline" size={24} color={colors.white} />
                  </Pressable>
                </View>

                <View style={styles.bottomBar}>
                  {error ? (
                    <View style={styles.errorWrapper}>
                      <AlertBanner tone="danger" message={error} />
                    </View>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tomar fotografía"
                    accessibilityState={{ busy: capturing }}
                    onPress={() => void takePicture()}
                    disabled={capturing}
                    style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
                  >
                    {capturing ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <View style={styles.shutterInner} />
                    )}
                  </Pressable>
                  <AppText variant="caption" color={colors.white} align="center">
                    La imagen se envía al reconocimiento al confirmar.
                  </AppText>
                </View>
              </SafeAreaView>
            </CameraView>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permission: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing['2xl'],
    justifyContent: 'center',
    gap: spacing.lg,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  errorWrapper: { width: '100%' },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  shutterPressed: { opacity: 0.8 },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
  },
});
