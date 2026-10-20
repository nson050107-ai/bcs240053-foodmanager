import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DishCategory } from '../models/types';
import { createDish, getCategories, updateDish } from '../services/api';

export default function AddEditScreen({ route, navigation }: any) {
  const editingDish = route.params?.dish;

  const [name, setName] = useState(editingDish ? editingDish.bcs240053_name : '');
  const [price, setPrice] = useState(editingDish ? String(editingDish.bcs240053_price) : '');
  const [prepTime, setPrepTime] = useState(editingDish ? String(editingDish.bcs240053_preparationTime) : '');
  const [description, setDescription] = useState(editingDish ? editingDish.bcs240053_description : '');
  const [isAvailable, setIsAvailable] = useState(editingDish ? editingDish.bcs240053_isAvailable : true);
  const [categoryId, setCategoryId] = useState(editingDish ? String(editingDish.bcs240053_dishCategoryId) : '');
  
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<any[]>(editingDish ? editingDish.bcs240053_images || [] : []);
  const [categories, setCategories] = useState<DishCategory[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleAddImage = () => {
    if (!imageUrl) return;
    const isFirst = images.length === 0; // Ảnh đầu tiên mặc định là thumbnail
    setImages([...images, { imageUrl, isThumbnail: isFirst }]);
    setImageUrl('');
  };

  const handleSave = async () => {
    // Ràng buộc validation cơ bản
    if (!name.trim()) {
      Alert.alert("Lỗi", "Tên món ăn không được để trống!");
      return;
    }
    if (Number(price) <= 0) {
      Alert.alert("Lỗi", "Giá tiền phải lớn hơn 0!");
      return;
    }
    if (Number(prepTime) <= 0) {
      Alert.alert("Lỗi", "Thời gian chế biến phải lớn hơn 0 phút!");
      return;
    }
    if (!categoryId) {
      Alert.alert("Lỗi", "Vui lòng chọn loại món ăn!");
      return;
    }

    const dishPayload = {
      bcs240053_name: name,
      bcs240053_price: Number(price),
      bcs240053_preparationTime: Number(prepTime),
      bcs240053_isAvailable: isAvailable,
      bcs240053_description: description,
      bcs240053_dishCategoryId: categoryId,
      bcs240053_images: images,
    };

    try {
      if (editingDish) {
        await updateDish(editingDish.id, dishPayload);
        Alert.alert("Thành công", "Đã cập nhật món ăn!");
      } else {
        await createDish(dishPayload);
        Alert.alert("Thành công", "Đã thêm món ăn mới!");
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi lưu dữ liệu lên MockAPI.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Tên món ăn (*)</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nhập tên món..." />

      <Text style={styles.label}>Giá tiền (VNĐ) (*)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Nhập giá..." />

      <Text style={styles.label}>Thời gian chế biến (phút) (*)</Text>
      <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" placeholder="Nhập số phút..." />

      <Text style={styles.label}>Mô tả</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} multiline placeholder="Nhập mô tả..." />

      <View style={styles.row}>
        <Text style={styles.label}>Đang bán</Text>
        <Switch value={isAvailable} onValueChange={setIsAvailable} />
      </View>

      <Text style={styles.label}>Chọn loại món (CategoryId):</Text>
      {categories.map((cat) => (
        <TouchableOpacity 
          key={cat.id} 
          style={[styles.catOption, categoryId === String(cat.id) && styles.selectedCat]}
          onPress={() => setCategoryId(String(cat.id))}
        >
          <Text>{cat.bcs240053_name}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Thêm URL Ảnh</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={imageUrl} onChangeText={setImageUrl} placeholder="Dán link ảnh vào đây..." />
        <TouchableOpacity style={styles.addImgBtn} onPress={handleAddImage}><Text style={{color: '#fff'}}>Thêm</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{editingDish ? 'Cập Nhật Món Ăn' : 'Thêm Món Ăn'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontWeight: 'bold', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 8, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  catOption: { padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 6, marginBottom: 5 },
  selectedCat: { backgroundColor: '#e0f7fa', borderColor: '#00acc1' },
  addImgBtn: { backgroundColor: '#27ae60', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  saveBtn: { backgroundColor: '#2980b9', padding: 14, borderRadius: 8, alignItems: 'center', marginVertical: 30 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});