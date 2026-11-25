import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isGuest } = useAuth();

  return (
    <Screen keyboard>
      <ScreenHeader
        showBack
        title="Crear una cuenta"
        subtitle="Guarda tus rocas, logros y todo tu progreso."
      />

      {isGuest ? (
        <AlertBanner
          tone="success"
          title="Tu progreso viaja con la cuenta"
          message="Al registrarte, tus descubrimientos, reconocimientos y logros de invitado se transferirán automáticamente."
        />
      ) : null}

      <Card>
        <RegisterForm
          onSubmit={async (values) => {
            await signUp(values);
          }}
        />
      </Card>

      <View style={styles.footer}>
        <AppText variant="small" color={colors.textSecondary} align="center">
          ¿Ya tienes una cuenta?
        </AppText>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Ir a iniciar sesión"
          onPress={() => router.replace('/(auth)/login')}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Ionicons name="log-in-outline" size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            Iniciar sesión
          </AppText>
        </Pressable>
      </View>

      <AppText variant="caption" color={colors.textMuted} align="center">
        Al crear una cuenta aceptas que tus datos se guarden en el servidor del proyecto académico.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', gap: spacing.xs },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.65 },
});
