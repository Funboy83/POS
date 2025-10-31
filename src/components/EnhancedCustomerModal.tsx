'use client';

import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Users } from 'lucide-react';
import { Customer } from '@/types';
import { searchCustomers, getCustomersFromAPI } from '@/lib/actions/pos-data';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Enhanced iOS-style modal
export default function CustomerModal({ isOpen, onClose, title, children }: CustomerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div
        className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl rounded-3xl flex flex-col animate-fade-in"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
          <h2 className="text-2xl font-black text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/80 rounded-2xl transition-all duration-300 modern-button"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Enhanced Customer Selection Form with Walk-in Support
export function CustomerSelectionForm({ 
  onSubmit 
}: { 
  onSubmit: (customer: Customer | null, isWalkIn: boolean, walkInName?: string) => void 
}) {
  const [mode, setMode] = useState<'search' | 'create' | 'walkin'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  
  // New customer form data
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Search customers as user types
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchCustomers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const handleSelectExistingCustomer = (customer: Customer) => {
    onSubmit(customer, false);
  };

  const handleWalkInSubmit = () => {
    onSubmit(null, true, walkInName.trim() || undefined);
  };

  const handleCreateNewCustomer = () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      alert('Name and phone are required');
      return;
    }

    const customer: Customer = {
      id: 'temp-' + Date.now(),
      name: newCustomer.name.trim(),
      email: newCustomer.email.trim(),
      phone: newCustomer.phone.trim(),
      loyaltyPoints: 0
    };

    onSubmit(customer, false);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setMode('search')}
          className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
            mode === 'search' 
              ? 'border-blue-500 bg-blue-50 text-blue-600' 
              : 'border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <Search className="w-6 h-6" />
          <span className="font-medium text-sm">Find Customer</span>
        </button>
        
        <button
          onClick={() => setMode('walkin')}
          className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
            mode === 'walkin' 
              ? 'border-green-500 bg-green-50 text-green-600' 
              : 'border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <Users className="w-6 h-6" />
          <span className="font-medium text-sm">Walk-In</span>
        </button>
        
        <button
          onClick={() => setMode('create')}
          className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
            mode === 'create' 
              ? 'border-purple-500 bg-purple-50 text-purple-600' 
              : 'border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <UserPlus className="w-6 h-6" />
          <span className="font-medium text-sm">New Customer</span>
        </button>
      </div>

      {/* Search Mode */}
      {mode === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all duration-300"
            />
          </div>

          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-slate-600 mt-2">Searching...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectExistingCustomer(customer)}
                  className="w-full p-4 text-left bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                >
                  <div className="font-semibold text-slate-800">{customer.name}</div>
                  <div className="text-sm text-slate-600">{customer.phone}</div>
                  {customer.email && <div className="text-sm text-slate-500">{customer.email}</div>}
                </button>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No customers found for "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Walk-in Mode */}
      {mode === 'walkin' && (
        <div className="space-y-6">
          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <Users className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-green-800 mb-2">Walk-In Customer</h3>
            <p className="text-sm text-green-700">Quick checkout for customers without accounts</p>
          </div>
          
          <div>
            <label className="block text-base font-bold text-slate-800 mb-3">
              Customer Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. John (for receipt)"
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-green-500 transition-all duration-300"
            />
            <p className="text-sm text-slate-600 mt-2">Leave blank for anonymous purchase</p>
          </div>

          <button
            onClick={handleWalkInSubmit}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Continue with Walk-In
          </button>
        </div>
      )}

      {/* Create New Customer Mode */}
      {mode === 'create' && (
        <div className="space-y-6">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-3">
              Name *
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-3">
              Phone Number *
            </label>
            <input
              type="tel"
              placeholder="e.g. 555-123-4567"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-3">
              Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. john@example.com"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-medium text-slate-800 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all duration-300"
            />
          </div>

          <button
            onClick={handleCreateNewCustomer}
            disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Create & Continue
          </button>
        </div>
      )}
    </div>
  );
}