'use client';

import { Product } from '@/types';
import Image from 'next/image';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid grid-cols-8 xl:grid-cols-10 gap-3 mb-24 px-4 auto-rows-fr">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onAddToCart(product)}
          className="group bg-white rounded-2xl p-3 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative border border-gray-100 hover:border-blue-200"
        >
          {/* Image placeholder area */}
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-2 relative overflow-hidden flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover rounded-xl"
              />
            ) : (
              <div className="w-8 h-8 text-gray-400 text-2xl group-hover:text-blue-500 transition-colors duration-300">
                📦
              </div>
            )}
            {product.name === 'Bath Soaps' && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold shadow-sm">
                +Set
              </div>
            )}
          </div>
          
          {/* Product info - left aligned */}
          <div className="text-left">
            <h3 className="font-semibold text-gray-800 text-xs mb-0.5 leading-tight line-clamp-2">{product.name}</h3>
            <p className="text-blue-600 text-xs font-bold">${product.price.toFixed(2)}</p>
          </div>
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      ))}
      
      {/* Dynamic empty slots that adapt to grid */}
      {products.length % 8 !== 0 && Array.from({ length: 8 - (products.length % 8) }, (_, i) => (
        <div key={`empty-${i}`} className="aspect-square bg-gray-50/50 rounded-xl opacity-30" />
      ))}
    </div>
  );
}