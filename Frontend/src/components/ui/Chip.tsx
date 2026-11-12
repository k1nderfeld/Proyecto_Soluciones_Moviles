import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: StyleProp<ViewStyle>;
}

export const Chip = ({ label, selected = false, onPress, icon, style }: ChipProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={`${label}${selected ? ', seleccionado' : ''}`}
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      styles.base,
      selected ? styles.selected : styles.unselected,
      pressed && onPress ? styles.pressed : null,
      style,
    ]}
  >
    {selected ? <Ionicons name="checkmark" size={15} color={colors.primaryText} /> : null}
    {!selected && icon ? <Ionicons name={icon} size={15} color={colors.textSecondary} /> : null}
    <AppText
      variant="label"
      color={selected ? colors.primaryText : colors.textSecondary}
      numberOfLines={1}
    >
      {label}
    </AppText>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  unselected: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  pressed: { opacity: 0.75 },
});
