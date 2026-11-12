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
import type { User } from '@/types/api';

const schema = z.object({
  userName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'Máximo 255 caracteres'),
  phone: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

type ProfileValues = z.infer<typeof schema>;

interface ProfileFormProps {
  user: User;
  onSubmit: (values: { userName: string; phone?: string }) => Promise<void>;
}

export const ProfileForm = ({ user, onSubmit }: ProfileFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: { userName: user.userName, phone: user.phone ?? '' },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccess(null);
    try {
      await onSubmit({
        userName: values.userName.trim(),
        phone: values.phone?.trim() ?? '',
      });
      setSuccess('Datos actualizados correctamente.');
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <View style={styles.form}>
      {serverError ? <AlertBanner tone="danger" message={serverError} /> : null}
      {success ? <AlertBanner tone="success" message={success} /> : null}
      <Controller
        control={control}
        name="userName"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Nombre de usuario"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.userName?.message}
            leftIcon="person-outline"
            autoCapitalize="words"
            autoComplete="name"
            maxLength={255}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Teléfono"
            placeholder="+56 9 1234 5678"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={255}
          />
        )}
      />
      <Button
        title="Guardar cambios"
        onPress={submit}
        loading={isSubmitting}
        icon="save-outline"
        fullWidth
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
