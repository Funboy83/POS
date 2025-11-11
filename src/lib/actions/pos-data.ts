// Client-side Firebase operations for POS system - ConvenientStore Integration
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  addDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, isConfigured, auth, app } from '@/lib/firebase';
import type { Product, CartItem, Customer } from '@/types';

// Database collections for ConvenientStore app
const PRODUCTS_COLLECTION = 'products';
const SERVICES_COLLECTION = 'services';
const CUSTOMERS_COLLECTION = 'customers';
const CATEGORIES_COLLECTION = 'categories';

// Fetch all products from ConvenientStore (main function)
export async function getInventoryItems(): Promise<Product[]> {
  if (!isConfigured) {
    console.warn('Firebase is not configured.');
    return [];
  }

  try {
    console.log('🔍 Fetching products from ConvenientStore...');
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    
    const q = query(productsRef, orderBy('name'));
    
    const snapshot = await getDocs(q);
    console.log('� Found products:', snapshot.size);
    
    const products: Product[] = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      
      // Get selling price ONLY (not cost price)
      const sellingPrice = data.sellingPrice || data.sellPrice || data.price || 0;
      
      return {
        id: docSnap.id,
        name: data.name || 'Unnamed Product',
        price: sellingPrice, // Only use selling price for POS
        category: data.categoryName || data.category || 'General',
        subcategory: data.brand || data.subcategory || undefined,
        image: data.image || '',
        description: data.description || `Product: ${data.productNumber || ''}`,
        stock: data.onHand || 0,
        productNumber: data.productNumber || '',
        barcode: data.barcode || undefined,
        isActive: data.isActive !== undefined ? data.isActive : true,
      };
    });

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Real-time listener for products (efficient, only downloads changes)
export function subscribeToProducts(
  callback: (products: Product[]) => void
): Unsubscribe {
  if (!isConfigured) {
    console.warn('Firebase is not configured.');
    return () => {};
  }

  console.log('🎧 Setting up real-time listener for products and services...');
  
  let productsData: Product[] = [];
  let servicesData: Product[] = [];
  let productsReady = false;
  let servicesReady = false;

  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const servicesRef = collection(db, SERVICES_COLLECTION);
  const productsQuery = query(productsRef, orderBy('name'));
  const servicesQuery = query(servicesRef, orderBy('name'));

  const mergeAndCallback = () => {
    if (productsReady && servicesReady) {
      const allItems = [...productsData, ...servicesData];
      console.log('🔄 Updated:', productsData.length, 'products +', servicesData.length, 'services');
      callback(allItems);
    }
  };

  const unsubscribeProducts = onSnapshot(
    productsQuery,
    (snapshot) => {
      productsData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const sellingPrice = data.sellingPrice || data.sellPrice || data.price || 0;
        
        return {
          id: docSnap.id,
          name: data.name || 'Unnamed Product',
          price: sellingPrice,
          category: data.categoryName || data.category || 'General',
          subcategory: data.brand || data.subcategory || undefined,
          image: data.image || '',
          description: data.description || `Product: ${data.productNumber || ''}`,
          stock: data.onHand || 0,
          productNumber: data.productNumber || '',
          barcode: data.barcode || undefined,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
      });
      productsReady = true;
      mergeAndCallback();
    },
    (error) => {
      console.error('Error in products listener:', error);
    }
  );

  const unsubscribeServices = onSnapshot(
    servicesQuery,
    (snapshot) => {
      servicesData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        return {
          id: docSnap.id,
          name: data.name || 'Unnamed Service',
          price: data.price || 0,
          category: 'Services', // Always set to 'Services' to separate from products
          subcategory: data.typeLabel || data.type || 'Service',
          image: data.image || '',
          description: data.description || '',
          stock: 999999, // Services don't have stock
          productNumber: `SERVICE-${docSnap.id.slice(0, 8)}`,
          barcode: data.barcode || undefined,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
      });
      servicesReady = true;
      mergeAndCallback();
    },
    (error) => {
      console.error('Error in services listener:', error);
    }
  );

  // Return combined unsubscribe function
  return () => {
    unsubscribeProducts();
    unsubscribeServices();
  };
}

