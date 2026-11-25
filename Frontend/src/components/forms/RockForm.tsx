import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppText } from '@/components/ui/AppText';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { getErrorMessage } from '@/utils/errors';
import { colors, spacing } from '@/theme';
import type { CategoryItem, Rock, RockPayload, TypeItem } from '@/types/api';

const requiredText = (label: string, max = 255) =>
  z
    .string()
    .trim()
    .min(1, `Ingresa ${label}`)
    .max(max, `Máximo ${max} caracteres`);

const numberString = (
  label: string,
  options: { min?: number; max?: number; integer?: boolean; optional?: boolean } = {},
) => {
  const { min, max, integer = false, optional = false } = options;
  const range =
    min !== undefined && max !== undefined
      ? ` entre ${min} y ${max}`
      : min !== undefined
        ? ` mayor o igual a ${min}`
        : max !== undefined
          ? ` menor o igual a ${max}`
          : '';

  return z
    .string()
    .refine(
      (value) => {
        if (optional && !value.trim()) return true;
        const parsed = Number(value);
        return value.trim() !== '' && Number.isFinite(parsed) && (!integer || Number.isInteger(parsed));
      },
      { message: `Ingresa ${label} como número${integer ? ' entero' : ''}` },
    )
    .refine(
      (value) => {
        if (optional && !value.trim()) return true;
        const parsed = Number(value);
        return (min === undefined || parsed >= min) && (max === undefined || parsed <= max);
      },
      { message: `El valor debe ser${range}` },
    );
};

const schema = z.object({
  index: numberString('el índice', { integer: true, min: 1 }),
  name: requiredText('el nombre'),
  scientificName: requiredText('el nombre científico'),
  description: requiredText('la descripción'),
  composition: requiredText('la composición'),
  formula: requiredText('la fórmula'),
  molarWeight: numberString('el peso molar', { min: 0, optional: true }),
  environment: requiredText('el ambiente'),
  commonUses: requiredText('los usos comunes'),
  hardness: numberString('la dureza', { integer: true, min: 1, max: 10 }),
  streak: requiredText('la raya'),
  color: requiredText('el color'),
  texture: requiredText('la textura'),
  density: numberString('la densidad', { min: 0 }),
  transparency: numberString('la transparencia', { min: 0 }),
  tenacity: numberString('la tenacidad', { min: 0 }),
  imgUrl: requiredText('la URL de la imagen', 500),
  mindatUrl: requiredText('la URL de Mindat', 500),
  typeId: z.number().int().positive('Selecciona un tipo'),
  categoryId: z.number().int().positive('Selecciona una categoría'),
});

type RockValues = z.infer<typeof schema>;

interface RockFormProps {
  rock?: Rock | null;
  types: TypeItem[];
  categories: CategoryItem[];
  onSubmit: (payload: RockPayload) => Promise<void>;
  submitLabel?: string;
}

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.group}>
    <AppText variant="subheading">{title}</AppText>
    {children}
  </View>
);

const defaultsFor = (rock: Rock | null | undefined, types: TypeItem[], categories: CategoryItem[]): RockValues => ({
  index: rock ? String(rock.index) : '',
  name: rock?.name ?? '',
  scientificName: rock?.scientificName ?? '',
  description: rock?.description ?? '',
  composition: rock?.composition ?? '',
  formula: rock?.formula ?? '',
  molarWeight: rock?.molarWeight != null ? String(rock.molarWeight) : '',
  environment: rock?.environment ?? '',
  commonUses: rock?.commonUses ?? '',
  hardness: rock ? String(rock.hardness) : '5',
  streak: rock?.streak ?? '',
  color: rock?.color ?? '',
  texture: rock?.texture ?? '',
  density: rock?.density != null ? String(rock.density) : '',
  transparency: rock?.transparency != null ? String(rock.transparency) : '',
  tenacity: rock?.tenacity != null ? String(rock.tenacity) : '',
  imgUrl: rock?.imgUrl ?? '',
  mindatUrl: rock?.mindatUrl ?? 'https://www.mindat.org/',
  typeId: rock?.typeId ?? types[0]?.id ?? 0,
  categoryId: rock?.categoryId ?? categories[0]?.id ?? 0,
});

