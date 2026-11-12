import React from 'react';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <EmptyState
        icon="map-outline"
        title="Esta página no existe"
        message="Puede que el enlace esté incompleto o que la pantalla se haya movido."
        actionLabel="Volver al inicio"
        onAction={() => router.replace('/')}
        tone="primary"
      />
    </Screen>
  );
}