// Fetch services from ConvenientStore
export async function getServices(): Promise<Product[]> {
  if (!isConfigured) {
    console.warn('Firebase is not configured.');
    return [];
  }

  try {
    console.log('🔍 Fetching services from ConvenientStore...');
    const servicesRef = collection(db, SERVICES_COLLECTION);
    
    const q = query(servicesRef, orderBy('name'));
    
    const snapshot = await getDocs(q);
    console.log('🛠️ Found services:', snapshot.size);
    
    const services: Product[] = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        name: data.name || 'Unnamed Service',
        price: data.price || 0,
        category: 'Services', // Always set to 'Services' to separate from products
        subcategory: data.typeLabel || data.type || 'Service',
        image: data.image || '',
        description: data.description || '',
        stock: 999999, // Services don't have stock
        productNumber: `SERVICE-${docSnap.id.slice(0, 8)}`,
      };
    });

    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

// Fetch general inventory items (not used in ConvenientStore)
export async function getGeneralItems(): Promise<Product[]> {
  console.log('ℹ️ General items not available in ConvenientStore');
  return [];
}

// Fetch parts inventory (not used in ConvenientStore)
export async function getParts(): Promise<Product[]> {
  console.log('ℹ️ Parts not available in ConvenientStore');
  return [];
}

// Debug function to explore database structure
export async function exploreDatabase(): Promise<void> {
  console.log('✅ Connected to ConvenientStore database');
}

// Fetch categories from ConvenientStore
export async function getCategories(): Promise<Array<{id: string; name: string; description: string}>> {
  if (!isConfigured) {
    console.warn('Firebase is not configured.');
    return [];
  }

  try {
    console.log('🏷️ Fetching categories from ConvenientStore...');
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    
    const snapshot = await getDocs(categoriesRef);
    console.log('📂 Found categories:', snapshot.size);
    
    const categories = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || 'Unnamed Category',
        description: data.description || '',
      };
    });

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Get all products from ConvenientStore (includes products + services)
export async function getAllProducts(): Promise<Product[]> {
  const [products, services] = await Promise.all([
    getInventoryItems(),
    getServices()
  ]);
  
  console.log(`📋 Total items: ${products.length} products + ${services.length} services`);
  return [...products, ...services];
}

// Fetch customers - NOT ALLOWED for POS (privacy protection)
// POS can only CREATE customers, cannot read them
export async function getCustomers(): Promise<Customer[]> {
  console.warn('⚠️ POS cannot read customer list (privacy protection)');
  return [];
}

// Create a customer in ConvenientStore
export async function createCustomer(customerData: Omit<Customer, 'id'>): Promise<{ success: boolean; customerId?: string; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Wait for authentication to be ready
    if (!auth.currentUser) {
      console.log('⏳ Waiting for authentication...');
      await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          }
        });
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 5000);
      });
    }

    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated. Please refresh the page.' };
    }

    console.log('👤 Creating customer in ConvenientStore:', customerData.name);
    console.log('🔐 Authenticated as:', auth.currentUser.uid);
    
    const customersRef = collection(db, CUSTOMERS_COLLECTION);
    
    const newCustomer = {
      name: customerData.name,
      phoneNumber: customerData.phone,
      email: customerData.email || '',
      address: customerData.address || '',
      note: '',
      createdAt: new Date().toISOString(),
      totalPurchases: 0,
      totalSpent: 0,
      lastPurchase: null,
    };

    const docRef = await addDoc(customersRef, newCustomer);
    
    console.log('✅ Customer created successfully:', docRef.id);
    return { success: true, customerId: docRef.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
    console.error('❌ Error creating customer:', error);
    return { success: false, error: errorMessage };
  }
}

