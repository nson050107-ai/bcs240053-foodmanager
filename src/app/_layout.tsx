import { Stack } from 'expo-router';
import { LanguageProvider, useLanguage } from '../contexts/language';

function AppStack() {
  const { language } = useLanguage();
  const titles = language === 'en'
    ? { home: 'Food Manager', detail: 'Dish details', form: 'Dish editor' }
    : { home: 'Quản lý món ăn', detail: 'Chi tiết món ăn', form: 'Thêm / sửa món' };
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: titles.home }} />
      <Stack.Screen name="detail" options={{ title: titles.detail }} />
      <Stack.Screen name="add-edit" options={{ title: titles.form }} />
      <Stack.Screen name="categories" options={{ title: language === 'en' ? 'Category management' : 'Quản lý loại món' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return <LanguageProvider><AppStack /></LanguageProvider>;
}
