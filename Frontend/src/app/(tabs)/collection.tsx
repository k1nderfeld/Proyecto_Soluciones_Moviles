import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { RockImage } from '@/components/rocks/RockImage';
import { collectionApi } from '@/api/collectionApi';
import { progressApi } from '@/api/progressApi';
import { useAuth } from '@/context/AuthContext';
import { useTaxonomy } from '@/context/TaxonomyContext';
import { useApiResource } from '@/hooks/useApiResource';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { formatDate, pluralize } from '@/utils/format';
import type { Rock } from '@/types/api';
import { colors, radii, spacing } from '@/theme';

interface CollectionItem {
  rockId: number;
  rock?: Rock | null;
  recognitionCount: number;
  firstDiscoveredAt: string;
}

export default function CollectionScreen() {
  const router = useRouter();
  const { isAuthenticated, isGuest, guest } = useAuth();
  const { typeName } = useTaxonomy();
  const [search, setSearch] = useState('');

  const collection = useApiResource(() => collectionApi.mine(), [], {
    enabled: isAuthenticated,
  });
  const history = useApiResource(() => progressApi.history({ page: 1, limit: 100 }), [], {
    enabled: isGuest,
  });

  const { reload: reloadCollection } = collection;
  const { reload: reloadHistory } = history;

  const refresh = useCallback(async () => {
    if (isAuthenticated) await reloadCollection();
    else if (isGuest) await reloadHistory();
  }, [isAuthenticated, isGuest, reloadCollection, reloadHistory]);

  useRefreshOnFocus(refresh);

  const items = useMemo<CollectionItem[]>(() => {
    if (isAuthenticated) {
      return (collection.data?.items ?? []).map((entry) => ({
        rockId: entry.rockId,
        rock: entry.rock,
        recognitionCount: entry.recognitionCount,
        firstDiscoveredAt: entry.firstDiscoveredAt,
      }));
    }

    const grouped = new Map<number, CollectionItem>();
    for (const analysis of history.data?.items ?? []) {
      const current = grouped.get(analysis.rockId);
      if (!current) {
        grouped.set(analysis.rockId, {
          rockId: analysis.rockId,
          rock: analysis.rock,
          recognitionCount: 1,
          firstDiscoveredAt: analysis.createdAt,
        });
        continue;
      }
      current.recognitionCount += 1;
      if (new Date(analysis.createdAt) < new Date(current.firstDiscoveredAt)) {
        current.firstDiscoveredAt = analysis.createdAt;
      }
    }
    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.firstDiscoveredAt).getTime() - new Date(a.firstDiscoveredAt).getTime(),
    );
  }, [collection.data, history.data, isAuthenticated]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const rock = item.rock;
      return (
        rock?.name.toLowerCase().includes(term) ||
        rock?.scientificName.toLowerCase().includes(term) ||
        rock?.color.toLowerCase().includes(term) ||
        rock?.texture.toLowerCase().includes(term)
      );
    });
  }, [items, search]);

  const totalRecognitions = useMemo(
    () => items.reduce((sum, item) => sum + item.recognitionCount, 0),
    [items],
  );

  const active = isAuthenticated ? collection : history;
  const loading = active.loading && !active.data;
  const error = active.error;

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        title="Mi colección"
        subtitle={
          isGuest
            ? 'Tus descubrimientos temporales'
            : 'Las rocas que ya forman parte de tu colección'
        }
      />

      {isGuest && guest ? (
        <Card tone="accent" style={styles.guestCard}>
          <View style={styles.guestRow}>
            <View style={styles.guestIcon}>
              <Ionicons name="hourglass-outline" size={22} color={colors.accentText} />
            </View>
            <View style={styles.guestTexts}>
              <AppText variant="subheading" color={colors.accentText}>
                Progreso temporal
              </AppText>
              <AppText variant="small" color={colors.accentText}>
                {guest.remaining > 0
                  ? `Te quedan ${guest.remaining} de ${guest.limit} reconocimientos como invitado.`
                  : 'Alcanzaste el límite de reconocimientos como invitado.'}
              </AppText>
            </View>
            <Badge
              label={`${guest.recognitionCount}/${guest.limit}`}
              tone={guest.remaining === 0 ? 'danger' : 'warning'}
            />
          </View>
          <ProgressBar
            value={(guest.recognitionCount / guest.limit) * 100}
            label="Reconocimientos usados"
            tone="accent"
          />
          <AppText variant="small" color={colors.accentText}>
            Crea una cuenta para conservar estas rocas y desbloquear logros permanentes.
          </AppText>
          <Button
            title="Crear cuenta y guardar progreso"
            icon="person-add-outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
          />
        </Card>
      ) : null}

      {items.length > 0 ? (
        <Card style={styles.summary}>
          <View style={styles.summaryItem}>
            <AppText variant="title">{items.length}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Rocas distintas
            </AppText>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <AppText variant="title">{totalRecognitions}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Reconocimientos
            </AppText>
          </View>
        </Card>
      ) : null}

      {items.length > 0 ? (
        <TextField
          placeholder="Buscar en tu colección…"
          value={search}
          onChangeText={setSearch}
          leftIcon="search-outline"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar rocas en mi colección"
        />
      ) : null}

      {error && items.length > 0 ? (
        <AlertBanner
          tone="warning"
          message="No pudimos actualizar tu colección. Se muestran los datos anteriores."
          actionLabel="Reintentar"
          onAction={() => void refresh()}
        />
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} padded={false} edges={['top', 'left', 'right']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.rockId)}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Ver ficha de ${item.rock?.name ?? `roca ${item.rockId}`}`}
            onPress={() => router.push(`/catalog/${item.rockId}`)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Card padded={false} style={styles.card}>
              <RockImage
                uri={item.rock?.imgUrl}
                label={item.rock?.name ?? `Roca ${item.rockId}`}
                height={96}
                compact
                style={styles.image}
              />
              <View style={styles.body}>
                <AppText variant="subheading" numberOfLines={1}>
                  {item.rock?.name ?? `Roca #${item.rockId}`}
                </AppText>
                <AppText variant="small" color={colors.textMuted} numberOfLines={1}>
                  {item.rock?.scientificName ?? 'Ficha del catálogo'}
                </AppText>
                <View style={styles.badges}>
                  {item.rock ? <Badge label={typeName(item.rock.typeId)} tone="primary" /> : null}
                  <Badge
                    label={pluralize(item.recognitionCount, 'reconocimiento', 'reconocimientos')}
                    tone="success"
                    icon="repeat-outline"
                  />
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  Descubierta el {formatDate(item.firstDiscoveredAt)}
                </AppText>
              </View>
              <View style={styles.chevron}>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        )}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshing={active.refreshing}
        onRefresh={() => void refresh()}
        ListEmptyComponent={
          loading ? (
            <LoadingState message="Cargando tu colección…" />
          ) : error ? (
            <ErrorState
              error={error}
              title="No pudimos cargar tu colección"
              onRetry={() => void refresh()}
            />
          ) : search.trim() ? (
            <EmptyState
              icon="search-outline"
              title="Sin coincidencias"
              message={`No encontramos rocas que coincidan con “${search.trim()}”.`}
              actionLabel="Limpiar búsqueda"
              onAction={() => setSearch('')}
            />
          ) : (
            <EmptyState
              icon="albums-outline"
              title="Tu colección está vacía"
              message={
                isGuest
                  ? 'Reconoce tu primera roca para verla aquí mientras dure tu sesión de invitado.'
                  : 'Fotografía una roca para empezar a construir tu colección personal.'
              }
              actionLabel="Reconocer una roca"
              onAction={() => router.push('/recognize')}
              tone="primary"
            />
          )
        }
        ListFooterComponent={
          items.length > 0 ? (
            <AppText variant="caption" color={colors.textMuted} align="center" style={styles.footer}>
              {search.trim()
                ? `${filtered.length} de ${items.length} rocas`
                : isGuest
                  ? 'Este progreso es temporal hasta que crees una cuenta.'
                  : 'Toca una roca para ver su ficha completa.'}
            </AppText>
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  header: { gap: spacing.md, paddingBottom: spacing.md },
  guestCard: { gap: spacing.md, borderColor: '#FDE68A' },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  guestIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTexts: { flex: 1, gap: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  card: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.sm },
  image: { width: 96, borderRadius: 0, alignSelf: 'stretch', height: 'auto' },
  body: { flex: 1, padding: spacing.md, gap: spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chevron: { justifyContent: 'center' },
  pressed: { opacity: 0.82 },
  separator: { height: spacing.sm },
  footer: { marginTop: spacing.lg },
});
