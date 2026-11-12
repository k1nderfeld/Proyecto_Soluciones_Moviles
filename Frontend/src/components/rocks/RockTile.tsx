import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { RockImage } from './RockImage';
import { useTaxonomy } from '@/context/TaxonomyContext';
import type { Rock } from '@/types/api';
import { colors, spacing } from '@/theme';

interface RockTileProps {
  rock: Rock;
}

export const RockTile = ({ rock }: RockTileProps) => {
  const router = useRouter();
  const { typeName } = useTaxonomy();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Ver detalle de ${rock.name}`}
      onPress={() => router.push(`/catalog/${rock.id}`)}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      <Card padded={false}>
        <RockImage uri={rock.imgUrl} label={rock.name} height={100} compact style={styles.image} />
        <View style={styles.body}>
          <AppText variant="bodyStrong" numberOfLines={2} style={styles.name}>
            {rock.name}
          </AppText>
          <Badge label={typeName(rock.typeId)} tone="primary" />
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: 170 },
  pressed: { opacity: 0.82 },
  image: { borderRadius: 0 },
  body: { padding: spacing.md, gap: spacing.xs, minHeight: 86 },
  name: { color: colors.text },
});
