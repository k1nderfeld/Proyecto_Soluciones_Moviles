import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { BootScreen } from '@/components/ui/BootScreen';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <BootScreen />;
  if (isAuthenticated) return <Redirect href="/home" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
