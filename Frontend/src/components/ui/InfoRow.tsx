import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

interface InfoRowProps {
  label: string;
  value?: string | number | null;
  last?: boolean;
}

export const InfoRow = ({ label, value, last = false }: InfoRowProps) => (
  <View style={[styles.row, !last && styles.divider]}>
    <AppText variant="small" color={colors.textMuted} style={styles.label}>
      {label}
    </AppText>
    <AppText variant="bodyStrong" style={styles.value}>
      {value === null || value === undefined || value === '' ? '—' : String(value)}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { width: 118 },
  value: { flex: 1, textAlign: 'right' },
});
