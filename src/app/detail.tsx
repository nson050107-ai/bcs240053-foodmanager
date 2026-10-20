import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isAxiosError } from 'axios';
import { Dish, DishImage } from '../models/types';
import { deleteDish, getDishById } from '../services/api';
import { useLanguage } from '../contexts/language';

export default function DetailScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ dish?: string }>();
  let initialDish: Dish | null = null;
  try { if (params.dish) initialDish = JSON.parse(params.dish); } catch { initialDish = null; }
  const [dish, setDish] = useState<Dish | null>(initialDish);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useFocusEffect(useCallback(() => {
    const id = initialDish?.id;
    if (id === undefined || id === null || String(id).trim() === '') return;
    let active = true;
    setLoading(true);
    getDishById(id).then((freshDish: Dish) => { if (active) setDish(freshDish); }).catch((error: unknown) => {
      console.error('Could not load dish details:', error);
      if (active && isAxiosError(error) && error.response?.status === 404) setDish(null);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.dish]));

  const confirmDelete = () => {
    if (dish?.id === undefined || dish.id === null || String(dish.id).trim() === '') {
      setDeleteError(t('noDish'));
      return;
    }
    setDeleteError('');
    setConfirmVisible(true);
  };

  const performDelete = async () => {
    if (!dish || dish.id === undefined || dish.id === null) return;
    setDeleting(true);
    try {
      await deleteDish(dish.id);
      setConfirmVisible(false);
      router.back();
    } catch (error) {
      console.error('Could not delete dish:', error);
      setConfirmVisible(false);
      setDeleteError(t('deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !dish) return <View style={styles.center}><ActivityIndicator size="large" color="#16845b" /></View>;
  if (!dish || dish.id === undefined || dish.id === null || String(dish.id).trim() === '') return <View style={styles.center}><Text>{t('noDish')}</Text></View>;

  const images: DishImage[] = Array.isArray(dish.bcs240053_images) ? dish.bcs240053_images.filter((image) => image?.imageUrl) : [];
  const cover = images.find((image) => image.isThumbnail) ?? images[0];
  const quick = Number(dish.bcs240053_preparationTime) <= 15;
  return (
    <ScrollView style={styles.container}>
      {cover ? <Image source={{ uri: cover.imageUrl }} style={styles.cover} resizeMode="cover" /> : <View style={styles.noImage}><Text style={styles.muted}>{t('noImage')}</Text></View>}
      <View style={styles.content}>
        {!!deleteError && <Text accessibilityRole="alert" style={styles.deleteError}>{deleteError}</Text>}
        <Text style={styles.title}>{dish.bcs240053_name}</Text>
        <Text style={styles.price}>{Number(dish.bcs240053_price || 0).toLocaleString()} ₫</Text>
        <Text style={styles.info}>{Number(dish.bcs240053_preparationTime) || 0} min · {quick ? t('quick') : t('regular')}</Text>
        <Text style={[styles.info, dish.bcs240053_isAvailable ? styles.available : styles.unavailable]}>{dish.bcs240053_isAvailable ? t('available') : t('unavailable')}</Text>
        <Text style={styles.section}>{t('description')}</Text>
        <Text style={styles.info}>{dish.bcs240053_description || '—'}</Text>
        <Text style={styles.section}>{t('imageUrl')} ({images.length})</Text>
        {images.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageList}>{images.map((image, index) => <View key={`${image.imageUrl}-${index}`} style={styles.imageWrap}><Image source={{ uri: image.imageUrl }} style={styles.image} resizeMode="cover" />{image.isThumbnail && <Text style={styles.badge}>{t('cover')}</Text>}</View>)}</ScrollView> : <Text style={styles.muted}>{t('noImage')}</Text>}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => router.push({ pathname: '/add-edit', params: { dish: JSON.stringify(dish) } })}><Text style={styles.buttonText}>{t('edit')}</Text></TouchableOpacity>
          <TouchableOpacity disabled={deleting} style={[styles.button, styles.deleteButton]} onPress={confirmDelete}><Text style={styles.buttonText}>{deleting ? '...' : t('delete')}</Text></TouchableOpacity>
        </View>
      </View>
      <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => { if (!deleting) setConfirmVisible(false); }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('delete')}</Text>
            <Text style={styles.modalMessage}>{t('confirmDelete')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity disabled={deleting} style={[styles.modalButton, styles.cancelButton]} onPress={() => setConfirmVisible(false)}><Text style={styles.cancelText}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity disabled={deleting} style={[styles.modalButton, styles.confirmButton, deleting && styles.disabled]} onPress={() => void performDelete()}><Text style={styles.buttonText}>{deleting ? '…' : t('delete')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f7f8f5' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, cover: { width: '100%', height: 260, backgroundColor: '#e9eee9' }, noImage: { height: 190, backgroundColor: '#e9eee9', alignItems: 'center', justifyContent: 'center' }, content: { padding: 18 }, title: { fontSize: 25, fontWeight: '800', color: '#18392e' }, price: { color: '#b66337', fontSize: 20, fontWeight: '800', marginTop: 8 }, info: { color: '#58675e', marginTop: 8 }, available: { color: '#16845b' }, unavailable: { color: '#b54736' }, deleteError: { color: '#b54736', backgroundColor: '#fce9e7', padding: 12, borderRadius: 10, marginBottom: 12 }, section: { color: '#18392e', fontWeight: '800', fontSize: 16, marginTop: 20, marginBottom: 5 }, muted: { color: '#75827c' }, imageList: { paddingVertical: 8, gap: 10 }, imageWrap: { position: 'relative' }, image: { width: 104, height: 104, borderRadius: 12, backgroundColor: '#e9eee9' }, badge: { position: 'absolute', left: 4, right: 4, bottom: 4, backgroundColor: '#18392ecc', color: '#fff', textAlign: 'center', overflow: 'hidden', borderRadius: 6, fontSize: 10, padding: 3 }, actions: { flexDirection: 'row', gap: 10, marginTop: 24 }, button: { flex: 1, padding: 14, borderRadius: 11, alignItems: 'center' }, editButton: { backgroundColor: '#16845b' }, deleteButton: { backgroundColor: '#b54736' }, buttonText: { color: '#fff', fontWeight: '800' }, modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.45)' }, modalCard: { width: '100%', maxWidth: 380, padding: 20, backgroundColor: '#fff', borderRadius: 18 }, modalTitle: { color: '#18392e', fontWeight: '800', fontSize: 20 }, modalMessage: { color: '#58675e', marginTop: 10, lineHeight: 22 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 }, modalButton: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 }, cancelButton: { backgroundColor: '#edf0ed' }, confirmButton: { backgroundColor: '#b54736' }, cancelText: { color: '#34483d', fontWeight: '700' }, disabled: { opacity: 0.6 } });
