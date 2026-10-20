import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'vi';

const messages = {
  en: {
    menu: 'Menu', dishes: 'dishes', search: 'Search dishes...', add: '+ Add', all: 'All', available: 'Available', unavailable: 'Unavailable',
    categories: 'Categories', manageCategories: 'Manage categories', categoryManagement: 'Category management', inUse: 'In use', unused: 'No dishes use this category', priceRange: 'Price range', minPrice: 'Min price', maxPrice: 'Max price', sort: 'Sort by',
    default: 'Default', priceAsc: 'Price ↑', priceDesc: 'Price ↓', timeAsc: 'Prep time ↑', quick: 'Quick', regular: 'Regular',
    noResults: 'No matching dishes', noDishes: 'No dishes yet', loadError: 'Could not load dishes. Check your connection and MockAPI.', retry: 'Try again',
    detail: 'Dish details', noDish: 'Dish not found.', noImage: 'No images available', description: 'Description', edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete this dish?', cancel: 'Cancel',
    deleteSuccess: 'Dish deleted.', deleteError: 'Could not delete this dish. Check the dish ID and MockAPI.', categoryDeleteSuccess: 'Category deleted.', categoryInUse: 'This category is assigned to one or more dishes and cannot be deleted.', categoryDeleteError: 'Could not delete this category. Check the connection and MockAPI.', confirmCategoryDelete: 'Delete this category? This action cannot be undone.', noCategories: 'No categories found. Check the categories MockAPI resource.',
    createDish: 'Add dish', editDish: 'Edit dish', name: 'Name', price: 'Price (VND)', prepTime: 'Preparation time (minutes)', category: 'Category', status: 'Available for sale',
    descriptionField: 'Description', imageUrl: 'Image URL', addImage: 'Add image', save: 'Save', saving: 'Saving...', setThumbnail: 'Set as cover', cover: 'Cover', remove: 'Remove',
    required: 'Please enter a dish name.', invalidPrice: 'Price must be a valid number greater than zero.', invalidTime: 'Preparation time must be a valid number greater than zero.',
    invalidRange: 'Minimum price must be less than or equal to maximum price.', chooseCategory: 'Please choose a category.', invalidUrl: 'Enter a valid image URL starting with http:// or https://.',
    saveError: 'Could not save the dish. Check the data and MockAPI.', saveSuccess: 'Dish saved successfully.', language: 'Tiếng Việt',
  },
  vi: {
    menu: 'Thực đơn', dishes: 'món ăn', search: 'Tìm món ăn...', add: '+ Thêm', all: 'Tất cả', available: 'Đang bán', unavailable: 'Ngừng bán',
    categories: 'Loại món', manageCategories: 'Quản lý loại món', categoryManagement: 'Quản lý loại món', inUse: 'Đang được sử dụng', unused: 'Chưa có món sử dụng', priceRange: 'Khoảng giá', minPrice: 'Giá thấp nhất', maxPrice: 'Giá cao nhất', sort: 'Sắp xếp',
    default: 'Mặc định', priceAsc: 'Giá ↑', priceDesc: 'Giá ↓', timeAsc: 'Thời gian ↑', quick: 'Nhanh', regular: 'Thông thường',
    noResults: 'Không tìm thấy món phù hợp', noDishes: 'Chưa có món ăn', loadError: 'Không tải được món ăn. Hãy kiểm tra kết nối và MockAPI.', retry: 'Thử lại',
    detail: 'Chi tiết món ăn', noDish: 'Không tìm thấy món ăn.', noImage: 'Chưa có ảnh', description: 'Mô tả', edit: 'Sửa', delete: 'Xóa', confirmDelete: 'Bạn có chắc muốn xóa món này không?', cancel: 'Hủy',
    deleteSuccess: 'Đã xóa món ăn.', deleteError: 'Không thể xóa món ăn. Hãy kiểm tra ID và MockAPI.', categoryDeleteSuccess: 'Đã xóa loại món.', categoryInUse: 'Loại món này đang được sử dụng bởi món ăn nên không thể xóa.', categoryDeleteError: 'Không thể xóa loại món. Hãy kiểm tra kết nối và MockAPI.', confirmCategoryDelete: 'Bạn có chắc muốn xóa loại món này? Thao tác này không thể hoàn tác.',
    createDish: 'Thêm món ăn', editDish: 'Sửa món ăn', name: 'Tên món', price: 'Giá (VNĐ)', prepTime: 'Thời gian chế biến (phút)', category: 'Loại món', status: 'Đang bán',
    descriptionField: 'Mô tả', imageUrl: 'URL hình ảnh', addImage: 'Thêm ảnh', save: 'Lưu', saving: 'Đang lưu...', setThumbnail: 'Đặt làm ảnh đại diện', cover: 'Ảnh đại diện', remove: 'Xóa ảnh',
    required: 'Vui lòng nhập tên món.', invalidPrice: 'Giá phải là số hợp lệ lớn hơn 0.', invalidTime: 'Thời gian chế biến phải là số hợp lệ lớn hơn 0.',
    invalidRange: 'Giá thấp nhất phải nhỏ hơn hoặc bằng giá cao nhất.', chooseCategory: 'Vui lòng chọn loại món.', invalidUrl: 'Nhập URL ảnh hợp lệ bắt đầu bằng http:// hoặc https://.',
    noCategories: 'Không tìm thấy loại món. Hãy kiểm tra resource categories trên MockAPI.', saveError: 'Không thể lưu món ăn. Hãy kiểm tra dữ liệu và MockAPI.', saveSuccess: 'Đã lưu món ăn.', language: 'English',
  },
} as const;

type TranslationKey = keyof typeof messages.en;
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>('en');
  useEffect(() => {
    AsyncStorage.getItem('food-manager-language').then((value) => {
      if (value === 'en' || value === 'vi') setLanguageState(value);
    }).catch(() => undefined);
  }, []);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (next) => {
      setLanguageState(next);
      AsyncStorage.setItem('food-manager-language', next).catch(() => undefined);
    },
    t: (key) => messages[language][key],
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
