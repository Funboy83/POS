'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Customer } from '@/types';
import ProductGrid from './ProductGrid';
import Cart from './Cart';
import CustomerModal, { CustomerSelectionForm } from './EnhancedCustomerModal';
import { getAllProducts, createCustomer, processSale, subscribeToProducts } from '@/lib/actions/pos-data';
import { Search, X } from 'lucide-react';
import { printThermalReceiptSilent } from '@/lib/thermal-printer';

// Dynamic categories - will be populated from actual product data

interface CategoryInfo {
  name: string;
  subcategories: string[];
}

export default function POSSystem() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [showServicesOnly, setShowServicesOnly] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoWalkIn, setAutoWalkIn] = useState(true);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0.0);
  const [taxRateInput, setTaxRateInput] = useState('0.00');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CategoryInfo[]>([]);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0.00);
  const [taxRate, setTaxRate] = useState(0.0); // 0% tax rate initially
  const [searchQuery, setSearchQuery] = useState('');
  
  // Barcode scanner state
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedAutoWalkIn = localStorage.getItem('pos_autoWalkIn');
    const savedTaxRate = localStorage.getItem('pos_defaultTaxRate');
    
    if (savedAutoWalkIn !== null) {
      setAutoWalkIn(savedAutoWalkIn === 'true');
    }
    if (savedTaxRate !== null) {
      const rate = parseFloat(savedTaxRate);
      setDefaultTaxRate(rate);
      setTaxRate(rate);
      setTaxRateInput((rate * 100).toFixed(2));
    }
  }, []);

  // Apply auto walk-in customer
  useEffect(() => {
    if (autoWalkIn && !customer && cart.length > 0) {
      setCustomer({
        id: 'walk-in',
        name: 'Walk-in Customer',
        phone: '',
        email: '',
        address: '',
      });
    }
  }, [cart.length, customer, autoWalkIn]);

  // Load products from Firebase with real-time updates
  useEffect(() => {
    console.log('🚀 Initializing product sync...');
    
    // Set up real-time listener for instant updates
    const unsubscribe = subscribeToProducts((allProducts) => {
      console.log('✨ Products updated via real-time listener:', allProducts.length);
      
      // Separate products and services for category building
      const productsOnly = allProducts.filter(p => p.category !== 'Services');
      const servicesOnly = allProducts.filter(p => p.category === 'Services');
      
      console.log(`� Products: ${productsOnly.length}, 🛠️ Services: ${servicesOnly.length}`);
      
      // Build categories from products only (excluding Services category itself)
      const categoryMap = new Map<string, Set<string>>();
      
      productsOnly.forEach(product => {
        let category = product.category?.trim();

        // If category is missing from the data, try to guess it
        if (!category || category === 'Services') {
          if (product.phoneData) {
            category = 'Inventory';
          } else {
            category = 'General Items'; 
          }
          product.category = category;
        }
        
        // Skip if somehow still Services
        if (category === 'Services') {
          return;
        }
        
        // Add category to the map
        if (!categoryMap.has(category)) {
          categoryMap.set(category, new Set());
        }
        
        // Add subcategory if it exists
        if (product.subcategory && product.subcategory.trim() !== '') {
          categoryMap.get(category)!.add(product.subcategory);
        }
      });
      
      // Build categories from services (they use subcategory field for service type like "Prepaid Wireless", "Repair")
      const serviceCategoryMap = new Map<string, Set<string>>();
      
      servicesOnly.forEach(service => {
        // Services use subcategory field for their type (like "Prepaid Wireless", "Repair")
        const serviceType = service.subcategory || 'General Service';
        
        if (!serviceCategoryMap.has(serviceType)) {
          serviceCategoryMap.set(serviceType, new Set());
        }
      });
      
      // Set the products state *after* they have been processed
      setProducts(allProducts);

      // Build product categories
      const categoriesInfo: CategoryInfo[] = [
        { name: 'All', subcategories: [] },
        ...Array.from(categoryMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([categoryName, subcategoriesSet]) => ({
            name: categoryName,
            subcategories: Array.from(subcategoriesSet).sort()
          }))
      ];
      
      // Build service categories
      const serviceCategoriesInfo: CategoryInfo[] = [
        { name: 'All', subcategories: [] },
        ...Array.from(serviceCategoryMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([categoryName]) => ({
            name: categoryName,
            subcategories: []
          }))
      ];
      
      console.log('🏷️ Product categories:', categoriesInfo);
      console.log('🛠️ Service categories:', serviceCategoriesInfo);
      setCategories(categoriesInfo);
      setServiceCategories(serviceCategoriesInfo);
      setLoading(false);
    });

    // Fallback: Refresh every 2 hours as backup (in case listener disconnects)
    const fallbackRefresh = setInterval(() => {
      console.log('🔄 Fallback refresh (2 hours)...');
      getAllProducts().then(products => {
        // Process same way as real-time listener would
        const categoryMap = new Map<string, Set<string>>();
        products.forEach(product => {
          const category = product.category?.trim() || 'General Items';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, new Set());
          }
          if (product.subcategory && product.subcategory.trim() !== '') {
            categoryMap.get(category)!.add(product.subcategory);
          }
        });
        
        setProducts(products);
        const categoriesInfo: CategoryInfo[] = [
          { name: 'All', subcategories: [] },
          ...Array.from(categoryMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([categoryName, subcategoriesSet]) => ({
              name: categoryName,
              subcategories: Array.from(subcategoriesSet).sort()
            }))
        ];
        setCategories(categoriesInfo);
      });
    }, 2 * 60 * 60 * 1000); // 2 hours

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up product listeners...');
      unsubscribe();
      clearInterval(fallbackRefresh);
    };
  }, []);

  // Barcode scanner event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field (except search box during scanning)
      const target = e.target as HTMLElement;
      const isSearchInput = target === searchInputRef.current;
      
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !isSearchInput) {
        return;
      }

      // If it's the search input and we're starting to accumulate a barcode, blur it
      if (isSearchInput && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Check if this might be a barcode scan (multiple chars coming fast)
        searchInputRef.current?.blur();
      }

      // If Enter key, process the barcode
      if (e.key === 'Enter' && barcodeBuffer.trim()) {
        e.preventDefault();
        const barcode = barcodeBuffer.trim();
        
        console.log('🔍 Searching for barcode:', barcode);
        console.log('📦 Total products loaded:', products.length);
        console.log('🔢 Products with barcodes:', products.filter(p => p.barcode).length);
        
        // Search for product by barcode
        const product = products.find(p => {
          const productBarcode = p.barcode?.trim();
          console.log('Checking product:', p.name, 'Barcode:', productBarcode);
          return productBarcode && productBarcode === barcode;
        });
        
        if (product) {
          console.log('✅ Barcode found:', barcode, 'Product:', product.name);
          addToCart(product);
          setBarcodeBuffer('');
        } else {
          console.log('❌ Barcode not found:', barcode);
          console.log('Available barcodes:', products.filter(p => p.barcode).map(p => ({ name: p.name, barcode: p.barcode })));
          alert(`Product with barcode "${barcode}" not found`);
          setBarcodeBuffer('');
        }
        
        // Clear any existing timer
        if (barcodeTimerRef.current) {
          clearTimeout(barcodeTimerRef.current);
          barcodeTimerRef.current = null;
        }
        return;
      }

      // Accumulate barcode characters (ignore modifier keys)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault(); // Prevent typing into search box
        console.log('📝 Barcode buffer:', barcodeBuffer + e.key);
        setBarcodeBuffer(prev => prev + e.key);
        
        // Clear buffer after 200ms of inactivity (scanner types fast)
        if (barcodeTimerRef.current) {
          clearTimeout(barcodeTimerRef.current);
        }
        barcodeTimerRef.current = setTimeout(() => {
          console.log('⏰ Barcode buffer timeout, clearing');
          setBarcodeBuffer('');
        }, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
  }, [barcodeBuffer, products]);

  const filteredProducts = (() => {
    let filtered = products;
    
    // First filter: Services or Products
    if (showServicesOnly) {
      // Show only services
      filtered = filtered.filter((product: Product) => 
        product.category === 'Services'
      );
    } else {
      // Show only products (not services)
      filtered = filtered.filter((product: Product) => 
        product.category !== 'Services'
      );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product: Product) => 
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.id?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter (for the items within Services or Products)
    if (activeCategory !== 'All') {
      if (showServicesOnly) {
        // For services, filter by subcategory (like "Prepaid Wireless", "Repair")
        filtered = filtered.filter((product: Product) => 
          product.subcategory === activeCategory
        );
      } else {
        // For products, filter by category
        filtered = filtered.filter((product: Product) => 
          product.category === activeCategory
        );
      }
    }
    
    // Apply subcategory filter if selected (for products)
    if (activeSubcategory && !showServicesOnly) {
      filtered = filtered.filter((product: Product) => 
        product.subcategory === activeSubcategory
      );
    }
    
    // Filter out inactive products (only show active products)
    filtered = filtered.filter((product: Product) => 
      product.isActive !== false
    );
    
    return filtered;
  })();

  // Get current category info - use service categories when in services mode
  const activeCategoryList = showServicesOnly ? serviceCategories : categories;
  const currentCategoryInfo = activeCategoryList.find(cat => cat.name === activeCategory);
  const hasSubcategories = currentCategoryInfo && currentCategoryInfo.subcategories.length > 0;

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const openCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'digital') => {
    setIsProcessing(true);
    
    try {
      console.log('💳 Processing payment:', paymentMethod);
      
      // Prepare sale data with cash handling info
      const saleData: {
        customerId?: string;
        items: typeof cart;
        subtotal: number;
        tax: number;
        discount: number;
        total: number;
        paymentMethod: typeof paymentMethod;
        tenderedAmount?: number;
        changeGiven?: number;
      } = {
        customerId: customer?.id,
        items: cart,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
      };

      // Add cash handling data for cash payments
      if (paymentMethod === 'cash' && cashReceived) {
        const tenderedAmount = parseFloat(cashReceived);
        saleData.tenderedAmount = tenderedAmount;
        saleData.changeGiven = tenderedAmount - total;
      }
      
      const result = await processSale(saleData);

      if (result.success) {
        console.log('✅ Sale processed successfully!', result.invoiceId);
        
        // Auto-print receipt
        try {
          const receiptData = {
            invoiceId: result.invoiceId || 'N/A',
            date: new Date(),
            customerName: customer?.name || 'Walk-in Customer',
            items: cart.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
              total: item.product.price * item.quantity,
            })),
            subtotal,
            tax,
            discount,
            total,
            paymentMethod,
            tenderedAmount: saleData.tenderedAmount,
            changeGiven: saleData.changeGiven,
          };
          
          // Auto-print silently (no dialog)
          await printThermalReceiptSilent(receiptData);
          console.log('✅ Receipt auto-printed successfully');
        } catch (printError) {
          console.error('❌ Error printing receipt:', printError);
          // Continue even if print fails
        }
        
        // Show different messages for cash vs other payments
        if (paymentMethod === 'cash' && cashReceived) {
          const tenderedAmount = parseFloat(cashReceived);
          const change = tenderedAmount - total;
          alert(
            `Sale completed! Invoice: ${result.invoiceId}\n\n` +
            `Total: $${total.toFixed(2)}\n` +
            `Cash Received: $${tenderedAmount.toFixed(2)}\n` +
            `Change: $${change.toFixed(2)}\n\n` +
            `Receipt is printing automatically...`
          );
        } else {
          alert(`Sale completed! Invoice: ${result.invoiceId}\n\nReceipt is printing automatically...`);
        }
        
        // Clear cart and customer after successful sale
        setCart([]);
        setCustomer(null);
        setDiscount(0);
        setShowPaymentModal(false);
        setShowCashModal(false);
        setCashReceived('');
      } else {
        console.error('❌ Sale failed:', result.error);
        alert(`Sale failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
      alert('An error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + tax;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Main Product Area */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Search Bar with Services Toggle */}
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by name, description, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Services/Products Toggle Button */}
          <button
            onClick={() => {
              setShowServicesOnly(!showServicesOnly);
              setActiveCategory('All');
              setActiveSubcategory(null);
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-sm flex items-center gap-2 ${
              showServicesOnly
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <span className="text-xl">{showServicesOnly ? '🛠️' : '📦'}</span>
            <span>{showServicesOnly ? 'Services' : 'Products'}</span>
          </button>
        </div>
        
        {/* Modern Segmented Control Navigation - Always visible */}
        <div className="space-y-4 mb-8">
          {/* Header with Refresh Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700">Categories</h2>
            <button
              onClick={async () => {
                console.log('🔄 Manual refresh triggered...');
                setLoading(true);
                const allProducts = await getAllProducts();
                // Rebuild categories (excluding parts)
                const categoryMap = new Map<string, Set<string>>();
                allProducts.forEach(product => {
                  if (product.category) {
                    if (!categoryMap.has(product.category)) {
                      categoryMap.set(product.category, new Set());
                    }
                    if (product.subcategory) {
                      categoryMap.get(product.category)!.add(product.subcategory);
                    }
                  }
                });
                const categoriesInfo: CategoryInfo[] = [
                  { name: 'All', subcategories: [] },
                  ...Array.from(categoryMap.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([categoryName, subcategoriesSet]) => ({
                      name: categoryName,
                      subcategories: Array.from(subcategoriesSet).sort()
                    }))
                ];
                setProducts(allProducts);
                setCategories(categoriesInfo);
                setLoading(false);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5"
            >
              🔄 Refresh
            </button>
          </div>
          
          {/* Main Categories */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg inline-flex">
            {activeCategoryList.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  setActiveCategory(category.name);
                  setActiveSubcategory(null);
                  setShowSubcategories(category.subcategories.length > 0);
                }}
                className={`px-6 py-3 font-semibold text-sm tracking-tight transition-all duration-300 rounded-xl flex items-center gap-2 ${
                  activeCategory === category.name
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white/50 hover:text-blue-600'
                }`}
              >
                {category.name}
                {category.subcategories.length > 0 && (
                  <span className="text-xs opacity-70">({category.subcategories.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Subcategories */}
          {hasSubcategories && showSubcategories && (
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg inline-flex flex-wrap gap-1">
              <button
                onClick={() => setActiveSubcategory(null)}
                className={`px-4 py-2 text-xs font-medium transition-all duration-300 rounded-lg ${
                  activeSubcategory === null
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/50 hover:text-indigo-600'
                }`}
              >
                All {activeCategory}
              </button>
              {currentCategoryInfo?.subcategories.map((subcategory) => (
                <button
                  key={subcategory}
                  onClick={() => setActiveSubcategory(subcategory)}
                  className={`px-4 py-2 text-xs font-medium transition-all duration-300 rounded-lg ${
                    activeSubcategory === subcategory
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white/50 hover:text-indigo-600'
                  }`}
                >
                  {subcategory}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-center mt-4 text-slate-600 font-medium">Loading products...</p>
              </div>
            </div>
          ) : (
            <ProductGrid 
              products={filteredProducts} 
              onAddToCart={addToCart}
            />
          )}
        </div>

        {/* Modern Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-96 glass-effect border-t border-white/20">
          <div className="flex items-center justify-around max-w-md mx-auto py-3">
            <button 
              onClick={openCheckout}
              className="flex flex-col items-center gap-1 p-3 rounded-xl modern-button hover:bg-blue-50 group"
            >
              <div className="w-6 h-6 text-blue-500 group-hover:text-blue-600">💳</div>
              <span className="text-xs font-semibold text-blue-500 group-hover:text-blue-600">Checkout</span>
            </button>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl modern-button hover:bg-slate-50 group"
            >
              <div className="w-6 h-6 text-slate-500 group-hover:text-slate-600">⚙️</div>
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-600">Settings</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl modern-button hover:bg-slate-50 group">
              <div className="w-6 h-6 text-slate-500 group-hover:text-slate-600">
                {autoWalkIn ? '�' : '👤'}
              </div>
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-600">
                {autoWalkIn ? 'Walk-in ON' : 'Walk-in OFF'}
              </span>
            </button>
            <button 
              onClick={() => {
                setAutoWalkIn(!autoWalkIn);
                localStorage.setItem('pos_autoWalkIn', (!autoWalkIn).toString());
                if (!autoWalkIn) {
                  setCustomer({
                    id: 'walk-in',
                    name: 'Walk-in Customer',
                    phone: '',
                    email: '',
                    address: '',
                  });
                } else if (customer?.id === 'walk-in') {
                  setCustomer(null);
                }
              }}
              className="flex flex-col items-center gap-1 p-3 rounded-xl modern-button hover:bg-slate-50 group"
            >
              <div className="w-6 h-6 text-slate-500 group-hover:text-slate-600">🔄</div>
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-600">Toggle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white/50 backdrop-blur-2xl border-l border-white/20 shadow-2xl">
        <Cart
          cart={cart}
          customer={customer}
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          total={total}
          taxRate={taxRate}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onAddCustomer={() => setShowCustomerModal(true)}
          onUpdateDiscount={setDiscount}
          onUpdateTaxRate={setTaxRate}
          onCheckout={openCheckout}
          isProcessing={isProcessing}
          autoWalkIn={autoWalkIn}
          onToggleWalkIn={() => {
            const newValue = !autoWalkIn;
            setAutoWalkIn(newValue);
            localStorage.setItem('pos_autoWalkIn', newValue.toString());
            
            if (newValue) {
              setCustomer({
                id: 'walk-in',
                name: 'Walk-in Customer',
                phone: '',
                email: '',
                address: '',
              });
            } else if (customer?.id === 'walk-in') {
              setCustomer(null);
            }
          }}
        />
      </div>

      {/* Enhanced Customer Modal with Walk-in Support */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select Customer"
      >
        <CustomerSelectionForm
          onSubmit={async (selectedCustomer, isWalkIn, walkInName) => {
            try {
              console.log('📋 Customer selection submitted:', { selectedCustomer, isWalkIn, walkInName });
              
              if (isWalkIn) {
                // Handle walk-in customer
                const walkInCustomer: Customer = {
                  id: 'walk-in-' + Date.now(),
                  name: walkInName ? `Walk-In - ${walkInName}` : 'Walk-In Customer',
                  email: '',
                  phone: '0000000000',
                  loyaltyPoints: 0
                };
                setCustomer(walkInCustomer);
                console.log('🚶 Walk-in customer set:', walkInCustomer);
              } else if (selectedCustomer) {
                // Handle existing or new customer
                if (selectedCustomer.id.startsWith('temp-')) {
                  // This is a new customer that needs to be created via API
                  console.log('🆕 Creating new customer via API:', selectedCustomer);
                  const result = await createCustomer(selectedCustomer);
                  if (result.success) {
                    // Update customer with real ID from database
                    const createdCustomer = {
                      ...selectedCustomer,
                      id: result.customerId || selectedCustomer.id
                    };
                    setCustomer(createdCustomer);
                    console.log('✅ New customer created and set:', createdCustomer);
                  } else {
                    console.error('❌ Error creating customer:', result.error);
                    // Still set customer locally for this session
                    setCustomer(selectedCustomer);
                    console.log('⚠️ Customer set locally despite API error:', selectedCustomer);
                  }
                } else {
                  // Existing customer from search
                  setCustomer(selectedCustomer);
                  console.log('👤 Existing customer selected and set:', selectedCustomer);
                }
              }
              
              console.log('✅ Customer state updated, closing modal');
              setShowCustomerModal(false);
            } catch (error) {
              console.error('❌ Error handling customer selection:', error);
              setShowCustomerModal(false);
            }
          }}
        />
      </CustomerModal>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Select Payment Method</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowCashModal(true);
                  setCashReceived('');
                }}
                disabled={isProcessing}
                className="w-full p-6 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 rounded-2xl flex items-center gap-4 transition-all duration-300 modern-button disabled:opacity-50"
              >
                <span className="text-4xl">💵</span>
                <div className="text-left">
                  <div className="font-bold text-lg text-slate-800">Cash</div>
                  <div className="text-sm text-slate-600">Pay with cash - Calculate change</div>
                </div>
              </button>

              <button
                onClick={() => handleCheckout('card')}
                disabled={isProcessing}
                className="w-full p-6 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 rounded-2xl flex items-center gap-4 transition-all duration-300 modern-button disabled:opacity-50"
              >
                <span className="text-4xl">💳</span>
                <div className="text-left">
                  <div className="font-bold text-lg text-slate-800">Card</div>
                  <div className="text-sm text-slate-600">Credit or debit card</div>
                </div>
              </button>

              <button
                onClick={() => handleCheckout('digital')}
                disabled={isProcessing}
                className="w-full p-6 bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 rounded-2xl flex items-center gap-4 transition-all duration-300 modern-button disabled:opacity-50"
              >
                <span className="text-4xl">📱</span>
                <div className="text-left">
                  <div className="font-bold text-lg text-slate-800">Digital Wallet</div>
                  <div className="text-sm text-slate-600">Apple Pay, Google Pay, etc.</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              disabled={isProcessing}
              className="w-full mt-6 p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-semibold text-slate-700 transition-all duration-300 modern-button disabled:opacity-50"
            >
              Cancel
            </button>

            {isProcessing && (
              <div className="mt-4 text-center text-slate-600">
                <div className="animate-spin inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="mt-2">Processing payment...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cash Payment Modal with Change Calculation */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Cash Payment</h2>
            <p className="text-slate-600 mb-6">Total: <span className="font-bold text-2xl text-green-600">${total.toFixed(2)}</span></p>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cash Received
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[20, 50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount.toString())}
                    className="py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700 transition-all duration-300 modern-button"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Exact button */}
              <button
                onClick={() => setCashReceived(total.toFixed(2))}
                className="w-full mt-2 py-3 bg-blue-100 hover:bg-blue-200 rounded-xl font-semibold text-blue-700 transition-all duration-300 modern-button"
              >
                Exact Amount (${total.toFixed(2)})
              </button>
            </div>

            {/* Change calculation */}
            {cashReceived && parseFloat(cashReceived) >= total && (
              <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Change</p>
                  <p className="text-4xl font-black text-green-600">
                    ${(parseFloat(cashReceived) - total).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Warning if insufficient */}
            {cashReceived && parseFloat(cashReceived) < total && (
              <div className="mb-6 p-4 bg-red-50 rounded-2xl border-2 border-red-200">
                <p className="text-center text-red-600 font-semibold">
                  Insufficient amount! Need ${(total - parseFloat(cashReceived)).toFixed(2)} more
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCashModal(false);
                  setShowPaymentModal(true);
                  setCashReceived('');
                }}
                disabled={isProcessing}
                className="flex-1 p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-semibold text-slate-700 transition-all duration-300 modern-button disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!cashReceived || parseFloat(cashReceived) < total) {
                    alert('Please enter sufficient cash amount');
                    return;
                  }
                  handleCheckout('cash');
                }}
                disabled={isProcessing || !cashReceived || parseFloat(cashReceived) < total}
                className="flex-1 p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-2xl transition-all duration-300 modern-button disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">POS Settings</h2>
            
            <div className="space-y-6">
              {/* Default Tax Rate */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Default Tax Rate (%)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={taxRateInput}
                  onChange={(e) => {
                    const input = e.target.value;
                    // Allow empty, numbers, and one decimal point
                    if (input === '' || /^\d*\.?\d*$/.test(input)) {
                      setTaxRateInput(input);
                      // Only update the actual tax rate if it's a valid number
                      const numValue = parseFloat(input);
                      if (!isNaN(numValue)) {
                        const rate = numValue / 100;
                        setDefaultTaxRate(rate);
                        setTaxRate(rate);
                        localStorage.setItem('pos_defaultTaxRate', rate.toString());
                      }
                    }
                  }}
                  onBlur={() => {
                    // Format on blur
                    const numValue = parseFloat(taxRateInput);
                    if (!isNaN(numValue)) {
                      setTaxRateInput(numValue.toFixed(2));
                    } else {
                      setTaxRateInput('0.00');
                      setDefaultTaxRate(0);
                      setTaxRate(0);
                      localStorage.setItem('pos_defaultTaxRate', '0');
                    }
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-3 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Current: {(defaultTaxRate * 100).toFixed(2)}% (${(subtotal * defaultTaxRate).toFixed(2)} on ${subtotal.toFixed(2)})
                </p>
              </div>

              {/* Auto Walk-in Customer */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Auto Walk-in Customer
                </label>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {autoWalkIn ? 'Enabled' : 'Disabled'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {autoWalkIn ? 'Automatically add walk-in customer to cart' : 'Manually select customer'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !autoWalkIn;
                      setAutoWalkIn(newValue);
                      localStorage.setItem('pos_autoWalkIn', newValue.toString());
                      
                      if (newValue) {
                        setCustomer({
                          id: 'walk-in',
                          name: 'Walk-in Customer',
                          phone: '',
                          email: '',
                          address: '',
                        });
                      } else if (customer?.id === 'walk-in') {
                        setCustomer(null);
                      }
                    }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      autoWalkIn ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        autoWalkIn ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Clear Cart */}
              <div>
                <button
                  onClick={() => {
                    if (confirm('Clear all items from cart?')) {
                      setCart([]);
                      setCustomer(null);
                      setDiscount(0);
                    }
                  }}
                  className="w-full p-4 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-all duration-300 modern-button"
                >
                  🗑️ Clear Cart
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full mt-6 p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-semibold text-slate-700 transition-all duration-300 modern-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}