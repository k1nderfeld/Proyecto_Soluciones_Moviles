import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { LoginForm } from '@/components/forms/LoginForm';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isGuest } = useAuth();

  return (
    <Screen keyboard>
      <ScreenHeader
        showBack
        title="Iniciar sesión"
        subtitle="Accede para conservar tu colección y tus logros."
      />

      {isGuest ? (
        <AlertBanner
          tone="info"
          message="Tienes una sesión de invitado activa. Al iniciar sesión intentaremos transferir automáticamente tus descubrimientos a tu cuenta."
        />
      ) : null}

      <Card>
        <LoginForm
          onSubmit={async (values) => {
            await signIn(values.email.trim(), values.password);
          }}
        />
      </Card>

      <View style={styles.footer}>
        <AppText variant="small" color={colors.textSecondary} align="center">
          ¿Todavía no tienes cuenta?
        </AppText>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Ir a crear una cuenta"
          onPress={() => router.replace('/(auth)/register')}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <Ionicons name="person-add-outline" size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            Crear una cuenta
          </AppText>
        </Pressable>
      </View>

      <AppText variant="caption" color={colors.textMuted} align="center">
        Usa las credenciales entregadas por el docente o las de tu cuenta registrada.
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
