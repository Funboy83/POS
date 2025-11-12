// Parent Product (groups variants with shared barcode)
export interface Product {
  id: string;
  name: string;
  sharedBarcode: string; // Single barcode for all variants
  hasVariants: boolean; // Flag to check if product has variants
  category?: string;
  subcategory?: string;
  image?: string;
  description?: string;
  price?: number; // Optional for parent products with variants
  stock?: number; // Optional for parent products with variants
  productNumber?: string;
  isActive?: boolean;
}

// Variant (actual sellable item with specific attributes)
export interface Variant {
  id: string;
  productId: string; // Links to parent product
  variantName: string; // e.g., "Rose", "Lavender"
  fullName: string; // e.g., "Shampoo - Rose"
  stockQuantity: number; // Inventory tracked per variant
  costPrice: number;
  price: number; // Selling price
  sku?: string; // Optional internal code
  isActive?: boolean;
}

export interface CartItem {
  product: Product; // Keep using product for compatibility
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  timestamp: Date;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints?: number;
}