// LibraryHeader.jsx
import React from 'react';
import { Plus, Book, ArrowLeft } from "lucide-react";

export default function LibraryHeader({ navigate, handleCreate, isEditing }) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                    title="Go Back"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Book className="w-6 h-6 text-purple-400" />
                        Prototype Library
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Manage reusable knowledge modules for your AI staff.
                    </p>
                </div>
            </div>
            {!isEditing && (
                <button
                    onClick={handleCreate}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Module
                </button>
            )}
        </div>
    );
}
