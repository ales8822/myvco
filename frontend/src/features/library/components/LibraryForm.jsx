// LibraryForm.jsx
import React from 'react';
import { Save, X } from "lucide-react";

export default function LibraryForm({
    currentItem,
    formData,
    setFormData,
    handleSubmit,
    setIsEditing
}) {
    return (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentItem ? "Edit Module" : "New Module"}
                </h2>
                <button
                    onClick={() => setIsEditing(false)}
                    className="text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Module Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            placeholder="e.g. Python Coding Manifesto"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Slug (Unique Tag)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">@</span>
                            <input
                                type="text"
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-8 pr-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="coding_manifesto"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Category
                        </label>
                        <div className="flex gap-6 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="category"
                                    value="manifesto"
                                    checked={formData.category === 'manifesto'}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500 focus:ring-offset-gray-800"
                                />
                                <span className={`text-sm font-medium transition-colors ${formData.category === 'manifesto' ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                    Manifesto
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="category"
                                    value="knowledge"
                                    checked={formData.category === 'knowledge'}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500 focus:ring-offset-gray-800"
                                />
                                <span className={`text-sm font-medium transition-colors ${formData.category === 'knowledge' ? 'text-amber-400' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                    Knowledge Base
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Description (Internal)
                    </label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Short description of what this module does..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Content (The Prompt/Knowledge)
                    </label>
                    <textarea
                        required
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full h-96 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Paste the full manifesto, rulebook, or knowledge base here..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save Module
                    </button>
                </div>
            </form>
        </div>
    );
}
