import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme';

interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  tone?: 'primary' | 'accent';
}

export const ProgressBar = ({ value, label, showValue = true, tone = 'primary' }: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <View style={styles.container}>
      {label || showValue ? (
        <View style={styles.row}>
          {label ? (
            <AppText variant="label" color={colors.textSecondary}>
              {label}
            </AppText>
          ) : null}
          {showValue ? (
            <AppText variant="label" color={colors.textSecondary}>
              {Math.round(clamped)} %
            </AppText>
          ) : null}
        </View>
      ) : null}
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: tone === 'primary' ? colors.primary : colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.pill },
});
