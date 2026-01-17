import { useQuery } from '@tanstack/react-query';
import { productService } from '../api/services';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
    staleTime: 30 * 60 * 1000, // 30 minutes - products don't change often
  });
}

export function useSubProducts() {
  return useQuery({
    queryKey: ['subProducts'],
    queryFn: () => productService.getSubProducts(),
    staleTime: 30 * 60 * 1000,
  });
}
