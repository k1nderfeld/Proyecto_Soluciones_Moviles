import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { BootScreen } from '@/components/ui/BootScreen';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

const headerOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
  headerShadowVisible: false,
  headerBackTitle: 'Atrás',
} as const;

export default function AdminLayout() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) return <BootScreen />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (!isAdmin) return <Redirect href="/home" />;

  return (
    <Stack
      screenOptions={{
        ...headerOptions,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ title: 'Usuarios' }} />
      <Stack.Screen name="users/[id]" options={{ title: 'Detalle de usuario' }} />
      <Stack.Screen name="rocks" options={{ title: 'Catálogo de rocas' }} />
      <Stack.Screen name="rocks/[id]" options={{ title: 'Editar roca' }} />
      <Stack.Screen name="types" options={{ title: 'Tipos de roca' }} />
      <Stack.Screen name="categories" options={{ title: 'Categorías' }} />
      <Stack.Screen name="achievements" options={{ title: 'Logros' }} />
      <Stack.Screen name="recognitions" options={{ title: 'Reconocimientos' }} />
      <Stack.Screen name="feedback" options={{ title: 'Retroalimentación' }} />
    </Stack>
  );
}
