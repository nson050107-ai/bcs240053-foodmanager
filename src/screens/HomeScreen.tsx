import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet, Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import { Dish, DishCategory } from '../models/types';
import { getCategories, getDishes } from '../services/api';

export default function HomeScreen({ navigation }: any) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Trạng thái tìm kiếm và lọc
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterAvailable, setFilterAvailable] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'time_asc' | null>(null);

  // Tải dữ liệu từ MockAPI khi vào màn hình
  const fetchData = async () => {
    try {
      setLoading(true);
      const dishData = await getDishes();
      const categoryData = await getCategories();
      setDishes(dishData);
      setCategories(categoryData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý logic tìm kiếm, lọc và sắp xếp
  const filteredDishes = dishes.filter((dish) => {
    // Tìm kiếm theo một phần tên món
    const matchesName = dish.bcs240053_name.toLowerCase().includes(searchText.toLowerCase());
    
    // Lọc theo loại món
    const matchesCategory = selectedCategory ? String(dish.bcs240053_dishCategoryId) === String(selectedCategory) : true;
    
    // Lọc theo trạng thái đang bán (món ngừng bán vẫn hiển thị ở màn hình quản lý nhưng nếu lọc đang bán thì ẩn đi)
    const matchesAvailable = filterAvailable !== null ? dish.bcs240053_isAvailable === filterAvailable : true;

    return matchesName && matchesCategory && matchesAvailable;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.bcs240053_price - b.bcs240053_price;
    if (sortBy === 'price_desc') return b.bcs240053_price - b.bcs240053_price;
    if (sortBy === 'time_asc') return a.bcs240053_preparationTime - b.bcs240053_preparationTime;
    return 0;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Ô tìm kiếm */}
      <TextInput
        style={styles.input}
        placeholder="Tìm kiếm theo tên món ăn..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Danh sách món ăn */}
      <FlatList
        data={filteredDishes}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          // Phân loại thời gian chế biến: <= 15 phút là "Quick / Nhanh", ngược lại là "Regular / Thông thường"
          const isQuick = item.bcs240053_preparationTime <= 15;
          
          return (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('DetailScreen', { dish: item })}
            >
              <Text style={styles.dishName}>{item.bcs240053_name}</Text>
              <Text>Giá: {item.bcs240053_price} VNĐ</Text>
              <Text>Thời gian: {item.bcs240053_preparationTime} phút 
                <Text style={isQuick ? styles.quickText : styles.regularText}>
                  {isQuick ? ' (Quick / Nhanh)' : ' (Regular / Thông thường)'}
                </Text>
              </Text>
              <Text>Trạng thái: {item.bcs240053_isAvailable ? 'Đang bán' : 'Ngừng bán'}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 8, marginBottom: 12 },
  card: { padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  dishName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  quickText: { color: 'green', fontWeight: 'bold' },
  regularText: { color: 'orange', fontWeight: 'bold' }
});