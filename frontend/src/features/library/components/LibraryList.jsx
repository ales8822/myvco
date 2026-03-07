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
                <Search className="absolute left-3 top-2.5 text-gray-500 w-5 h-5 transition-colors" />
                <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
            </div>

            <div className="space-y-8 overflow-y-auto pb-6">
                {/* Manifesto Section */}
                <section>
                    <h2 className="text-xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2 flex items-center gap-2">
                        Manifestos <span className="text-xs font-normal text-gray-500 uppercase tracking-widest">(Behavioral)</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.filter(i => i.category === 'manifesto' || !i.category).map((item) => (
                            <LibraryItemCard key={item.id} item={item} handleEdit={handleEdit} handleDelete={handleDelete} />
                        ))}
                        {filteredItems.filter(i => i.category === 'manifesto' || !i.category).length === 0 && (
                            <div className="col-span-full py-4 text-gray-500 text-sm">No manifestos found.</div>
                        )}
                    </div>
                </section>

                {/* Knowledge Base Section */}
                <section>
                    <h2 className="text-xl font-bold mb-4 text-amber-400 border-b border-gray-700 pb-2 flex items-center gap-2">
                        Knowledge Base <span className="text-xs font-normal text-gray-500 uppercase tracking-widest">(Factual)</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.filter(i => i.category === 'knowledge').map((item) => (
                            <LibraryItemCard key={item.id} item={item} handleEdit={handleEdit} handleDelete={handleDelete} />
                        ))}
                        {filteredItems.filter(i => i.category === 'knowledge').length === 0 && (
                            <div className="col-span-full py-4 text-gray-500 text-sm">No knowledge modules found.</div>
                        )}
                    </div>
                </section>

                {filteredItems.length === 0 && searchTerm && (
                    <div className="text-center py-12 text-gray-500">
                        No modules matching "{searchTerm}" found.
                    </div>
                )}
            </div>
        </>
    );
}

function LibraryItemCard({ item, handleEdit, handleDelete }) {
    return (
        <div className="card h-full flex flex-col group hover:border-purple-500/50 transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded text-xs font-mono font-bold">
                        @{item.slug}
                    </span>
                    {item.category === 'knowledge' && (
                        <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-tighter">
                            Knowledge
                        </span>
                    )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Edit Module"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Delete Module"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{item.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                {item.description || "No description provided."}
            </p>
            <div className="mt-auto text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800 truncate transition-colors">
                {item.content.substring(0, 50)}...
            </div>
        </div>
    );
}
