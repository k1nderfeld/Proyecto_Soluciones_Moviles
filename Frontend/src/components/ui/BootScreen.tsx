import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radii, spacing } from '@/theme';

export const BootScreen = () => (
  <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Cargando aplicación">
    <View style={styles.mark}>
      <Ionicons name="diamond" size={34} color={colors.primary} />
    </View>
    <AppText variant="heading">RocaDex</AppText>
    <AppText variant="small" color={colors.textMuted}>
      Preparando tu sesión…
    </AppText>
    <ActivityIndicator color={colors.primary} style={styles.spinner} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  mark: {
    width: 84,
    height: 84,
    borderRadius: radii.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  spinner: { marginTop: spacing.md },
});
