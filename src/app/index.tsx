import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Dish, DishCategory } from '../models/types';
import { getCategories, getDishes } from '../services/api';
import { useLanguage } from '../contexts/language';

type SortMode = 'default' | 'priceAsc' | 'priceDesc' | 'timeAsc';
const money = (value: number) => `${Number(value || 0).toLocaleString()} ₫`;

export default function HomeScreen() {
  const { language, setLanguage, t } = useLanguage();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterAvailable, setFilterAvailable] = useState<boolean | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [rangeError, setRangeError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const [dishResult, categoryResult] = await Promise.allSettled([getDishes(), getCategories()]);
    if (dishResult.status === 'fulfilled' && Array.isArray(dishResult.value)) {
      setDishes(dishResult.value);
    } else {
      setLoadError(true);
      console.error('Could not load dishes:', dishResult.status === 'rejected' ? dishResult.reason : dishResult.value);
    }
    setCategories(categoryResult.status === 'fulfilled' && Array.isArray(categoryResult.value) ? categoryResult.value : []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));

  const filteredDishes = useMemo(() => {
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;
    const filtered = dishes.filter((dish) => {
      const name = String(dish.bcs240053_name ?? '').toLocaleLowerCase();
      const price = Number(dish.bcs240053_price);
      const matchesName = name.includes(searchText.trim().toLocaleLowerCase());
      const matchesCategory = !selectedCategory || String(dish.bcs240053_dishCategoryId) === selectedCategory;
      const matchesStatus = filterAvailable === null || Boolean(dish.bcs240053_isAvailable) === filterAvailable;
      const matchesMin = min === null || price >= min;
      const matchesMax = max === null || price <= max;
      return matchesName && matchesCategory && matchesStatus && matchesMin && matchesMax;
    });
    return filtered.sort((a, b) => {
      if (sortMode === 'priceAsc') return Number(a.bcs240053_price) - Number(b.bcs240053_price);
      if (sortMode === 'priceDesc') return Number(b.bcs240053_price) - Number(a.bcs240053_price);
      if (sortMode === 'timeAsc') return Number(a.bcs240053_preparationTime) - Number(b.bcs240053_preparationTime);
      return 0;
    });
  }, [dishes, searchText, selectedCategory, filterAvailable, minPrice, maxPrice, sortMode]);

  useEffect(() => {
    const min = minPrice.trim() ? Number(minPrice) : null;
    const max = maxPrice.trim() ? Number(maxPrice) : null;
    setRangeError((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0)) || (min !== null && max !== null && min > max));
  }, [minPrice, maxPrice]);

  const chips: { label: string; value: SortMode }[] = [
    { label: t('default'), value: 'default' }, { label: t('priceAsc'), value: 'priceAsc' },
    { label: t('priceDesc'), value: 'priceDesc' }, { label: t('timeAsc'), value: 'timeAsc' },
  ];

  if (loading && dishes.length === 0) return <View style={styles.center}><ActivityIndicator size="large" color="#16845b" /><Text style={styles.muted}>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View><Text style={styles.heading}>{t('menu')}</Text><Text style={styles.caption}>{dishes.length} {t('dishes')}</Text></View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.languageButton} onPress={() => setLanguage(language === 'en' ? 'vi' : 'en')}><Text style={styles.languageText}>{t('language')}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.manageButton} onPress={() => router.push('/categories')}><Text style={styles.manageText}>{t('manageCategories')}</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchRow}>
        <TextInput style={styles.search} placeholder={t('search')} value={searchText} onChangeText={setSearchText} returnKeyType="search" />
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-edit')}><Text style={styles.addText}>{t('add')}</Text></TouchableOpacity>
      </View>
      <Text style={styles.sectionLabel}>{t('categories')}</Text>
      <FlatList horizontal showsHorizontalScrollIndicator={false} style={styles.chips} data={[{ id: '', bcs240053_name: t('all'), bcs240053_description: '' }, ...categories]} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => {
        const selected = (selectedCategory ?? '') === String(item.id);
        const label = item.id === '' ? t('all') : item.bcs240053_name;
        return <TouchableOpacity style={[styles.chip, selected && styles.selectedChip]} onPress={() => setSelectedCategory(String(item.id) || null)}><Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text></TouchableOpacity>;
      }} />
      <View style={styles.filterRow}>{([{ label: t('all'), value: null }, { label: t('available'), value: true }, { label: t('unavailable'), value: false }] as const).map(({ label, value }) => <TouchableOpacity key={label} onPress={() => setFilterAvailable(value)} style={[styles.filterChip, filterAvailable === value && styles.selectedFilter]}><Text style={[styles.filterText, filterAvailable === value && styles.selectedFilterText]}>{label}</Text></TouchableOpacity>)}</View>
      <Text style={styles.sectionLabel}>{t('priceRange')}</Text>
      <View style={styles.priceRow}>
        <TextInput style={styles.priceInput} value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" placeholder={t('minPrice')} />
        <Text style={styles.muted}>—</Text>
        <TextInput style={styles.priceInput} value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" placeholder={t('maxPrice')} />
      </View>
      {rangeError && <Text style={styles.errorText}>{t('invalidRange')}</Text>}
      <Text style={styles.sectionLabel}>{t('sort')}</Text>
      <FlatList horizontal showsHorizontalScrollIndicator={false} style={styles.chips} data={chips} keyExtractor={(item) => item.value} renderItem={({ item }) => <TouchableOpacity style={[styles.chip, sortMode === item.value && styles.selectedChip]} onPress={() => setSortMode(item.value)}><Text style={[styles.chipText, sortMode === item.value && styles.selectedChipText]}>{item.label}</Text></TouchableOpacity>} />
      <FlatList data={rangeError ? [] : filteredDishes} keyExtractor={(item, index) => String(item.id ?? index)} onRefresh={() => void fetchData()} refreshing={loading} contentContainerStyle={filteredDishes.length === 0 ? styles.emptyList : undefined} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>{loadError ? t('loadError') : dishes.length === 0 ? t('noDishes') : t('noResults')}</Text>{loadError && <TouchableOpacity style={styles.addButton} onPress={() => void fetchData()}><Text style={styles.addText}>{t('retry')}</Text></TouchableOpacity>}</View>} renderItem={({ item }) => {
        const time = Number(item.bcs240053_preparationTime) || 0;
        const isQuick = time <= 15;
        return <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/detail', params: { dish: JSON.stringify(item) } })}>
          <View style={styles.cardTop}><Text style={styles.dishName}>{item.bcs240053_name}</Text><Text style={[styles.status, item.bcs240053_isAvailable ? styles.available : styles.unavailable]}>{item.bcs240053_isAvailable ? t('available') : t('unavailable')}</Text></View>
          <Text style={styles.price}>{money(Number(item.bcs240053_price))}</Text><Text style={styles.muted}>{time} min · {isQuick ? t('quick') : t('regular')}</Text>
        </TouchableOpacity>;
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 16, backgroundColor: '#f7f8f5' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, heading: { fontSize: 28, fontWeight: '800', color: '#18392e' }, caption: { color: '#75827c', marginTop: 3 }, headerActions: { alignItems: 'flex-end', gap: 7 },
  languageButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#e3f5eb' }, languageText: { color: '#14714f', fontWeight: '700', fontSize: 12 }, manageButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#e9eee9' }, manageText: { color: '#45534c', fontWeight: '700', fontSize: 11 }, searchRow: { flexDirection: 'row', gap: 10 }, search: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3e8e4', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 }, addButton: { backgroundColor: '#16845b', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, addText: { color: '#fff', fontWeight: '700' },
  sectionLabel: { color: '#43564c', fontWeight: '700', marginTop: 13, marginBottom: 6 }, chips: { maxHeight: 43, flexGrow: 0 }, chip: { marginRight: 8, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e3e8e4' }, selectedChip: { backgroundColor: '#18392e', borderColor: '#18392e' }, chipText: { color: '#45534c', fontSize: 12 }, selectedChipText: { color: '#fff', fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: '#e9eee9' }, selectedFilter: { backgroundColor: '#d4ecdf' }, filterText: { color: '#59665e', fontSize: 12 }, selectedFilterText: { color: '#14714f', fontWeight: '700' }, priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, priceInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3e8e4', padding: 10, borderRadius: 10 }, errorText: { color: '#b54736', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#edf0ed' }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, dishName: { flex: 1, color: '#18392e', fontWeight: '700', fontSize: 17 }, status: { fontSize: 11, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' }, available: { backgroundColor: '#e3f5eb', color: '#16845b' }, unavailable: { backgroundColor: '#fce9e7', color: '#b54736' }, price: { color: '#b66337', fontSize: 16, fontWeight: '700', marginTop: 10 }, muted: { color: '#75827c', marginTop: 5 }, emptyList: { flexGrow: 1, justifyContent: 'center' }, empty: { alignItems: 'center', padding: 24, gap: 12 }, emptyTitle: { color: '#667085', textAlign: 'center' },
});
