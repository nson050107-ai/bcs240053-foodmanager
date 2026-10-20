import axios from 'axios';

const API_BASE_URL = 'https://6ad714d4f71f154ac487b7ca.mockapi.io';
const dishesUrl = `${API_BASE_URL}/bcs240053_dishes`;
const categoriesUrl = `${API_BASE_URL}/bcs240053_categories`;

export const getCategories = async () => (await axios.get(categoriesUrl, { timeout: 15000 })).data;
export const getDishes = async () => (await axios.get(dishesUrl, { timeout: 15000 })).data;
export const getDishById = async (id) => (await axios.get(`${dishesUrl}/${encodeURIComponent(String(id))}`, { timeout: 15000 })).data;
export const createDish = async (dishData) => (await axios.post(dishesUrl, dishData, { timeout: 15000 })).data;
export const updateDish = async (id, dishData) => (await axios.put(`${dishesUrl}/${encodeURIComponent(String(id))}`, dishData, { timeout: 15000 })).data;
export const deleteDish = async (id) => (await axios.delete(`${dishesUrl}/${encodeURIComponent(String(id))}`, { timeout: 15000 })).data;

// Refuse to remove a category that is still referenced by a dish.
export const deleteCategory = async (id) => {
  const dishes = await getDishes();
  const inUse = dishes.some((dish) => String(dish.bcs240053_dishCategoryId) === String(id));
  if (inUse) throw new Error('CATEGORY_IN_USE');
  return (await axios.delete(`${categoriesUrl}/${encodeURIComponent(String(id))}`, { timeout: 15000 })).data;
};
