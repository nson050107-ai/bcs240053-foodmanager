export interface DishImage {
  imageUrl: string;
  isThumbnail: boolean;
}

export interface DishCategory {
  id: string | number;
  bcs240053_name: string;
  bcs240053_description: string;
}

export interface Dish {
  id: string | number;
  bcs240053_name: string;
  bcs240053_price: number;
  bcs240053_preparationTime: number;
  bcs240053_isAvailable: boolean;
  bcs240053_description: string;
  bcs240053_dishCategoryId: string | number;
  bcs240053_images: DishImage[];
}