import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Dish, DishCategory, DishImage } from '../models/types';
import { createDish, getCategories, updateDish } from '../services/api';
import { useLanguage } from '../contexts/language';

export default function AddEditScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ dish?: string }>();
  const editingDish = useMemo<Dish | null>(() => {
    if (!params.dish) return null;
    try { return JSON.parse(params.dish); } catch { return null; }
  }, [params.dish]);
  const [name, setName] = useState(editingDish?.bcs240053_name ?? '');
  const [price, setPrice] = useState(editingDish ? String(editingDish.bcs240053_price) : '');
  const [prepTime, setPrepTime] = useState(editingDish ? String(editingDish.bcs240053_preparationTime) : '');
  const [description, setDescription] = useState(editingDish?.bcs240053_description ?? '');
  const [isAvailable, setIsAvailable] = useState(editingDish?.bcs240053_isAvailable ?? true);
  const [categoryId, setCategoryId] = useState(editingDish ? String(editingDish.bcs240053_dishCategoryId) : '');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<DishImage[]>(editingDish?.bcs240053_images ?? []);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch((error) => {
      console.error('Could not load categories:', error);
      setCategories([]);
    }).finally(() => setLoadingCategories(false));
  }, []);

  const addImage = () => {
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      Alert.alert(t('imageUrl'), t('invalidUrl'));
      return;
    }
    setImages((current) => [...current, { imageUrl: url, isThumbnail: current.length === 0 }]);
    setImageUrl('');
  };

  const makeThumbnail = (index: number) => setImages((current) => current.map((image, imageIndex) => ({ ...image, isThumbnail: imageIndex === index })));
  const removeImage = (index: number) => setImages((current) => {
    const next = current.filter((_, imageIndex) => imageIndex !== index);
    if (next.length && !next.some((image) => image.isThumbnail)) next[0] = { ...next[0], isThumbnail: true };
    return next;
  });

  const handleSave = async () => {
    const parsedPrice = Number(price);
    const parsedTime = Number(prepTime);
    if (!name.trim()) return Alert.alert(t('name'), t('required'));
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) return Alert.alert(t('price'), t('invalidPrice'));
    if (!prepTime.trim() || !Number.isFinite(parsedTime) || parsedTime <= 0) return Alert.alert(t('prepTime'), t('invalidTime'));
    if (!categoryId || !categories.some((category) => String(category.id) === categoryId)) return Alert.alert(t('category'), categories.length ? t('chooseCategory') : t('noCategories'));

    const thumbnailIndex = images.findIndex((image) => image.isThumbnail);
    const normalizedImages = images.map((image, index) => ({ ...image, isThumbnail: index === (thumbnailIndex < 0 ? 0 : thumbnailIndex) }));
    const payload = {
      bcs240053_name: name.trim(), bcs240053_price: parsedPrice, bcs240053_preparationTime: parsedTime,
      bcs240053_isAvailable: isAvailable, bcs240053_description: description.trim(),
      bcs240053_dishCategoryId: categoryId, bcs240053_images: normalizedImages,
    };
    setSaving(true);
    try {
      if (editingDish?.id !== undefined) await updateDish(editingDish.id, payload);
      else await createDish(payload);
      Alert.alert(t('save'), t('saveSuccess'), [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      console.error('Could not save dish:', error);
      Alert.alert(t('save'), t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{editingDish ? t('editDish') : t('createDish')}</Text>
      <Text style={styles.label}>{t('name')} *</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('name')} maxLength={100} />
      <Text style={styles.label}>{t('price')} *</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="50000" />
      <Text style={styles.label}>{t('prepTime')} *</Text><TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="decimal-pad" placeholder="15" />
      <Text style={styles.label}>{t('descriptionField')}</Text><TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder={t('descriptionField')} />
      <View style={styles.statusRow}><Text style={styles.label}>{t('status')}</Text><Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ true: '#16845b' }} /></View>
      <Text style={styles.label}>{t('category')} *</Text>
      {loadingCategories ? <ActivityIndicator color="#16845b" /> : categories.length === 0 ? <Text style={styles.error}>{t('noCategories')}</Text> : categories.map((category) => <TouchableOpacity key={category.id} style={[styles.category, categoryId === String(category.id) && styles.selectedCategory]} onPress={() => setCategoryId(String(category.id))}><Text style={[styles.categoryText, categoryId === String(category.id) && styles.selectedCategoryText]}>{category.bcs240053_name}</Text></TouchableOpacity>)}
      <Text style={styles.label}>{t('imageUrl')}</Text>
      <View style={styles.imageEntry}><TextInput style={[styles.input, styles.urlInput]} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" keyboardType="url" placeholder="https://..." /><TouchableOpacity style={styles.secondaryButton} onPress={addImage}><Text style={styles.secondaryText}>{t('addImage')}</Text></TouchableOpacity></View>
      {images.map((image, index) => <View key={`${image.imageUrl}-${index}`} style={styles.imageRow}>
        <Image source={{ uri: image.imageUrl }} style={styles.preview} />
        <View style={styles.imageActions}><Text style={styles.imageUrlText} numberOfLines={1}>{image.imageUrl}</Text><TouchableOpacity onPress={() => makeThumbnail(index)}><Text style={image.isThumbnail ? styles.coverText : styles.actionText}>{image.isThumbnail ? t('cover') : t('setThumbnail')}</Text></TouchableOpacity><TouchableOpacity onPress={() => removeImage(index)}><Text style={styles.removeText}>{t('remove')}</Text></TouchableOpacity></View>
      </View>)}
      <TouchableOpacity disabled={saving || loadingCategories} style={[styles.saveButton, (saving || loadingCategories) && styles.disabled]} onPress={() => void handleSave()}><Text style={styles.saveText}>{saving ? t('saving') : t('save')}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8f5' }, content: { padding: 18, paddingBottom: 40 }, heading: { fontSize: 25, color: '#18392e', fontWeight: '800', marginBottom: 8 }, label: { color: '#34483d', fontWeight: '700', marginTop: 14, marginBottom: 7 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e7e2', borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12 }, multiline: { minHeight: 90 }, statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, category: { padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e7e2', borderRadius: 10, marginBottom: 7 }, selectedCategory: { borderColor: '#16845b', backgroundColor: '#e3f5eb' }, categoryText: { color: '#34483d' }, selectedCategoryText: { color: '#14714f', fontWeight: '700' }, error: { color: '#b54736', marginVertical: 8 }, imageEntry: { flexDirection: 'row', alignItems: 'center', gap: 8 }, urlInput: { flex: 1 }, secondaryButton: { backgroundColor: '#e3f5eb', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 }, secondaryText: { color: '#14714f', fontWeight: '700' }, imageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 8, marginTop: 8 }, preview: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#edf0ed' }, imageActions: { flex: 1, gap: 4 }, imageUrlText: { color: '#667085', fontSize: 11 }, coverText: { color: '#14714f', fontWeight: '700' }, actionText: { color: '#16845b', fontWeight: '600' }, removeText: { color: '#b54736', fontWeight: '600' }, saveButton: { alignItems: 'center', backgroundColor: '#16845b', padding: 15, borderRadius: 12, marginTop: 26 }, disabled: { opacity: 0.6 }, saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
