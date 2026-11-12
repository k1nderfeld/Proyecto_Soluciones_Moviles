import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme';

export type AlertTone = 'danger' | 'success' | 'warning' | 'info';

const tones: Record<
  AlertTone,
  { background: string; border: string; text: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  danger: {
    background: colors.dangerSoft,
    border: '#FECACA',
    text: colors.danger,
    icon: 'alert-circle',
  },
  success: {
    background: colors.successSoft,
    border: '#BBF7D0',
    text: colors.success,
    icon: 'checkmark-circle',
  },
  warning: {
    background: colors.warningSoft,
    border: '#FDE68A',
    text: colors.warning,
    icon: 'warning',
  },
  info: {
    background: colors.infoSoft,
    border: '#BFDBFE',
    text: colors.info,
    icon: 'information-circle',
  },
};

interface AlertBannerProps {
  tone?: AlertTone;
  message: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const AlertBanner = ({
  tone = 'info',
  message,
  title,
  actionLabel,
  onAction,
}: AlertBannerProps) => {
  const palette = tones[tone];
  return (
    <View
      style={[styles.base, { backgroundColor: palette.background, borderColor: palette.border }]}
      accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}
      accessibilityLiveRegion={tone === 'danger' ? 'polite' : 'none'}
    >
      <Ionicons name={palette.icon} size={20} color={palette.text} style={styles.icon} />
      <View style={styles.content}>
        {title ? (
          <AppText variant="label" color={palette.text}>
            {title}
          </AppText>
        ) : null}
        <AppText variant="small" color={palette.text}>
          {message}
        </AppText>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <AppText variant="label" color={palette.text} style={styles.actionText}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  icon: { marginTop: 1 },
  content: { flex: 1, gap: 2 },
  action: { marginTop: spacing.xs, alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  actionText: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
});
