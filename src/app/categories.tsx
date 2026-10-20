import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Dish, DishCategory } from '../models/types';
import { deleteCategory, getCategories, getDishes } from '../services/api';
import { useLanguage } from '../contexts/language';

export default function CategoriesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [categoryData, dishData] = await Promise.all([getCategories(), getDishes()]);
      if (!Array.isArray(categoryData) || !Array.isArray(dishData)) throw new Error('Invalid API response');
      setCategories(categoryData);
      setDishes(dishData);
    } catch (loadError) {
      console.error('Could not load categories:', loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const remove = (category: DishCategory) => {
    const id = String(category.id);
    const inUse = dishes.some((dish) => String(dish.bcs240053_dishCategoryId) === id);
    if (inUse) {
      Alert.alert(t('delete'), t('categoryInUse'));
      return;
    }
    Alert.alert(t('delete'), t('confirmCategoryDelete'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => {
        setDeletingId(id);
        deleteCategory(category.id).then(() => {
          setCategories((current) => current.filter((item) => String(item.id) !== id));
          Alert.alert(t('delete'), t('categoryDeleteSuccess'));
        }).catch((deleteError: unknown) => {
          console.error('Could not delete category:', deleteError);
          Alert.alert(t('delete'), deleteError instanceof Error && deleteError.message === 'CATEGORY_IN_USE' ? t('categoryInUse') : t('categoryDeleteError'));
          void load();
        }).finally(() => setDeletingId(null));
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('categoryManagement')}</Text>
      <Text style={styles.caption}>{categories.length} {t('categories')}</Text>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#16845b" /></View> : error ? <View style={styles.center}><Text style={styles.errorText}>{t('categoryDeleteError')}</Text><TouchableOpacity style={styles.retryButton} onPress={() => void load()}><Text style={styles.retryText}>{t('retry')}</Text></TouchableOpacity></View> : <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={categories.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={<Text style={styles.empty}>{t('noCategories')}</Text>}
        renderItem={({ item }) => {
          const inUse = dishes.some((dish) => String(dish.bcs240053_dishCategoryId) === String(item.id));
          const isDeleting = deletingId === String(item.id);
          return <View style={styles.card}>
            <View style={styles.cardCopy}>
              <Text style={styles.name}>{item.bcs240053_name || t('categories')}</Text>
              {!!item.bcs240053_description && <Text style={styles.description}>{item.bcs240053_description}</Text>}
              <Text style={[styles.usage, inUse ? styles.inUse : styles.notInUse]}>{inUse ? t('categoryInUse') : t('unused')}</Text>
            </View>
            <TouchableOpacity disabled={inUse || deletingId !== null} onPress={() => remove(item)} style={[styles.deleteButton, (inUse || deletingId !== null) && styles.disabled]}>
              <Text style={styles.deleteText}>{isDeleting ? '…' : t('delete')}</Text>
            </TouchableOpacity>
          </View>;
        }}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8f5', padding: 18 },
  heading: { fontSize: 25, fontWeight: '800', color: '#18392e', marginTop: 4 },
  caption: { color: '#75827c', marginTop: 4, marginBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#edf0ed' },
  cardCopy: { flex: 1, paddingRight: 10 },
  name: { color: '#18392e', fontWeight: '800', fontSize: 16 },
  description: { color: '#667085', marginTop: 4, lineHeight: 18 },
  usage: { marginTop: 8, fontSize: 12, fontWeight: '600' },
  inUse: { color: '#b54736' },
  notInUse: { color: '#16845b' },
  deleteButton: { backgroundColor: '#b54736', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 9 },
  disabled: { opacity: 0.42 },
  deleteText: { color: '#fff', fontWeight: '700' },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  empty: { color: '#667085', textAlign: 'center', padding: 20 },
  errorText: { color: '#b54736', textAlign: 'center' },
  retryButton: { backgroundColor: '#16845b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
});
