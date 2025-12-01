import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added useNavigate
import { libraryApi } from "../lib/api";
import { Plus, Search, Trash2, Edit2, Save, X, Book, ArrowLeft } from "lucide-react"; // Added ArrowLeft

const PrototypeLibrary = () => {
    const navigate = useNavigate(); // Initialize navigation
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({
        slug: "",
        name: "",
        content: "",
        description: "",
        is_global: true,
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await libraryApi.list();
            setItems(response.data);
        } catch (error) {
            console.error("Error fetching library items:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setCurrentItem(null);
        setFormData({
            slug: "",
            name: "",
            content: "",
            description: "",
            is_global: true,
        });
        setIsEditing(true);
    };

    const handleEdit = (item) => {
        setCurrentItem(item);
        setFormData({
            slug: item.slug,
            name: item.name,
            content: item.content,
            description: item.description || "",
            is_global: item.is_global,
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this module?")) {
            try {
                await libraryApi.delete(id);
                fetchItems();
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentItem) {
                await libraryApi.update(currentItem.id, formData);
            } else {
                await libraryApi.create(formData);
            }
            setIsEditing(false);
            fetchItems();
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Error saving item. Ensure slug is unique.");
        }
    };

    const filteredItems = items.filter(
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-400">Loading library...</div>;

    return (
        <div className="h-full flex flex-col bg-gray-900 text-gray-100 p-6 overflow-hidden min-h-screen">
            {/* Added Header with Back Button */}
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

            {isEditing ? (
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
            ) : (
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
            )}
        </div>
    );
};

export default PrototypeLibrary;