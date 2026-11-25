import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors, radii, spacing } from '@/theme';

type Tone = 'primary' | 'accent' | 'success' | 'info';

const tones: Record<Tone, { background: string; icon: string }> = {
  primary: { background: colors.primarySoft, icon: colors.primary },
  accent: { background: colors.accentSoft, icon: colors.accentText },
  success: { background: colors.successSoft, icon: colors.success },
  info: { background: colors.infoSoft, icon: colors.info },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone?: Tone;
  hint?: string;
}

export const StatCard = ({ label, value, icon, tone = 'primary', hint }: StatCardProps) => (
  <Card style={styles.card}>
    <View style={[styles.icon, { backgroundColor: tones[tone].background }]}>
      <Ionicons name={icon} size={20} color={tones[tone].icon} />
    </View>
    <View style={styles.texts}>
      <AppText variant="title" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="small" color={colors.textSecondary} numberOfLines={2}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150, gap: spacing.sm, padding: spacing.md },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { gap: 2 },
});
