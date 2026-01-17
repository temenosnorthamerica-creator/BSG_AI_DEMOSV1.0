import { apiClient, endpoints } from '../client';

export interface Product {
  ProductId: string;
  ProductName: string;
  ProductType: string;
  Description: string;
  MinAmount?: number;
  MaxAmount?: number;
  MinTerm?: number;
  MaxTerm?: number;
  BaseRate?: number;
  IsActive: boolean;
}

export interface SubProduct {
  SubProductId: string;
  ProductId: string;
  SubProductName: string;
  Description: string;
  IsActive: boolean;
}

export const productService = {
  async getProducts(): Promise<Product[]> {
    const response = await apiClient.get<{ Products: Product[] }>(endpoints.products.list);
    return response.data.Products || [];
  },

  async getSubProducts(): Promise<SubProduct[]> {
    const response = await apiClient.get<{ SubProducts: SubProduct[] }>(
      endpoints.products.subProducts
    );
    return response.data.SubProducts || [];
  },
};
