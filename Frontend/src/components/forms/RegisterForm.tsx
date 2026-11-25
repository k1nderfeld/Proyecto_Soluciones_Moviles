import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { getErrorMessage } from '@/utils/errors';
import { spacing } from '@/theme';

const schema = z
  .object({
    userName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(255, 'Máximo 255 caracteres'),
    email: z
      .string()
      .min(1, 'Ingresa tu correo electrónico')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ingresa un correo válido'),
    phone: z.string().max(255, 'Máximo 255 caracteres').optional(),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña admite hasta 72 caracteres'),
    confirmPassword: z.string().min(1, 'Repite la contraseña'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

type RegisterValues = z.infer<typeof schema>;

interface RegisterFormProps {
  onSubmit: (values: {
    userName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
}

export const RegisterForm = ({ onSubmit }: RegisterFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      userName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const submit = () => {
    void handleSubmit(async (values) => {
      setServerError(null);
      try {
        await onSubmit({
          userName: values.userName.trim(),
          email: values.email.trim(),
          password: values.password,
          phone: values.phone?.trim() || undefined,
        });
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
        name="userName"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Nombre de usuario"
            placeholder="Cómo quieres aparecer"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.userName?.message}
            leftIcon="person-outline"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={255}
          />
        )}
      />
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
            maxLength={255}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Teléfono (opcional)"
            placeholder="+56 9 1234 5678"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={255}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            helper="Usa al menos 8 caracteres. Evita contraseñas que uses en otros sitios."
            leftIcon="lock-closed-outline"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Repetir contraseña"
            placeholder="Vuelve a escribirla"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
            leftIcon="shield-checkmark-outline"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={72}
            onSubmitEditing={submit}
          />
        )}
      />
      <Button
        title="Crear mi cuenta"
        onPress={submit}
        loading={isSubmitting}
        fullWidth
        icon="person-add-outline"
        style={styles.submit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  submit: { marginTop: spacing.xs },
});
