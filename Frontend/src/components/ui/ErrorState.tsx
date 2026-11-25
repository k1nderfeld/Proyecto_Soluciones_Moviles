import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { getErrorMessage } from '@/utils/errors';
import { colors, radii, spacing } from '@/theme';

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ErrorState = ({ error, title = 'No pudimos cargar la información', onRetry, compact }: ErrorStateProps) => (
  <View
    style={[styles.container, compact && styles.compact]}
    accessibilityRole="alert"
    accessibilityLiveRegion="polite"
  >
    <View style={styles.iconCircle}>
      <Ionicons name="cloud-offline-outline" size={26} color={colors.danger} />
    </View>
    <AppText variant="subheading" align="center">
      {title}
    </AppText>
    <AppText variant="small" color={colors.textSecondary} align="center">
      {getErrorMessage(error)}
    </AppText>
    {onRetry ? (
      <Button title="Reintentar" onPress={onRetry} variant="outline" size="sm" icon="refresh" style={styles.action} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  compact: { paddingVertical: spacing.lg },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: { marginTop: spacing.sm },
});
