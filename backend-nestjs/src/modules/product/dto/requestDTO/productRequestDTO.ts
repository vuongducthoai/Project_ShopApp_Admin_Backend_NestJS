export type ProductSizePayload = {
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
};

export class ProductRequestDTO {
  productName!: string;
  categoryId!: string;
  description?: string;
  price!: number;
  productSizes?: ProductSizePayload[];
  deletedImageIds?: string[];  // Add this field for image deletions
}