export const RockForm = ({ rock, types, categories, onSubmit, submitLabel = 'Guardar roca' }: RockFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RockValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(rock, types, categories),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit({
        index: Number(values.index),
        name: values.name.trim(),
        scientificName: values.scientificName.trim(),
        description: values.description.trim(),
        composition: values.composition.trim(),
        formula: values.formula.trim(),
        molarWeight: values.molarWeight.trim() ? Number(values.molarWeight) : null,
        environment: values.environment.trim(),
        commonUses: values.commonUses.trim(),
        hardness: Number(values.hardness),
        streak: values.streak.trim(),
        color: values.color.trim(),
        texture: values.texture.trim(),
        density: Number(values.density),
        transparency: Number(values.transparency),
        tenacity: Number(values.tenacity),
        imgUrl: values.imgUrl.trim(),
        mindatUrl: values.mindatUrl.trim(),
        typeId: values.typeId,
        categoryId: values.categoryId,
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <View style={styles.form}>
      {serverError ? <AlertBanner tone="danger" message={serverError} /> : null}
      {types.length === 0 || categories.length === 0 ? (
        <AlertBanner
          tone="warning"
          message="Necesitas al menos un tipo y una categoría antes de guardar rocas."
        />
      ) : null}

      <Group title="Identificación">
        <View style={styles.row}>
          <Controller
            control={control}
            name="index"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Índice *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.index?.message}
                keyboardType="number-pad"
                containerStyle={styles.flex}
              />
            )}
          />
          <Controller
            control={control}
            name="hardness"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Dureza Mohs *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.hardness?.message}
                keyboardType="number-pad"
                helper="1 a 10"
                containerStyle={styles.flex}
              />
            )}
          />
        </View>
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
              placeholder="Basalto"
            />
          )}
        />
        <Controller
          control={control}
          name="scientificName"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Nombre científico *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.scientificName?.message}
              placeholder="Basalt"
              autoCapitalize="words"
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
        <View style={styles.fieldBlock}>
          <AppText variant="label" color={colors.textSecondary}>
            Tipo *
          </AppText>
          <Controller
            control={control}
            name="typeId"
            render={({ field: { value, onChange } }) => (
              <View style={styles.chips}>
                {types.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.name}
                    selected={value === item.id}
                    onPress={() => onChange(item.id)}
                  />
                ))}
              </View>
            )}
          />
          {errors.typeId?.message ? (
            <AppText variant="small" color={colors.danger}>
              {errors.typeId.message}
            </AppText>
          ) : null}
        </View>
        <View style={styles.fieldBlock}>
          <AppText variant="label" color={colors.textSecondary}>
            Categoría *
          </AppText>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { value, onChange } }) => (
              <View style={styles.chips}>
                {categories.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.name}
                    selected={value === item.id}
                    onPress={() => onChange(item.id)}
                  />
                ))}
              </View>
            )}
          />
          {errors.categoryId?.message ? (
            <AppText variant="small" color={colors.danger}>
              {errors.categoryId.message}
            </AppText>
          ) : null}
        </View>
      </Group>

      <Group title="Propiedades">
        <Controller
          control={control}
          name="composition"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Composición *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.composition?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="formula"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Fórmula *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.formula?.message}
              autoCapitalize="none"
            />
          )}
        />
        <Controller
          control={control}
          name="molarWeight"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Peso molar (opcional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.molarWeight?.message}
              keyboardType="decimal-pad"
              helper="Déjalo vacío si no aplica"
            />
          )}
        />
        <View style={styles.row}>
          <Controller
            control={control}
            name="density"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Densidad *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.density?.message}
                keyboardType="decimal-pad"
                containerStyle={styles.flex}
              />
            )}
          />
          <Controller
            control={control}
            name="transparency"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Transparencia *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.transparency?.message}
                keyboardType="decimal-pad"
                containerStyle={styles.flex}
              />
            )}
          />
          <Controller
            control={control}
            name="tenacity"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="Tenacidad *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.tenacity?.message}
                keyboardType="decimal-pad"
                containerStyle={styles.flex}
              />
            )}
          />
        </View>
        <Controller
          control={control}
          name="color"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Color *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.color?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="streak"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Raya *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.streak?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="texture"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Textura *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.texture?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="environment"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Ambiente *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.environment?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="commonUses"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Usos comunes *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.commonUses?.message}
            />
          )}
        />
      </Group>

      <Group title="Enlaces">
        <Controller
          control={control}
          name="imgUrl"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="URL de imagen *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.imgUrl?.message}
              placeholder="https://…"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        <Controller
          control={control}
          name="mindatUrl"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="URL de Mindat *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.mindatUrl?.message}
              placeholder="https://www.mindat.org/…"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
      </Group>

      <Button
        title={submitLabel}
        onPress={submit}
        loading={isSubmitting}
        icon="save-outline"
        fullWidth
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: spacing.xl },
  group: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  fieldBlock: { gap: spacing.xs },
});
