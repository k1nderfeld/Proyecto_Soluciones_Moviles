import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { getErrorMessage } from '@/utils/errors';
import { spacing } from '@/theme';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Ingresa tu correo electrónico')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginValues = z.infer<typeof schema>;

interface LoginFormProps {
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
  submitLabel?: string;
}

export const LoginForm = ({ onSubmit, submitLabel = 'Iniciar sesión' }: LoginFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = () => {
    void handleSubmit(async (values) => {
      setServerError(null);
      try {
        await onSubmit(values);
      } catch (error) {
        setServerError(getErrorMessage(error));
      }
    })();
  };

  return (
    <View style={styles.form}>
      {serverError ? <AlertBanner tone="danger" message={serverError} /> : null}
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Correo electrónico"
            placeholder="nombre@ejemplo.cl"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Contraseña"
            placeholder="Tu contraseña"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            leftIcon="lock-closed-outline"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        )}
      />
      <Button
        title={submitLabel}
        onPress={submit}
        loading={isSubmitting}
        fullWidth
        icon="log-in-outline"
        style={styles.submit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  submit: { marginTop: spacing.xs },
});
