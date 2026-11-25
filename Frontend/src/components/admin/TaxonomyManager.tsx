import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppModal } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { taxonomyApi } from '@/api/taxonomyApi';
import { useTaxonomy } from '@/context/TaxonomyContext';
import { useApiResource } from '@/hooks/useApiResource';
import { getErrorMessage } from '@/utils/errors';
import type { CategoryItem, TypeItem } from '@/types/api';
import { colors, radii, spacing } from '@/theme';

type TaxonomyItem = TypeItem | CategoryItem;

interface TaxonomyManagerProps {
  kind: 'type' | 'category';
}

const labels = {
  type: {
    singular: 'tipo',
    plural: 'tipos',
    title: 'Tipos de roca',
    description:
      'Los tipos agrupan rocas por su origen geológico. Se usan como filtro del catálogo y en la ficha de cada roca.',
  },
  category: {
    singular: 'categoría',
    plural: 'categorías',
    title: 'Categorías',
    description:
      'Las categorías clasifican las rocas del catálogo. Cada categoría necesita un nombre y una descripción.',
  },
} as const;

const hasDescription = (item: TaxonomyItem): item is CategoryItem =>
  'description' in item && item.description !== undefined;

export const TaxonomyManager = ({ kind }: TaxonomyManagerProps) => {
  const copy = labels[kind];
  const { refresh: refreshReferenceData } = useTaxonomy();
  const resource = useApiResource<TaxonomyItem[]>(
    () => (kind === 'type' ? taxonomyApi.allTypes() : taxonomyApi.allCategories()),
    [kind],
  );

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<TaxonomyItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const items = useMemo(() => resource.data ?? [], [resource.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const descriptionValue = hasDescription(item) ? item.description ?? '' : '';
      return (
        item.name.toLowerCase().includes(term) ||
        descriptionValue.toLowerCase().includes(term)
      );
    });
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setFormError(null);
    setModalVisible(true);
  };

  const openEdit = (item: TaxonomyItem) => {
    setEditing(item);
    setName(item.name);
    setDescription(hasDescription(item) ? item.description ?? '' : '');
    setFormError(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
    setFormError(null);
  };

  const save = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(`Ingresa el nombre del ${copy.singular}.`);
      return;
    }
    if (kind === 'category' && !description.trim()) {
      setFormError('Ingresa la descripción de la categoría.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      if (kind === 'type') {
        if (editing) await taxonomyApi.updateType(editing.id, { name: trimmedName });
        else await taxonomyApi.createType({ name: trimmedName });
      } else {
        const payload = { name: trimmedName, description: description.trim() };
        if (editing) await taxonomyApi.updateCategory(editing.id, payload);
        else await taxonomyApi.createCategory(payload);
      }
      setModalVisible(false);
      setSuccess(
        `${editing ? 'Actualizamos' : 'Creamos'} el ${copy.singular} “${trimmedName}”.`,
      );
      setPageError(null);
      await resource.reload();
      await refreshReferenceData();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (kind === 'type') await taxonomyApi.removeType(deleteTarget.id);
      else await taxonomyApi.removeCategory(deleteTarget.id);
      setSuccess(`Eliminamos el ${copy.singular} “${deleteTarget.name}”.`);
      setPageError(null);
      setDeleteTarget(null);
      await resource.reload();
      await refreshReferenceData();
    } catch (error) {
      setDeleteTarget(null);
      setPageError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen refreshing={resource.refreshing} onRefresh={() => void resource.reload()}>
      <View style={styles.intro}>
        <AppText variant="body" color={colors.textSecondary}>
          {copy.description}
        </AppText>
        <Button
          title={`Nuevo ${copy.singular}`}
          icon="add"
          onPress={openCreate}
          fullWidth
        />
      </View>

      {success ? (
        <AlertBanner tone="success" message={success} actionLabel="Cerrar" onAction={() => setSuccess(null)} />
      ) : null}
      {pageError ? (
        <AlertBanner tone="danger" message={pageError} actionLabel="Cerrar" onAction={() => setPageError(null)} />
      ) : null}

      <TextField
        placeholder={`Buscar ${copy.plural}…`}
        value={search}
        onChangeText={setSearch}
        leftIcon="search-outline"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={`Buscar ${copy.plural}`}
      />

      <View style={styles.listHeader}>
        <AppText variant="label" color={colors.textSecondary}>
          {filtered.length} {filtered.length === 1 ? copy.singular : copy.plural}
        </AppText>
        {search.trim() ? (
          <Button title="Limpiar" variant="ghost" size="sm" onPress={() => setSearch('')} />
        ) : null}
      </View>

      {resource.loading && !resource.data ? (
        <LoadingState message={`Cargando ${copy.plural}…`} />
      ) : resource.error ? (
        <ErrorState
          error={resource.error}
          title={`No pudimos cargar los ${copy.plural}`}
          onRetry={() => void resource.reload()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={kind === 'type' ? 'layers-outline' : 'pricetag-outline'}
          title={search.trim() ? 'Sin coincidencias' : `Todavía no hay ${copy.plural}`}
          message={
            search.trim()
              ? `No encontramos ${copy.plural} que coincidan con “${search.trim()}”.`
              : `Crea el primer ${copy.singular} para clasificar las rocas del catálogo.`
          }
          actionLabel={search.trim() ? 'Limpiar búsqueda' : `Crear ${copy.singular}`}
          onAction={search.trim() ? () => setSearch('') : openCreate}
          tone="primary"
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => (
            <Card key={item.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name={kind === 'type' ? 'layers-outline' : 'pricetag-outline'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowTexts}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {item.name}
                </AppText>
                {hasDescription(item) && item.description ? (
                  <AppText variant="small" color={colors.textMuted} numberOfLines={2}>
                    {item.description}
                  </AppText>
                ) : (
                  <AppText variant="caption" color={colors.textMuted}>
                    {kind === 'type' ? 'Tipo geológico' : 'Sin descripción'}
                  </AppText>
                )}
              </View>
              <View style={styles.rowActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${copy.singular} ${item.name}`}
                  onPress={() => openEdit(item)}
                  hitSlop={4}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${copy.singular} ${item.name}`}
                  onPress={() => setDeleteTarget(item)}
                  hitSlop={4}
                  style={({ pressed }) => [styles.iconButton, styles.deleteButton, pressed && styles.pressed]}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      <AppModal
        visible={modalVisible}
        title={editing ? `Editar ${copy.singular}` : `Nuevo ${copy.singular}`}
        subtitle={editing ? `“${editing.name}”` : `Agrega un ${copy.singular} al catálogo`}
        onClose={closeModal}
        footer={
          <>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={closeModal}
              disabled={saving}
              style={styles.flex}
            />
            <Button
              title={editing ? 'Guardar cambios' : 'Crear'}
              onPress={() => void save()}
              loading={saving}
              style={styles.flex}
            />
          </>
        }
      >
        {formError ? <AlertBanner tone="danger" message={formError} /> : null}
        <TextField
          label={`Nombre del ${copy.singular} *`}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          maxLength={255}
          placeholder={kind === 'type' ? 'Ígnea' : 'Minerales'}
        />
        {kind === 'category' ? (
          <TextField
            label="Descripción *"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={255}
            helper={`${description.length}/255 caracteres`}
            placeholder="Describe qué rocas agrupa esta categoría"
          />
        ) : null}
      </AppModal>

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title={`¿Eliminar ${copy.singular}?`}
        message={`Se eliminará “${deleteTarget?.name ?? ''}”. Esta acción no se puede deshacer y fallará si existen rocas asociadas.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  intro: { gap: spacing.md },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: { flex: 1, gap: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  deleteButton: { backgroundColor: colors.dangerSoft },
  pressed: { opacity: 0.7 },
  flex: { flex: 1 },
});
