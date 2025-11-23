'use client';

import { Product } from '@/types';
import Image from 'next/image';
import { useState, useMemo } from 'react';

interface ParentProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentProduct: Product | null;
  variants: Product[];
  onSelectVariant: (variant: Product) => void;
}

export function ParentProductVariantModal({
  isOpen,
  onClose,
  parentProduct,
  variants,
  onSelectVariant,
}: ParentProductVariantModalProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  
  const getAttributeLabel = (variant: Product) => {
    if (variant.attributes && variant.attributes.length > 0) {
      return variant.attributes.map((attr: { attribute?: string; value?: string; attributeValue?: string }) => 
        attr.attributeValue || attr.value || ''
      ).join(' ');
    }
    // Extract from name (e.g., "TH Yogurt - Dau" -> "Dau")
    const lastDash = variant.name.lastIndexOf(' - ');
    if (lastDash > 0) {
      return variant.name.substring(lastDash + 3);
    }
    return variant.name;
  };

  const getStockStatus = (stock: number | undefined) => {
    const qty = stock ?? 0;
    if (qty === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (qty < 10) return { text: 'Low Stock', color: 'text-orange-600 bg-orange-50' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  // Extract unique attribute values grouped by attribute name
  const attributeGroups = useMemo(() => {
    const groups: Record<string, Set<string>> = {};
    
    variants.forEach(variant => {
      if (variant.attributes && variant.attributes.length > 0) {
        variant.attributes.forEach((attr: { attribute?: string; value?: string; attributeValue?: string }) => {
          const attrName = attr.attribute || 'FLAVOR';
          const attrValue = attr.attributeValue || attr.value || '';
          
          if (!groups[attrName]) {
            groups[attrName] = new Set();
          }
          groups[attrName].add(attrValue);
        });
      }
    });
    
    return Object.entries(groups).map(([name, values]) => ({
      name,
      values: Array.from(values).sort()
    }));
  }, [variants]);

  // Filter variants based on selected filters
  const filteredVariants = useMemo(() => {
    if (Object.keys(selectedFilters).length === 0) return variants;
    
    return variants.filter(variant => {
      if (!variant.attributes) return false;
      
      return Object.entries(selectedFilters).every(([attrName, attrValue]) => {
        return variant.attributes!.some((attr: { attribute?: string; value?: string; attributeValue?: string }) => {
          const name = attr.attribute || 'FLAVOR';
          const value = attr.attributeValue || attr.value || '';
          return name === attrName && value === attrValue;
        });
      });
    });
  }, [variants, selectedFilters]);

  const toggleFilter = (attrName: string, attrValue: string) => {
    setSelectedFilters(prev => {
      const current = prev[attrName];
      if (current === attrValue) {
        // Remove filter
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [attrName]: _removed, ...rest } = prev;
        return rest;
      } else {
        // Set filter
        return { ...prev, [attrName]: attrValue };
      }
    });
  };
  
  if (!isOpen || !parentProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{parentProduct.name}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">Select a variant to add to cart</p>
        </div>

        {/* Attribute Filters */}
        {attributeGroups.length > 0 && (
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-600">
                Filter by Attributes
              </div>
              {Object.keys(selectedFilters).length > 0 && (
                <button
                  onClick={() => setSelectedFilters({})}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
            {attributeGroups.map(group => (
              <div key={group.name} className="mb-3 last:mb-0">
                <div className="text-sm font-semibold text-gray-700 mb-2 uppercase">
                  {group.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.values.map(value => {
                    const isSelected = selectedFilters[group.name] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => toggleFilter(group.name, value)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Variants Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredVariants.map((variant) => {
              const stockStatus = getStockStatus(variant.stock);
              return (
                <button
                  key={variant.id}
                  onClick={() => onSelectVariant(variant)}
                  className="group bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center"
                >
                  {/* Image */}
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-all">
                    {variant.image ? (
                      <Image
                        src={variant.image}
                        alt={variant.name}
                        fill
                        className="object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-4xl">📦</div>
                    )}
                  </div>

                  {/* Variant Label */}
                  <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                    {getAttributeLabel(variant)}
                  </h3>

                  {/* Price */}
                  <p className="text-blue-600 text-xl font-bold mb-2">
                    ${(variant.price || 0).toFixed(2)}
                  </p>

                  {/* Stock Status */}
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                    {stockStatus.text}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredVariants.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No variants match the selected filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
