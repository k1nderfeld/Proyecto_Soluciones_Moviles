import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme';

type Tone = 'primary' | 'accent' | 'info' | 'success';

const tones: Record<Tone, { background: string; icon: string }> = {
  primary: { background: colors.primarySoft, icon: colors.primary },
  accent: { background: colors.accentSoft, icon: colors.accentText },
  info: { background: colors.infoSoft, icon: colors.info },
  success: { background: colors.successSoft, icon: colors.success },
};

interface ActionTileProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone?: Tone;
  onPress: () => void;
  badge?: string;
}

export const ActionTile = ({ title, subtitle, icon, tone = 'primary', onPress, badge }: ActionTileProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={subtitle}
    onPress={onPress}
    style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
  >
    <View style={styles.content}>
      <View style={[styles.icon, { backgroundColor: tones[tone].background }]}>
        <Ionicons name={icon} size={22} color={tones[tone].icon} />
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <AppText variant="caption" color={colors.primaryText}>
            {badge}
          </AppText>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 84,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 1 },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
});
