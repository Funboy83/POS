'use client';

import { useState } from 'react';
import { CartItem, Customer } from '@/types';
import { Plus, Minus, User, Clock, FileText } from 'lucide-react';
import DailySalesModal from './DailySalesModal';

interface CartProps {
  cart: CartItem[];
  customer: Customer | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  taxRate: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onAddCustomer: () => void;
  onUpdateDiscount: (discount: number) => void;
  onUpdateTaxRate: (taxRate: number) => void;
  onCheckout: () => void;
  isProcessing?: boolean;
  autoWalkIn: boolean;
  onToggleWalkIn: () => void;
}

export default function Cart({
  cart,
  customer,
  subtotal,
  discount,
  tax,
  total,
  taxRate,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onAddCustomer,
  onUpdateDiscount,
  onUpdateTaxRate,
  onCheckout,
  isProcessing = false,
  autoWalkIn,
  onToggleWalkIn,
}: CartProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [showDailySales, setShowDailySales] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Modern Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-800">Current sale ({itemCount})</span>
        </div>
        <button className="p-3 hover:bg-white/50 rounded-xl transition-colors modern-button">
          <span className="text-slate-500 text-lg">⋯</span>
        </button>
      </div>

      {/* Modern Add Customer Button */}
      <div className="p-6 border-b border-white/20">
        {customer ? (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{customer.name}</p>
                  <p className="text-sm text-slate-600">{customer.phone}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onAddCustomer}
                className="flex-1 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Change Customer
              </button>
              <button
                onClick={onToggleWalkIn}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  autoWalkIn 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {autoWalkIn ? '🚶 Walk-in ON' : '👤 Walk-in OFF'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onAddCustomer}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-2xl transition-all duration-300 modern-button border border-blue-100 hover:border-blue-200 hover:shadow-md"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                <User className="w-6 h-6 text-white" />
              </div>
              <span className="text-blue-700 font-bold text-lg flex-1 text-left">Add a customer</span>
              <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg font-bold">›</span>
              </div>
            </button>
            <button
              onClick={onToggleWalkIn}
              className={`w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                autoWalkIn 
                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300' 
                  : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 hover:from-slate-200 hover:to-slate-300'
              }`}
            >
              {autoWalkIn ? '🚶 Auto Walk-in Customer: ON' : '👤 Auto Walk-in Customer: OFF'}
            </button>
          </div>
        )}
      </div>

      {/* Modern Cart Items */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4">
        {cart.map((item) => (
          <div key={item.product.id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg mb-1">{item.product.name}</h3>
                {item.product.name === 'Bath Soaps' && (
                  <p className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-lg inline-block">Lavender</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-slate-800 mb-4">${((item.product.price || 0) * item.quantity).toFixed(2)}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center hover:from-red-100 hover:to-red-200 hover:shadow-md transition-all duration-300 modern-button"
                  >
                    <Minus className="w-5 h-5 text-gray-600 hover:text-red-600" />
                  </button>
                  <span className="w-12 text-center text-lg font-bold text-slate-800 bg-gradient-to-br from-blue-50 to-indigo-50 py-2 rounded-xl">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center hover:from-blue-200 hover:to-blue-300 hover:shadow-md transition-all duration-300 modern-button"
                  >
                    <Plus className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Order Summary */}
      <div className="p-6 border-t border-white/20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="text-slate-600 font-semibold">Discounts</span>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">- $</span>
              <input
                type="number"
                value={discount.toFixed(2)}
                onChange={(e) => onUpdateDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 px-3 py-2 text-base text-green-600 font-bold bg-white/70 rounded-lg border border-green-200 focus:border-green-500 focus:outline-none text-right"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-slate-600 font-semibold">Tax Rate</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={(taxRate * 100).toFixed(2)}
                onChange={(e) => onUpdateTaxRate((parseFloat(e.target.value) || 0) / 100)}
                className="w-20 px-3 py-2 text-base text-slate-800 font-bold bg-white/70 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none text-right"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
              />
              <span className="text-slate-800 font-bold">%</span>
            </div>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-slate-600 font-semibold">Tax Amount</span>
            <span className="text-slate-800 font-bold">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-2xl pt-4 border-t border-slate-200">
            <span className="font-black text-slate-800">Total</span>
            <span className="font-black text-slate-800">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Modern Charge Button */}
        <button 
          onClick={onCheckout}
          disabled={cart.length === 0 || isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-black text-xl py-5 rounded-2xl mt-6 transition-all duration-300 modern-button shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-3">
            <span>💳</span>
            <span>{isProcessing ? 'Processing...' : `Charge $${total.toFixed(2)}`}</span>
          </div>
        </button>

        {/* Daily Sale Button */}
        <button
          onClick={() => setShowDailySales(true)}
          className="w-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold text-sm py-3 rounded-xl mt-3 transition-all duration-300 modern-button shadow-md hover:shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Daily Sale</span>
          </div>
        </button>
      </div>

      {/* Daily Sales Modal */}
      <DailySalesModal
        isOpen={showDailySales}
        onClose={() => setShowDailySales(false)}
      />
    </div>
  );
}