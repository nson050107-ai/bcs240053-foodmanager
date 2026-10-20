import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { isAxiosError } from 'axios';
import { Dish, DishCategory, DishImage } from '../models/types';
import { createDish, getCategories, updateDish } from '../services/api';

type Props = { route: { params?: { dish?: Dish } }; navigation: { goBack: () => void } };

export default function AddEditScreen({ route, navigation }: Props) {
  const editingDish = route.params?.dish;
  const [name, setName] = useState(editingDish?.bcs240053_name ?? '');
  const [price, setPrice] = useState(editingDish ? String(editingDish.bcs240053_price) : '');
  const [prepTime, setPrepTime] = useState(editingDish ? String(editingDish.bcs240053_preparationTime) : '');
  const [description, setDescription] = useState(editingDish?.bcs240053_description ?? '');
  const [isAvailable, setIsAvailable] = useState(editingDish?.bcs240053_isAvailable ?? true);
  const [categoryId, setCategoryId] = useState(editingDish ? String(editingDish.bcs240053_dishCategoryId) : '');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<DishImage[]>(Array.isArray(editingDish?.bcs240053_images) ? editingDish.bcs240053_images : []);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getCategories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch((error) => {
      console.error('Không thể tải loại món:', error);
      setErrorMessage('Không tải được loại món. Kiểm tra kết nối và MockAPI rồi thử lại.');
    }).finally(() => setLoadingCategories(false));
  }, []);

  const addImage = () => {
    const url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setErrorMessage('URL ảnh phải bắt đầu bằng http:// hoặc https://.');
      return;
    }
    setImages((current) => [...current, { imageUrl: url, isThumbnail: current.length === 0 }]);
    setImageUrl('');
    setErrorMessage('');
  };

  const setThumbnail = (index: number) => setImages((current) => current.map((image, imageIndex) => ({ ...image, isThumbnail: imageIndex === index })));
  const removeImage = (index: number) => setImages((current) => {
    const next = current.filter((_, imageIndex) => imageIndex !== index);
    if (next.length && !next.some((image) => image.isThumbnail)) next[0] = { ...next[0], isThumbnail: true };
    return next;
  });

  const save = async () => {
    setErrorMessage('');
    const parsedPrice = Number(price);
    const parsedTime = Number(prepTime);
    if (!name.trim()) return setErrorMessage('Vui lòng nhập tên món ăn.');
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) return setErrorMessage('Giá phải là số lớn hơn 0.');
    if (!prepTime.trim() || !Number.isFinite(parsedTime) || parsedTime <= 0) return setErrorMessage('Thời gian chế biến phải là số lớn hơn 0.');
    if (!categoryId || !categories.some((category) => String(category.id) === categoryId)) return setErrorMessage('Vui lòng chọn một loại món hợp lệ.');
    const coverIndex = images.findIndex((image) => image.isThumbnail);
    const payload = {
      bcs240053_name: name.trim(), bcs240053_price: parsedPrice, bcs240053_preparationTime: parsedTime,
      bcs240053_isAvailable: isAvailable, bcs240053_description: description.trim(),
      bcs240053_dishCategoryId: categoryId,
      bcs240053_images: images.map((image, index) => ({ ...image, isThumbnail: index === (coverIndex < 0 ? 0 : coverIndex) })),
    };
    setSaving(true);
    try {
      if (editingDish?.id !== undefined && editingDish?.id !== null) await updateDish(editingDish.id, payload);
      else await createDish(payload);
      navigation.goBack();
    } catch (error) {
      console.error('Lỗi khi lưu món:', error);
      const detail = isAxiosError(error)
        ? (typeof error.response?.data === 'string' ? error.response.data : error.response?.data?.message) || error.response?.statusText || error.message
        : error instanceof Error ? error.message : '';
      setErrorMessage(detail ? `Không lưu được món ăn: ${detail}` : 'Không lưu được món ăn. Kiểm tra dữ liệu và MockAPI.');
    } finally {
      setSaving(false);
    }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>{editingDish ? 'Chỉnh sửa món ăn' : 'Thêm món ăn'}</Text>
    {!!errorMessage && <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text>}
    <Text style={styles.label}>Tên món ăn *</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nhập tên món ăn" />
    <Text style={styles.label}>Giá (VNĐ) *</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="50000" />
    <Text style={styles.label}>Thời gian chế biến (phút) *</Text><TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="decimal-pad" placeholder="15" />
    <Text style={styles.label}>Mô tả</Text><TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline placeholder="Mô tả món ăn" />
    <View style={styles.statusRow}><Text style={styles.label}>Đang bán</Text><Switch value={isAvailable} onValueChange={setIsAvailable} /></View>
    <Text style={styles.label}>Loại món *</Text>
    {loadingCategories ? <ActivityIndicator color="#16845b" /> : categories.length === 0 ? <Text style={styles.hint}>Chưa tải được loại món. Hãy tải lại màn hình và kiểm tra MockAPI.</Text> : categories.map((category) => <TouchableOpacity key={category.id} style={[styles.category, categoryId === String(category.id) && styles.selectedCategory]} onPress={() => { setCategoryId(String(category.id)); setErrorMessage(''); }}><Text>{category.bcs240053_name}</Text></TouchableOpacity>)}
    <Text style={styles.label}>Thêm ảnh bằng URL</Text><View style={styles.imageEntry}><TextInput style={[styles.input, styles.urlInput]} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" keyboardType="url" placeholder="https://..." /><TouchableOpacity style={styles.addImageButton} onPress={addImage}><Text style={styles.addImageText}>Thêm</Text></TouchableOpacity></View>
    {images.map((image, index) => <View key={`${image.imageUrl}-${index}`} style={styles.imageRow}><Image source={{ uri: image.imageUrl }} style={styles.preview} /><View style={styles.imageInfo}><Text numberOfLines={1} style={styles.imageUrl}>{image.imageUrl}</Text><TouchableOpacity onPress={() => setThumbnail(index)}><Text style={image.isThumbnail ? styles.coverText : styles.actionText}>{image.isThumbnail ? 'Ảnh đại diện' : 'Đặt làm ảnh đại diện'}</Text></TouchableOpacity><TouchableOpacity onPress={() => removeImage(index)}><Text style={styles.removeText}>Xóa ảnh</Text></TouchableOpacity></View></View>)}
    <TouchableOpacity disabled={saving || loadingCategories} style={[styles.saveButton, (saving || loadingCategories) && styles.disabled]} onPress={() => void save()}><Text style={styles.saveText}>{saving ? 'Đang lưu…' : 'Lưu món ăn'}</Text></TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f7f8f5' }, content: { padding: 16, paddingBottom: 40 }, title: { fontSize: 24, fontWeight: '800', color: '#18392e', marginBottom: 10 }, label: { color: '#34483d', fontWeight: '700', marginTop: 12, marginBottom: 6 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9e1db', padding: 12, borderRadius: 10 }, multiline: { minHeight: 84, textAlignVertical: 'top' }, statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, category: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e7e2', padding: 12, borderRadius: 9, marginBottom: 6 }, selectedCategory: { borderColor: '#16845b', backgroundColor: '#e3f5eb' }, error: { backgroundColor: '#fce9e7', color: '#a63225', padding: 11, borderRadius: 9, marginBottom: 8 }, hint: { color: '#a63225', marginVertical: 6 }, imageEntry: { flexDirection: 'row', alignItems: 'center', gap: 8 }, urlInput: { flex: 1 }, addImageButton: { backgroundColor: '#e3f5eb', paddingHorizontal: 13, paddingVertical: 12, borderRadius: 9 }, addImageText: { color: '#14714f', fontWeight: '700' }, imageRow: { flexDirection: 'row', gap: 10, padding: 8, marginTop: 8, borderRadius: 10, backgroundColor: '#fff' }, preview: { width: 58, height: 58, borderRadius: 7, backgroundColor: '#eee' }, imageInfo: { flex: 1, gap: 3 }, imageUrl: { fontSize: 11, color: '#667085' }, coverText: { color: '#14714f', fontWeight: '700' }, actionText: { color: '#16845b' }, removeText: { color: '#b54736' }, saveButton: { backgroundColor: '#16845b', alignItems: 'center', padding: 14, borderRadius: 10, marginTop: 24 }, disabled: { opacity: 0.55 }, saveText: { color: '#fff', fontWeight: '800' } });
