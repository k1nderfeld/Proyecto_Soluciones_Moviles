import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, radii, spacing } from '@/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <AppModal
    visible={visible}
    title={title}
    onClose={onCancel}
    footer={
      <>
        <Button
          title={cancelLabel}
          variant="outline"
          onPress={onCancel}
          disabled={loading}
          style={styles.flex}
        />
        <Button
          title={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          onPress={onConfirm}
          loading={loading}
          style={styles.flex}
        />
      </>
    }
  >
    <View style={styles.row}>
      <View style={[styles.icon, destructive ? styles.iconDanger : styles.iconInfo]}>
        <Ionicons
          name={destructive ? 'warning-outline' : 'information-circle-outline'}
          size={24}
          color={destructive ? colors.danger : colors.info}
        />
      </View>
      <AppText variant="body" color={colors.textSecondary} style={styles.message}>
        {message}
      </AppText>
    </View>
  </AppModal>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: { backgroundColor: colors.dangerSoft },
  iconInfo: { backgroundColor: colors.infoSoft },
  message: { flex: 1 },
  flex: { flex: 1 },
});
