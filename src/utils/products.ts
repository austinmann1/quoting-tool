import { configurationService } from '../services/configuration';

export interface Product {
  id: string;
  name: string;
  pricePerUnit: number;
}

export const PRODUCT_DEFINITIONS = [
  {
    id: 'codeium-enterprise',
    name: 'Codeium Enterprise',
  },
  {
    id: 'cascade',
    name: 'Cascade',
  },
];

// Get products with current pricing
export const getProducts = async (): Promise<Product[]> => {
  const products = [];
  
  for (const product of PRODUCT_DEFINITIONS) {
    try {
      const price = await configurationService.getCurrentPrice(product.id);
      products.push({
        ...product,
        pricePerUnit: price,
      });
    } catch (err) {
      console.error(`Error getting price for ${product.id}:`, err);
      // Use fallback prices in case of error
      products.push({
        ...product,
        pricePerUnit: product.id === 'cascade' ? 2000 : 1000,
      });
    }
  }

  return products;
};
