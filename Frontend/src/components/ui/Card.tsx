import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'surface' | 'alt' | 'primary' | 'accent';
}

const tones = {
  surface: colors.surface,
  alt: colors.surfaceAlt,
  primary: colors.primarySoft,
  accent: colors.accentSoft,
};

export const Card = ({ children, style, padded = true, tone = 'surface' }: CardProps) => (
  <View
    style={[
      styles.base,
      { backgroundColor: tones[tone] },
      tone === 'surface' && shadows.card,
      padded && styles.padded,
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg },
});
