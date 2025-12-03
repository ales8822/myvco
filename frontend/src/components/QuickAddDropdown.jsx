// QuickAddDropdown.jsx
import React from 'react';
import { BookOpen, X } from 'lucide-react';

export default function QuickAddDropdown({ onSelect }) {
    return (
        <div className="absolute right-0 top-8 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            <div className="p-2 text-xs font-semibold text-gray-500 border-b border-gray-100 flex justify-between items-center">
                <span>Quick Add Module</span>
                <button
                    onClick={() => onSelect(null)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
            {/* Content will be provided by parent via libraryItems prop or similar */}
        </div>
    );
}