// Get customers from API (NOT ALLOWED - returns empty for privacy)
export async function getCustomersFromAPI(): Promise<Customer[]> {
  console.warn('⚠️ POS cannot read customer list (privacy protection)');
  return [];
}

// Search customers - Uses secure Cloud Function
// Returns only basic info (name, phone) without sensitive data
export async function searchCustomers(searchQuery: string): Promise<Customer[]> {
  if (!isConfigured || !app) {
    console.warn('Firebase is not configured.');
    return [];
  }

  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  try {
    const functions = getFunctions(app);
    const searchFunction = httpsCallable(functions, 'searchCustomers');
    
    console.log('🔍 Searching customers via Cloud Function:', searchQuery);
    
    const result = await searchFunction({ query: searchQuery });
    const data = result.data as { success: boolean; customers: Array<{ id: string; name: string; phone: string }>; count: number };
    
    if (data.success && data.customers) {
      console.log(`✅ Found ${data.count} customers`);
      
      // Convert to Customer type (with minimal data)
      return data.customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: '', // Not returned by Cloud Function (privacy)
        address: '', // Not returned by Cloud Function (privacy)
      }));
    }
    
    return [];
  } catch (error: unknown) {
    console.error('❌ Error searching customers:', error);
    return [];
  }
}

// Process a sale transaction in ConvenientStore
// Uses pending_transactions collection for employee write-once security model
export async function processSale(saleData: {
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  tenderedAmount?: number;
  changeGiven?: number;
}): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Wait for authentication to be ready
    if (!auth.currentUser) {
      console.log('⏳ Waiting for authentication...');
      await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          }
        });
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 5000);
      });
    }

    if (!auth.currentUser) {
      return { success: false, error: 'Not authenticated. Please refresh the page.' };
    }

    const employeeId = auth.currentUser.uid;
    const employeeEmail = auth.currentUser.email || 'no-email';
    
    console.log('💰 Processing sale transaction in ConvenientStore...');
    console.log('🔐 Authenticated as:', employeeId);
    console.log('📧 Employee email:', employeeEmail);
    console.log('👤 Employee type:', auth.currentUser.isAnonymous ? 'anonymous' : 'authenticated');
    
    // Create pending transaction (write-once, employee cannot read/edit/delete)
    const pendingTransactionData = {
      // Employee metadata
      employeeId: employeeId,
      employeeEmail: employeeEmail, // Add email for tracking
      employeeType: auth.currentUser.isAnonymous ? 'anonymous' : 'authenticated',
      
      // Transaction data
      customerId: saleData.customerId || null,
      items: saleData.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productNumber: (item.product as {productNumber?: string}).productNumber || '',
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
      })),
      subtotal: saleData.subtotal,
      tax: saleData.tax,
      discount: saleData.discount,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      
      // Cash handling audit fields (for cash transactions)
      ...(saleData.paymentMethod === 'cash' && saleData.tenderedAmount !== undefined && {
        tenderedAmount: saleData.tenderedAmount,
        changeGiven: saleData.changeGiven || 0,
      }),
      
      // Status tracking
      status: 'pending', // Will be 'finalized' when admin approves
      isPending: true,
      isFinalized: false,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      createdAtTimestamp: Date.now(),
      
      // Audit trail
      source: 'POS',
      version: '1.0',
      
      // NOTE: The pending transaction ID (docRef.id) should be stored in final_invoices
      // as 'tempInvoiceId' or 'pendingTransactionId' when admin finalizes the sale
      // This allows matching printed receipts (which show this ID) to final invoices
    };

    // Write to pending_transactions (employee can only write, not read/edit/delete)
    const pendingRef = collection(db, 'pending_transactions');
    const docRef = await addDoc(pendingRef, pendingTransactionData);
    
    console.log('✅ Pending transaction created:', docRef.id);
    console.log('📝 Transaction will be reviewed by admin before finalization');
    
    return { success: true, invoiceId: docRef.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process sale.';
    console.error('❌ Error processing sale:', error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    return { success: false, error: errorMessage };
  }
}