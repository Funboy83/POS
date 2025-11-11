'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Printer, FileText } from 'lucide-react';
import { printThermalReceiptSilent } from '@/lib/thermal-printer';

interface DailySale {
  id: string;
  customerId: string | null;
  customerName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  createdAtTimestamp: number;
}

interface DailySalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailySalesModal({ isOpen, onClose }: DailySalesModalProps) {
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTodaySales();
    }
  }, [isOpen]);

  const loadTodaySales = async () => {
    setLoading(true);
    try {
      // Get today's start and end timestamps
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = Timestamp.fromDate(today);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfDay = Timestamp.fromDate(tomorrow);

      // Query pending_transactions for today's sales
      const q = query(
        collection(db, 'pending_transactions'),
        where('createdAt', '>=', startOfDay.toDate().toISOString()),
        where('createdAt', '<', endOfDay.toDate().toISOString())
      );

      const querySnapshot = await getDocs(q);
      const todaySales: DailySale[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        todaySales.push({
          id: doc.id,
          customerId: data.customerId || null,
          customerName: data.customerName,
          items: data.items || [],
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          total: data.total || 0,
          paymentMethod: data.paymentMethod || 'cash',
          createdAt: data.createdAt || '',
          createdAtTimestamp: data.createdAtTimestamp || 0,
        });
      });

      // Sort by newest first
      todaySales.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);

      setSales(todaySales);
      console.log(`📊 Loaded ${todaySales.length} sales for today`);
    } catch (error) {
      console.error('❌ Error loading today\'s sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (sale: DailySale) => {
    try {
      console.log('🖨️ Printing receipt for sale:', sale.id);
      
      // Convert sale data to format expected by printThermalReceipt
      const receiptData = {
        invoiceId: sale.id,
        date: new Date(sale.createdAt),
        customerName: sale.customerName || 'Walk-in Customer',
        items: sale.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.totalPrice,
        })),
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount: sale.discount,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
      };

      await printThermalReceiptSilent(receiptData);
      console.log('✅ Receipt auto-printed successfully');
    } catch (error) {
      console.error('❌ Error printing receipt:', error);
      alert('Failed to print receipt. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Daily Sales</h2>
              <p className="text-sm text-slate-500">Today's temporary invoices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-slate-600">No sales today</p>
              <p className="text-sm text-slate-400 mt-2">Sales will appear here once transactions are processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg">
                          #{sale.id.slice(0, 8)}
                        </span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Customer: {sale.customerName || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''} • {sale.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">${sale.total.toFixed(2)}</p>
                      <button
                        onClick={() => handlePrint(sale)}
                        className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    </div>
                  </div>

                  {/* Sale Items */}
                  <div className="space-y-2 bg-white rounded-xl p-3 border border-slate-200">
                    {sale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-700">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-semibold text-slate-800">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    
                    {/* Subtotal, Tax, Discount, Total */}
                    <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal:</span>
                        <span>${sale.subtotal.toFixed(2)}</span>
                      </div>
                      {sale.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount:</span>
                          <span>-${sale.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {sale.tax > 0 && (
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Tax:</span>
                          <span>${sale.tax.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold text-slate-800 pt-1 border-t border-slate-300">
                        <span>Total:</span>
                        <span>${sale.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-800">{sales.length}</span> transaction{sales.length !== 1 ? 's' : ''} today
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
