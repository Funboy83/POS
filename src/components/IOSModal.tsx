'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface IOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function IOSModal({ isOpen, onClose, title, children }: IOSModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scroll when modal closes
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modern glass backdrop */}
      <div 
        className={`absolute inset-0 glass-effect transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div
        className={`relative w-full max-w-lg max-h-[90vh] bg-white overflow-hidden shadow-2xl rounded-3xl transition-all duration-500 ease-out ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onTransitionEnd={() => {
          if (!isOpen) setIsAnimating(false);
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
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Customer form component for the modal
export function CustomerForm({ onSubmit }: { onSubmit: (customer: { id: string; name: string; email: string; phone: string; loyaltyPoints: number }) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: Date.now().toString(),
      ...formData,
      loyaltyPoints: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-base font-bold text-slate-800 mb-3">
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-4 border-2 border-slate-200 rounded-2xl bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-all duration-300 focus:shadow-lg"
          placeholder="Enter customer name"
          required
        />
      </div>
      
      <div>
        <label className="block text-base font-bold text-slate-800 mb-3">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-4 border-2 border-slate-200 rounded-2xl bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-all duration-300 focus:shadow-lg"
          placeholder="Enter email address"
        />
      </div>
      
      <div>
        <label className="block text-base font-bold text-slate-800 mb-3">
          Phone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-4 border-2 border-slate-200 rounded-2xl bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none transition-all duration-300 focus:shadow-lg"
          placeholder="Enter phone number"
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-lg py-4 rounded-2xl transition-all duration-300 modern-button shadow-xl hover:shadow-2xl mt-8"
      >
        <div className="flex items-center justify-center gap-3">
          <span>👤</span>
          <span>Add Customer</span>
        </div>
      </button>
    </form>
  );
}