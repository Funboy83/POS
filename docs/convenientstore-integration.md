# POS App Integration with ConvenientStore

## Changes Made

### 1. Removed Authentication ✅
- **File**: `src/app/layout.tsx`
- **Changes**: Removed `AuthProvider` and `AuthGuardWithContext` wrappers
- **Result**: POS app now loads directly without login screen

### 2. Updated Firebase Configuration ✅
- **File**: `src/lib/firebase.ts`
- **Changes**: 
  - Replaced Firebase config with ConvenientStore project credentials
  - Project ID: `studio-5302783866-e8cbe`
  - Removed `auth` export (authentication not needed)
- **Result**: POS now connects to ConvenientStore Firebase project

### 3. Updated Database Collections
- **File**: `src/lib/actions/pos-data.ts`
- **Collections Updated**:
  ```typescript
  const PRODUCTS_COLLECTION = 'products';          // Was: DATA_PATH/inventory
  const CUSTOMERS_COLLECTION = 'customers';        // Same
  const CATEGORIES_COLLECTION = 'categories';      // New
  const BRANDS_COLLECTION = 'brands';              // New
  const SALES_COLLECTION = 'saleTransactions';    // Was: invoices
  ```

### 4. Product Fetching - Show Only Sell Price
The POS now fetches from ConvenientStore's `products` collection and uses only the selling price:

```typescript
// In getAllProducts():
const sellingPrice = data.sellingPrice || data.sellPrice || data.price || 0;

return {
  ...
  price: sellingPrice, // Only selling price shown in POS
  ...
};
```

## Database Schema Mapping

### ConvenientStore Product Structure:
```typescript
{
  id: string,
  name: string,
  productNumber: string,
  sellingPrice: number,      // ← This is what POS displays
  costPrice: number,         // Not used in POS
  category: string,
  brand: string,
  onHand: number,           // Stock quantity
  image: string,
  description: string
}
```

### POS Product Structure:
```typescript
{
  id: string,
  name: string,
  price: number,            // = sellingPrice from ConvenientStore
  category: string,
  subcategory: string,      // = brand from ConvenientStore
  image: string,
  description: string,
  stock: number,            // = onHand from ConvenientStore
  productNumber: string
}
```

## Functions to Update

Still need to update these functions in `pos-data.ts`:

1. ✅ `getAllProducts()` - Fetch from `products` collection
2. ⏳ `getInventoryItems()` - Make it alias to `getAllProducts()`
3. ⏳ `getServices()` - Return empty array (no services in ConvenientStore)
4. ⏳ `getGeneralItems()` - Return empty array
5. ⏳ `getParts()` - Return empty array
6. ⏳ `getCategories()` - Fetch from `categories` collection
7. ⏳ `getCustomers()` - Fetch from `customers` collection
8. ⏳ `createCustomer()` - Create in `customers` collection
9. ⏳ `searchCustomers()` - Search in `customers` collection
10. ⏳ `processSale()` - Save to `saleTransactions` collection

## Testing Checklist

- [ ] POS loads without login screen
- [ ] Products from ConvenientStore display in POS
- [ ] Only selling prices are shown (not cost prices)
- [ ] Categories work correctly
- [ ] Customers can be selected/created
- [ ] Sales transactions are saved to ConvenientStore database

## Next Steps

1. Complete function updates in `pos-data.ts`
2. Test POS with real ConvenientStore data
3. Verify sales transactions are saved correctly
4. Test customer creation from POS
