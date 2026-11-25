import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from '@/theme';

interface AvatarProps {
  name?: string | null;
  size?: number;
  tone?: 'primary' | 'accent';
}

const initials = (name?: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

export const Avatar = ({ name, size = 48, tone = 'primary' }: AvatarProps) => (
  <View
    style={[
      styles.base,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone === 'primary' ? colors.primary : colors.accent,
      },
    ]}
    accessibilityLabel={name ? `Avatar de ${name}` : 'Avatar'}
  >
    <AppText
      variant={size >= 56 ? 'heading' : 'bodyStrong'}
      color={colors.white}
      style={{ fontSize: size * 0.36 }}
    >
      {initials(name)}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
