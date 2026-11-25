import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { RockImage } from '@/components/rocks/RockImage';
import { formatDateTime } from '@/utils/format';
import type { Analysis } from '@/types/api';
import { colors, spacing } from '@/theme';

interface AnalysisRowProps {
  analysis: Analysis;
  onPress?: () => void;
  meta?: string;
}

export const AnalysisRow = ({ analysis, onPress, meta }: AnalysisRowProps) => {
  const content = (
    <Card padded={false} style={styles.card}>
      <RockImage
        uri={analysis.rock?.imgUrl}
        label={analysis.rock?.name ?? analysis.result}
        height={72}
        compact
        style={styles.image}
      />
      <View style={styles.body}>
        <View style={styles.texts}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {analysis.rock?.name ?? analysis.result}
          </AppText>
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
            {formatDateTime(analysis.createdAt)}
            {meta ? ` · ${meta}` : ''}
          </AppText>
        </View>
        <Badge
          label={`${analysis.confidence}%`}
          tone={analysis.confidence >= 70 ? 'success' : analysis.confidence >= 40 ? 'warning' : 'danger'}
          icon="analytics-outline"
        />
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Card>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver reconocimiento de ${analysis.rock?.name ?? analysis.result}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    gap: spacing.md,
    minHeight: 80,
  },
  image: { width: 72, borderRadius: 0, alignSelf: 'stretch', height: 'auto' },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  texts: { flex: 1, gap: 2 },
  pressed: { opacity: 0.82 },
});
