import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { RockImage } from './RockImage';
import { useTaxonomy } from '@/context/TaxonomyContext';
import type { Rock } from '@/types/api';
import { colors, spacing } from '@/theme';

interface RockCardProps {
  rock: Rock;
  onPress?: () => void;
}

export const RockCard = ({ rock, onPress }: RockCardProps) => {
  const router = useRouter();
  const { typeName, categoryName } = useTaxonomy();
  const handlePress = onPress ?? (() => router.push(`/catalog/${rock.id}`));

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Ver detalle de ${rock.name}`}
      accessibilityHint="Abre la ficha completa de la roca"
      onPress={handlePress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card padded={false} style={styles.card}>
        <RockImage
          uri={rock.imgUrl}
          label={rock.name}
          height={112}
          compact
          style={styles.image}
        />
        <View style={styles.body}>
          <View style={styles.texts}>
            <AppText variant="subheading" numberOfLines={2}>
              {rock.name}
            </AppText>
            <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
              {rock.scientificName}
            </AppText>
          </View>
          <View style={styles.badges}>
            <Badge label={typeName(rock.typeId)} tone="primary" />
            <Badge label={categoryName(rock.categoryId)} tone="neutral" />
          </View>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="hardware-chip-outline" size={14} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textSecondary}>
                Dureza {rock.hardness}
              </AppText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="color-palette-outline" size={14} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {rock.color}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 128,
    paddingRight: spacing.sm,
  },
  image: { width: 112, borderRadius: 0, alignSelf: 'stretch', height: 'auto' },
  body: { flex: 1, padding: spacing.md, gap: spacing.xs + 2, justifyContent: 'center' },
  texts: { gap: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chevron: { justifyContent: 'center' },
  pressed: { opacity: 0.82 },
});
