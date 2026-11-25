import React, { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme';

interface RockImageProps {
  uri?: string | null;
  label: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const RockImage = ({ uri, label, height = 120, style, compact = false }: RockImageProps) => {
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const showPlaceholder = !uri || failedUri === uri;

  return (
    <View style={[styles.container, { height }, style]}>
      {showPlaceholder ? (
        <View style={styles.placeholder}>
          <Ionicons
            name="diamond-outline"
            size={compact ? 22 : 32}
            color={colors.textMuted}
          />
          {!compact ? (
            <AppText variant="caption" color={colors.textMuted} align="center">
              Imagen no disponible
            </AppText>
          ) : null}
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailedUri(uri ?? null)}
          accessibilityIgnoresInvertColors
          accessibilityLabel={`Fotografía de ${label}`}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    borderRadius: radii.md,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
  },
});
