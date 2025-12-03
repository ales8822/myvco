// LibraryList.jsx
import React from 'react';
import { Search, Trash2, Edit2 } from "lucide-react";

export default function LibraryList({
    items,
    loading,
    searchTerm,
    setSearchTerm,
    handleEdit,
    handleDelete
}) {
    const filteredItems = items.filter(
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-400">Loading library...</div>;

    return (
        <>
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-2.5 text-gray-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-6">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-purple-900/30 text-purple-400 px-2 py-1 rounded text-xs font-mono">
                                    @{item.slug}
                                </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                            {item.description || "No description provided."}
                        </p>
                        <div className="text-xs text-gray-500 font-mono bg-gray-900/50 p-2 rounded truncate">
                            {item.content.substring(0, 50)}...
                        </div>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No modules found. Create one to get started.
                    </div>
                )}
            </div>
        </>
    );
}
