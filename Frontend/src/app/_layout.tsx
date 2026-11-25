import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { TaxonomyProvider } from '@/context/TaxonomyContext';
import { colors } from '@/theme';

const headerOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
  headerShadowVisible: false,
  headerBackTitle: 'Atrás',
} as const;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TaxonomyProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="catalog/[id]"
              options={{ ...headerOptions, title: 'Detalle de la roca' }}
            />
            <Stack.Screen
              name="feedback/[analysisId]"
              options={{ ...headerOptions, title: 'Retroalimentación' }}
            />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen
              name="+not-found"
              options={{ ...headerOptions, title: 'Página no encontrada' }}
            />
          </Stack>
        </TaxonomyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
