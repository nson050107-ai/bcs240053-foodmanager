import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteDish } from '../services/api';
import { Dish, DishImage } from '../models/types';

type Props = { route: { params?: { dish?: Dish } }; navigation: { goBack: () => void; navigate?: (name: string, params?: object) => void } };

export default function DetailScreen({ route, navigation }: Props) {
  const dish = route.params?.dish;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (dish?.id === undefined || dish.id === null || String(dish.id).trim() === '') {
      setError('Không tìm thấy ID món ăn.');
      setConfirmVisible(false);
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await deleteDish(dish.id);
      setConfirmVisible(false);
      navigation.goBack();
    } catch (deleteError) {
      console.error('Không thể xóa món ăn:', deleteError);
      setConfirmVisible(false);
      setError('Không thể xóa món ăn. Kiểm tra kết nối và MockAPI.');
    } finally {
      setDeleting(false);
    }
  };

  if (!dish) return <View style={styles.center}><Text>Không tìm thấy món ăn.</Text></View>;
  const images: DishImage[] = Array.isArray(dish.bcs240053_images) ? dish.bcs240053_images.filter((image) => image?.imageUrl) : [];
  const cover = images.find((image) => image.isThumbnail) ?? images[0];
  const quick = Number(dish.bcs240053_preparationTime) <= 15;

  return <>
    <ScrollView style={styles.container}>
      {cover ? <Image source={{ uri: cover.imageUrl }} style={styles.cover} /> : <View style={styles.noImage}><Text>Chưa có ảnh</Text></View>}
      <View style={styles.content}>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Text style={styles.title}>{dish.bcs240053_name}</Text>
        <Text style={styles.price}>{Number(dish.bcs240053_price || 0).toLocaleString()} VNĐ</Text>
        <Text style={styles.info}>Thời gian chế biến: {dish.bcs240053_preparationTime} phút · {quick ? 'Quick / Nhanh' : 'Regular / Thông thường'}</Text>
        <Text style={styles.info}>Trạng thái: {dish.bcs240053_isAvailable ? 'Đang bán' : 'Ngừng bán'}</Text>
        <Text style={styles.section}>Mô tả</Text>
        <Text style={styles.info}>{dish.bcs240053_description || 'Chưa có mô tả'}</Text>
        <Text style={styles.section}>Danh sách ảnh ({images.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.images}>
          {images.map((image, index) => <View key={`${image.imageUrl}-${index}`} style={styles.imageWrap}><Image source={{ uri: image.imageUrl }} style={styles.image} />{image.isThumbnail && <Text style={styles.badge}>Ảnh đại diện</Text>}</View>)}
        </ScrollView>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => navigation.navigate?.('AddEditScreen', { dish })}><Text style={styles.buttonText}>Chỉnh sửa</Text></TouchableOpacity>
          <TouchableOpacity disabled={deleting} style={[styles.button, styles.deleteButton]} onPress={() => { setError(''); setConfirmVisible(true); }}><Text style={styles.buttonText}>Xóa món</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => { if (!deleting) setConfirmVisible(false); }}>
      <View style={styles.backdrop}><View style={styles.dialog}>
        <Text style={styles.dialogTitle}>Xác nhận xóa</Text>
        <Text style={styles.info}>Bạn có chắc chắn muốn xóa món “{dish.bcs240053_name}” không?</Text>
        <View style={styles.actions}>
          <TouchableOpacity disabled={deleting} style={[styles.button, styles.cancelButton]} onPress={() => setConfirmVisible(false)}><Text style={styles.cancelText}>Hủy</Text></TouchableOpacity>
          <TouchableOpacity disabled={deleting} style={[styles.button, styles.deleteButton]} onPress={() => void handleDelete()}><Text style={styles.buttonText}>{deleting ? 'Đang xóa…' : 'Xóa món'}</Text></TouchableOpacity>
        </View>
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, cover: { width: '100%', height: 250, backgroundColor: '#eee' }, noImage: { height: 190, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' }, content: { padding: 16 }, title: { fontSize: 23, fontWeight: '800', color: '#18392e' }, price: { marginTop: 8, fontSize: 19, color: '#b66337', fontWeight: '700' }, info: { marginTop: 8, color: '#58675e' }, section: { marginTop: 18, fontWeight: '700', color: '#18392e' }, images: { gap: 10, paddingVertical: 10 }, imageWrap: { position: 'relative' }, image: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#eee' }, badge: { position: 'absolute', bottom: 3, left: 3, right: 3, color: '#fff', backgroundColor: '#18392ecc', textAlign: 'center', fontSize: 10, borderRadius: 5, overflow: 'hidden' }, actions: { flexDirection: 'row', gap: 10, marginTop: 20 }, button: { flex: 1, alignItems: 'center', padding: 13, borderRadius: 9 }, editButton: { backgroundColor: '#16845b' }, deleteButton: { backgroundColor: '#b54736' }, buttonText: { color: '#fff', fontWeight: '700' }, error: { color: '#b54736', backgroundColor: '#fce9e7', padding: 10, borderRadius: 8 }, backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.45)' }, dialog: { width: '100%', maxWidth: 380, padding: 20, borderRadius: 16, backgroundColor: '#fff' }, dialogTitle: { fontSize: 19, fontWeight: '800', color: '#18392e' }, cancelButton: { backgroundColor: '#edf0ed' }, cancelText: { color: '#34483d', fontWeight: '700' } });
