import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppText } from '@/components/ui/AppText';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { getErrorMessage } from '@/utils/errors';
import { colors, spacing } from '@/theme';
import type { Achievement, AchievementPayload } from '@/types/api';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Ingresa el nombre').max(255, 'Máximo 255 caracteres'),
    slug: z
      .string()
      .trim()
      .min(1, 'Ingresa el identificador')
      .max(255, 'Máximo 255 caracteres')
      .regex(/^[a-z0-9-]+$/, 'Usa solo minúsculas, números y guiones'),
    description: z.string().trim().min(1, 'Ingresa la descripción').max(255, 'Máximo 255 caracteres'),
    experience: z
      .string()
      .refine((value) => value.trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0, {
        message: 'Ingresa una experiencia entera mayor o igual a 0',
      }),
    conditionType: z.enum(['none', 'distinct_rocks', 'total_recognitions']),
    conditionValue: z.string().optional(),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.conditionType === 'none') return;
    const parsed = Number(values.conditionValue);
    if (!values.conditionValue?.trim() || !Number.isInteger(parsed) || parsed < 1) {
      context.addIssue({
        code: 'custom',
        path: ['conditionValue'],
        message: 'Indica una cantidad entera mayor o igual a 1',
      });
    }
  });

type AchievementValues = z.infer<typeof schema>;

interface AchievementFormProps {
  achievement?: Achievement | null;
  onSubmit: (payload: AchievementPayload) => Promise<void>;
  submitLabel?: string;
}

const conditionOptions = [
  { value: 'none' as const, label: 'Sin condición', icon: 'remove-circle-outline' as const },
  { value: 'distinct_rocks' as const, label: 'Rocas distintas', icon: 'diamond-outline' as const },
  {
    value: 'total_recognitions' as const,
    label: 'Reconocimientos',
    icon: 'scan-outline' as const,
  },
];

export const AchievementForm = ({
  achievement,
  onSubmit,
  submitLabel = 'Guardar logro',
}: AchievementFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AchievementValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: achievement?.name ?? '',
      slug: achievement?.slug ?? '',
      description: achievement?.description ?? '',
      experience: achievement ? String(achievement.experience) : '10',
      conditionType: achievement?.conditionType ?? 'none',
      conditionValue: achievement?.conditionValue != null ? String(achievement.conditionValue) : '',
      isActive: achievement?.isActive ?? true,
    },
  });

  const conditionType = useWatch({ control, name: 'conditionType' });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        slug: values.slug.trim().toLowerCase(),
        description: values.description.trim(),
        experience: Number(values.experience),
        conditionType: values.conditionType === 'none' ? null : values.conditionType,
        conditionValue:
          values.conditionType === 'none' || !values.conditionValue?.trim()
            ? null
            : Number(values.conditionValue),
        isActive: values.isActive,
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <View style={styles.form}>
      {serverError ? <AlertBanner tone="danger" message={serverError} /> : null}
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Nombre *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
            placeholder="Primer descubrimiento"
          />
        )}
      />
      <Controller
        control={control}
        name="slug"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Identificador *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.slug?.message}
            placeholder="primer-descubrimiento"
            autoCapitalize="none"
            autoCorrect={false}
            helper="Único. Solo minúsculas, números y guiones."
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Descripción *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
            multiline
            maxLength={255}
            helper={`${value.length}/255 caracteres`}
          />
        )}
      />
      <Controller
        control={control}
        name="experience"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Experiencia *"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.experience?.message}
            keyboardType="number-pad"
            helper="Puntos otorgados al desbloquear el logro."
          />
        )}
      />
      <View style={styles.fieldBlock}>
        <AppText variant="label" color={colors.textSecondary}>
          Condición automática
        </AppText>
        <Controller
          control={control}
          name="conditionType"
          render={({ field: { value, onChange } }) => (
            <View style={styles.chips}>
              {conditionOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  selected={value === option.value}
                  onPress={() => onChange(option.value)}
                />
              ))}
            </View>
          )}
        />
      </View>
      {conditionType !== 'none' ? (
        <Controller
          control={control}
          name="conditionValue"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Cantidad requerida *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.conditionValue?.message}
              keyboardType="number-pad"
              helper="El logro se concede al alcanzar esta cantidad."
            />
          )}
        />
      ) : null}
      <View style={styles.switchRow}>
        <View style={styles.switchTexts}>
          <AppText variant="bodyStrong">Logro activo</AppText>
          <AppText variant="small" color={colors.textMuted}>
            Si lo desactivas deja de mostrarse y evaluarse.
          </AppText>
        </View>
        <Controller
          control={control}
          name="isActive"
          render={({ field: { value, onChange } }) => (
            <Switch
              value={value}
              onValueChange={onChange}
              accessibilityLabel="Logro activo"
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              thumbColor={colors.white}
            />
          )}
        />
      </View>
      <Button
        title={submitLabel}
        onPress={submit}
        loading={isSubmitting}
        icon="trophy-outline"
        fullWidth
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  fieldBlock: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  switchTexts: { flex: 1, gap: 2 },
});
