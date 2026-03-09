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
                <Search className="absolute left-3 top-2.5 text-gray-500 dark:text-neutral-500 w-5 h-5 transition-colors" />
                <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    // 1.2 Updated input to use Neutral scale and Indigo focus
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 transition-all shadow-sm"
                />
            </div>

            <div className="space-y-8 overflow-y-auto pb-6">
                {/* Manifesto Section */}
                <section>
                    <h2 className="text-xl font-bold mb-6 text-secondary-600 dark:text-secondary-400 border-b border-gray-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
                        Manifestos <span className="text-xs font-normal text-gray-500 dark:text-neutral-500 uppercase tracking-widest">(Behavioral)</span>
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
                    <h2 className="text-xl font-bold mb-6 text-primary-600 dark:text-primary-400 border-b border-gray-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
                        Knowledge Base <span className="text-xs font-normal text-gray-500 dark:text-neutral-500 uppercase tracking-widest">(Factual)</span>
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
    const isKnowledge = item.category === 'knowledge';
    return (
        <div className={`card h-full flex flex-col group transition-all duration-300 border 
            ${isKnowledge 
                ? 'hover:border-primary-500/40 hover:shadow-primary-500/5' 
                : 'hover:border-secondary-500/40 hover:shadow-secondary-500/5'
            }`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-wrap items-center gap-2">
                     <span className="bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-400 px-2 py-1 rounded text-xs font-mono font-bold border border-secondary-100 dark:border-secondary-900/30">
                        @{item.slug}
                    </span>
                     {isKnowledge && (
                        <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-tight border border-primary-100 dark:border-primary-900/30">
                            Knowledge
                        </span>
                    )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleEdit(item)}
 className="p-1.5 text-gray-400 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"                        title="Edit Module"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
 className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"                        title="Delete Module"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white leading-tight">{item.name}</h3>
            <p className="text-gray-600 dark:text-neutral-400 text-sm line-clamp-2 mb-6">
                {item.description || "No description provided."}
            </p>
            <div className="mt-auto text-[11px] text-gray-500 dark:text-neutral-500 font-mono bg-gray-50 dark:bg-neutral-950 p-3 rounded-lg border border-gray-100 dark:border-neutral-800 truncate transition-colors">
                <span className="opacity-60">{item.content.substring(0, 50)}...</span>
            </div>
        </div>
    );
}
