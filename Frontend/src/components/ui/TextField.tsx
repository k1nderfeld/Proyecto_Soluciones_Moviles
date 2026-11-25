import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, layout, radii, spacing, typography } from '@/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = React.forwardRef<React.ComponentRef<typeof TextInput>, TextFieldProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      containerStyle,
      secureTextEntry,
      multiline,
      onFocus,
      onBlur,
      accessibilityLabel,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(Boolean(secureTextEntry));

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <AppText variant="label" style={styles.label}>
            {label}
          </AppText>
        ) : null}
        <View
          style={[
            styles.field,
            multiline && styles.multiline,
            focused && styles.fieldFocused,
            error ? styles.fieldError : null,
          ]}
        >
          {leftIcon ? (
            <Ionicons name={leftIcon} size={19} color={colors.textMuted} style={styles.leftIcon} />
          ) : null}
          <TextInput
            ref={ref}
            accessibilityLabel={accessibilityLabel ?? label ?? rest.placeholder}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, multiline && styles.multilineInput]}
            secureTextEntry={hidden}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            {...rest}
          />
          {secureTextEntry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
              onPress={() => setHidden((value) => !value)}
              hitSlop={8}
              style={styles.eye}
            >
              <Ionicons
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={21}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : helper ? (
          <AppText variant="small" color={colors.textMuted}>
            {helper}
          </AppText>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  container: { gap: spacing.xs + 2 },
  label: { color: colors.textSecondary },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.minTouchTarget,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    paddingHorizontal: spacing.md - 1,
  },
  fieldError: { borderColor: colors.danger },
  multiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  multilineInput: { minHeight: 96 },
  leftIcon: { marginRight: spacing.sm },
  eye: { paddingLeft: spacing.sm, paddingVertical: spacing.xs },
});
