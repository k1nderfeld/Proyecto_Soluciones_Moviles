import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { BootScreen } from '@/components/ui/BootScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/utils/errors';
import { colors, radii, spacing } from '@/theme';

const features = [
  {
    icon: 'camera-outline' as const,
    title: 'Reconoce con una foto',
    text: 'Toma o elige una imagen y obtén la roca más probable del catálogo.',
  },
  {
    icon: 'book-outline' as const,
    title: 'Explora fichas completas',
    text: 'Consulta composición, dureza, textura y usos de cada roca.',
  },
  {
    icon: 'trophy-outline' as const,
    title: 'Avanza y colecciona',
    text: 'Guarda tus descubrimientos y desbloquea logros mientras aprendes.',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { isLoading, hasSession, startGuest } = useAuth();
  const [startingGuest, setStartingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <BootScreen />;
  if (hasSession) return <Redirect href="/home" />;

  const handleGuest = async () => {
    setError(null);
    setStartingGuest(true);
    try {
      await startGuest();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setStartingGuest(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons name="diamond" size={38} color={colors.primary} />
        </View>
        <View style={styles.brandTexts}>
          <AppText variant="display">RocaDex</AppText>
          <AppText variant="small" color={colors.textMuted}>
            Reconocimiento de rocas
          </AppText>
        </View>
      </View>

      <Card tone="primary" style={styles.hero}>
        <View style={styles.heroDecorOne} />
        <View style={styles.heroDecorTwo} />
        <View style={styles.heroContent}>
          <AppText variant="display" color={colors.primaryText}>
            Descubre qué roca tienes en tus manos
          </AppText>
          <AppText variant="body" color={colors.primaryText}>
            Fotografía una muestra, recibe una identificación y aprende con su ficha geológica.
          </AppText>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primaryText} />
            <AppText variant="label" color={colors.primaryText}>
              Sin cuenta: hasta 10 reconocimientos
            </AppText>
          </View>
        </View>
      </Card>

      {error ? <AlertBanner tone="danger" message={error} /> : null}

      <View style={styles.actions}>
        <Button
          title="Iniciar sesión"
          icon="log-in-outline"
          onPress={() => router.push('/(auth)/login')}
          fullWidth
        />
        <Button
          title="Crear una cuenta"
          icon="person-add-outline"
          variant="secondary"
          onPress={() => router.push('/(auth)/register')}
          fullWidth
        />
        <Button
          title="Explorar como invitado"
          icon="compass-outline"
          variant="outline"
          onPress={() => void handleGuest()}
          loading={startingGuest}
          fullWidth
        />
      </View>

      <View style={styles.features}>
        {features.map((feature) => (
          <View key={feature.title} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.featureTexts}>
              <AppText variant="bodyStrong">{feature.title}</AppText>
              <AppText variant="small" color={colors.textSecondary}>
                {feature.text}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <AppText variant="caption" color={colors.textMuted} align="center">
        RocaDex · Los datos se almacenan en el servidor del curso.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.md },
  logo: {
    width: 68,
    height: 68,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTexts: { gap: 2 },
  hero: { minHeight: 250, justifyContent: 'center', borderColor: '#99F6E4' },
  heroDecorOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(15, 118, 110, 0.10)',
    right: -60,
    top: -60,
  },
  heroDecorTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    right: 30,
    bottom: -50,
  },
  heroContent: { gap: spacing.md },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  actions: { gap: spacing.sm },
  features: { gap: spacing.md, marginTop: spacing.sm },
  feature: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTexts: { flex: 1, gap: 2 },
});
