'use client';

import type { Variant } from '../types';

interface VariantSelectionModalProps {
  isOpen: boolean;
  productName: string;
  variants: Variant[];
  onSelect: (variant: Variant) => void;
  onClose: () => void;
}

export function VariantSelectionModal({
  isOpen,
  productName,
  variants,
  onSelect,
  onClose,
}: VariantSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">Select Variant</h2>
          <p className="text-gray-600 mb-6">{productName}</p>
          
          <div className="grid grid-cols-2 gap-4">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  onSelect(variant);
                  onClose();
                }}
                className="border-2 border-gray-300 rounded-lg p-6 flex flex-col items-start hover:bg-blue-50 hover:border-blue-500 transition-all text-left"
              >
                <div className="font-semibold text-lg mb-2">
                  {variant.variantName}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {variant.fullName}
                </div>
                <div className="text-xl font-bold text-green-600">
                  ${variant.price.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Stock: {variant.stockQuantity}
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
