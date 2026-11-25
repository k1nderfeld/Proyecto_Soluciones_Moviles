import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

interface LoadingStateProps {
  message?: string;
  compact?: boolean;
}

export const LoadingState = ({ message = 'Cargando…', compact = false }: LoadingStateProps) => (
  <View
    style={[styles.container, compact && styles.compact]}
    accessibilityRole="progressbar"
    accessibilityLabel={message}
  >
    <ActivityIndicator size="large" color={colors.primary} />
    <AppText variant="small" color={colors.textSecondary}>
      {message}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  compact: { minHeight: 100, paddingVertical: spacing.lg },
});
