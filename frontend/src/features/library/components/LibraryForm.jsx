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
        <div className="flex-1 overflow-y-auto bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                    {currentItem ? "Edit Module" : "New Module"}
                </h2>
                <button
                    onClick={() => setIsEditing(false)}
                    className="text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                placeholder="coding_manifesto"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Use this tag in staff expertise/personality to inject content.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Description (Internal)
                    </label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Short description of what this module does..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Content (The Prompt/Knowledge)
                    </label>
                    <textarea
                        required
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full h-96 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                        placeholder="Paste the full manifesto, rulebook, or knowledge base here..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
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
