import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader = ({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) => (
  <View style={styles.container}>
    <View style={styles.texts}>
      <AppText variant="heading">{title}</AppText>
      {subtitle ? (
        <AppText variant="small" color={colors.textMuted}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
    {actionLabel && onAction ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        hitSlop={8}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <AppText variant="label" color={colors.primary}>
          {actionLabel}
        </AppText>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  texts: { flex: 1, gap: 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    paddingLeft: spacing.sm,
  },
  pressed: { opacity: 0.65 },
});
