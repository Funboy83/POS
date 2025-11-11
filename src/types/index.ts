export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  image?: string;
  description?: string;
  stock?: number;
  barcode?: string;
  isActive?: boolean;
  phoneData?: {
    imei?: string;
    brand?: string;
    model?: string;
    storage?: string;
    grade?: string;
    color?: string;
    carrier?: string;
    battery?: number;
  };
}

export interface CartItem {
  product: Product;
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