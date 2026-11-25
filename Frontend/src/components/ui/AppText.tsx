import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '@/theme';

type Variant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export const AppText = ({
  variant = 'body',
  color = colors.text,
  align,
  style,
  children,
  ...rest
}: AppTextProps) => (
  <Text
    style={[typography[variant], { color, textAlign: align }, style]}
    allowFontScaling
    {...rest}
  >
    {children}
  </Text>
);
