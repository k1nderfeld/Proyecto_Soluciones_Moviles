import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, layout, radii, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconRight?: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const palette: Record<Variant, { background: string; border: string; text: string; pressed: string }> = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: colors.textOnPrimary,
    pressed: colors.primaryDark,
  },
  secondary: {
    background: colors.primarySoft,
    border: colors.primarySoft,
    text: colors.primaryText,
    pressed: '#B2F5EA',
  },
  outline: {
    background: 'transparent',
    border: colors.borderStrong,
    text: colors.text,
    pressed: colors.surfaceAlt,
  },
  ghost: {
    background: 'transparent',
    border: 'transparent',
    text: colors.primary,
    pressed: colors.primarySoft,
  },
  danger: {
    background: colors.danger,
    border: colors.danger,
    text: colors.white,
    pressed: '#991B1B',
  },
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  style,
}: ButtonProps) => {
  const isDisabled = disabled || loading;
  const tone = palette[variant];
  const iconSize = size === 'sm' ? 18 : 20;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.small,
        {
          backgroundColor: pressed && !isDisabled ? tone.pressed : tone.background,
          borderColor: tone.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={iconSize} color={tone.text} /> : null}
          <AppText
            variant={size === 'sm' ? 'label' : 'bodyStrong'}
            color={tone.text}
            numberOfLines={1}
          >
            {title}
          </AppText>
          {iconRight ? <Ionicons name={iconRight} size={iconSize} color={tone.text} /> : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
