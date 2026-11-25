import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const tones: Record<BadgeTone, { background: string; text: string; border: string }> = {
  primary: { background: colors.primarySoft, text: colors.primaryText, border: '#99F6E4' },
  success: { background: colors.successSoft, text: colors.success, border: '#BBF7D0' },
  warning: { background: colors.warningSoft, text: colors.warning, border: '#FDE68A' },
  danger: { background: colors.dangerSoft, text: colors.danger, border: '#FECACA' },
  neutral: { background: colors.surfaceAlt, text: colors.textSecondary, border: colors.border },
  info: { background: colors.infoSoft, text: colors.info, border: '#BFDBFE' },
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: StyleProp<ViewStyle>;
}

export const Badge = ({ label, tone = 'neutral', icon, style }: BadgeProps) => {
  const palette = tones[tone];
  return (
    <View
      style={[styles.base, { backgroundColor: palette.background, borderColor: palette.border }, style]}
      accessibilityLabel={label}
    >
      {icon ? <Ionicons name={icon} size={13} color={palette.text} /> : null}
      <AppText variant="caption" color={palette.text} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
