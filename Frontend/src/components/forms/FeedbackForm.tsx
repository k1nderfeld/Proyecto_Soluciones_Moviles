import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { getErrorMessage } from '@/utils/errors';
import { colors, radii, spacing } from '@/theme';
import type { Feedback } from '@/types/api';

interface FeedbackFormProps {
  initial?: Feedback | null;
  onSubmit: (values: { isCorrect: boolean; comment: string | null }) => Promise<void>;
}

interface ChoiceProps {
  selected: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
}

const Choice = ({ selected, icon, title, description, onPress }: ChoiceProps) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    accessibilityLabel={title}
    onPress={onPress}
    style={({ pressed }) => [
      styles.choice,
      selected && styles.choiceSelected,
      pressed && styles.pressed,
    ]}
  >
    <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
      <Ionicons name={icon} size={22} color={selected ? colors.primaryText : colors.textSecondary} />
    </View>
    <View style={styles.choiceTexts}>
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText variant="small" color={colors.textMuted}>
        {description}
      </AppText>
    </View>
    {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
  </Pressable>
);

export const FeedbackForm = ({ initial, onSubmit }: FeedbackFormProps) => {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(initial?.isCorrect ?? null);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (isCorrect === null) {
      setError('Indica si el reconocimiento fue correcto.');
      return;
    }
    setError(null);
    setServerError(null);
    setSubmitting(true);
    try {
      await onSubmit({ isCorrect, comment: comment.trim() ? comment.trim() : null });
    } catch (caught) {
      setServerError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      {serverError ? <AlertBanner tone="danger" message={serverError} /> : null}
      <View style={styles.question}>
        <AppText variant="subheading">¿El resultado coincidió con tu roca?</AppText>
        <AppText variant="small" color={colors.textMuted}>
          Tu evaluación nos ayuda a mejorar el reconocimiento.
        </AppText>
      </View>
      <View style={styles.choices} accessibilityRole="radiogroup">
        <Choice
          selected={isCorrect === true}
          icon="checkmark"
          title="Sí, fue correcto"
          description="La roca identificada corresponde a mi muestra."
          onPress={() => setIsCorrect(true)}
        />
        <Choice
          selected={isCorrect === false}
          icon="close"
          title="No, fue otra roca"
          description="El resultado no corresponde a lo que fotografié."
          onPress={() => setIsCorrect(false)}
        />
      </View>
      {error ? (
        <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      <TextField
        label="Comentario (opcional)"
        placeholder="Cuéntanos qué esperabas o qué observaste…"
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={2000}
        helper={`${comment.length}/2000 caracteres`}
      />
      <Button
        title={initial ? 'Actualizar evaluación' : 'Enviar evaluación'}
        onPress={submit}
        loading={submitting}
        icon="send-outline"
        fullWidth
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  question: { gap: spacing.xs },
  choices: { gap: spacing.sm },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 68,
  },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  choiceIconSelected: { backgroundColor: '#CCFBF1' },
  choiceTexts: { flex: 1, gap: 2 },
  pressed: { opacity: 0.8 },
});
