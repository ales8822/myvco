// QuickAddDropdown.jsx
import React from 'react';
import { BookOpen, X } from 'lucide-react';

export default function QuickAddDropdown({ onSelect, libraryItems = [] }) {
    return (
        <div className="absolute right-0 top-8 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            <div className="p-2 text-xs font-semibold text-gray-500 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <span>Quick Add Library Module</span>
                <button
                    onClick={() => onSelect(null)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
            <div className="p-1">
                {libraryItems.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400 italic">
                        No modules found in Library
                    </div>
                ) : (
                    libraryItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item.slug)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded transition-colors flex flex-col"
                        >
                            <span className="font-medium">@{item.slug}</span>
                            <span className="text-xs text-gray-500 truncate">{item.name}</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
