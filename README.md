# POS System

A modern Point of Sale (POS) system built with Next.js, React, and Firebase integration. This system provides a tablet-style interface for retail operations.

## Features

- **Product Catalog**: Browse products by categories (Keypad, Library, Favorites, Lighting, Furniture)
- **Shopping Cart**: Add/remove items, adjust quantities, view totals
- **Customer Management**: Add customers to transactions
- **Payment Processing**: Calculate taxes, discounts, and totals
- **Modern UI**: Tablet-optimized interface with responsive design

## Technology Stack

- **Frontend**: Next.js 15 with React and TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Icons**: Lucide React
- **Development**: ESLint, Turbopack

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Update `src/lib/firebase.ts` with your Firebase configuration
   - Set up Firestore database with product collections

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── POSSystem.tsx   # Main POS interface
│   ├── ProductGrid.tsx # Product display grid
│   └── Cart.tsx        # Shopping cart component
├── lib/                # Utility libraries
│   └── firebase.ts     # Firebase configuration
└── types/              # TypeScript type definitions
    └── index.ts        # Shared types
```

## Usage

1. **Browse Products**: Click on category tabs to filter products
2. **Add to Cart**: Click on any product to add it to the cart
3. **Manage Cart**: Adjust quantities or remove items from the cart
4. **Process Payment**: Click "Charge" button to complete the transaction

## Firebase Integration

The system is designed to integrate with your existing Firebase store application from [https://github.com/Funboy83/Store](https://github.com/Funboy83/Store). Update the Firebase configuration in `src/lib/firebase.ts` with your project credentials.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Screenshots

The POS system interface matches the design shown in your screenshot, featuring:
- Category-based product navigation
- Visual product grid with images
- Real-time cart updates
- Customer management
- Payment processing interface

## License

This project is licensed under the MIT License.
