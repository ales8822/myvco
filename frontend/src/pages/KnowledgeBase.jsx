// frontend\src\pages\KnowledgeBase.jsx
import { useEffect, useState } from 'react';
import { useCompanyStore } from '../stores/companyStore';
import { knowledgeApi } from '../lib/api';
import Sidebar from '../components/Sidebar';

export default function KnowledgeBase() {
    const { currentCompany } = useCompanyStore();
    const [knowledge, setKnowledge] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        source: '',
    });

    useEffect(() => {
        if (currentCompany) {
            fetchKnowledge();
        }
    }, [currentCompany]);

    const fetchKnowledge = async () => {
        setLoading(true);
        try {
            const response = await knowledgeApi.list(currentCompany.id);
            setKnowledge(response.data);
        } catch (error) {
            console.error('Error fetching knowledge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddKnowledge = async (e) => {
        e.preventDefault();
        try {
            await knowledgeApi.create(currentCompany.id, formData);
            setShowAddModal(false);
            setFormData({ title: '', content: '', source: '' });
            fetchKnowledge();
        } catch (error) {
            console.error('Error adding knowledge:', error);
        }
    };

    const handleDeleteKnowledge = async (id) => {
        if (confirm('Are you sure you want to delete this knowledge entry?')) {
            try {
                await knowledgeApi.delete(id);
                fetchKnowledge();
            } catch (error) {
                console.error('Error deleting knowledge:', error);
            }
        }
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Knowledge Base
                            </h1>
                            <p className="text-gray-600">
                                Company knowledge that AI staff can reference
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                        >
                            + Add Knowledge
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : knowledge.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-600 mb-4">
                                No knowledge entries yet. Add your first entry!
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-primary"
                            >
                                Add Knowledge
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {knowledge.map((entry) => (
                                <div key={entry.id} className="card">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {entry.title}
                                        </h3>
                                        <button
                                            onClick={() => handleDeleteKnowledge(entry.id)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                                        {entry.content}
                                    </p>
                                    {entry.source && (
                                        <p className="text-sm text-gray-500">
                                            Source: {entry.source}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                        Added {new Date(entry.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Knowledge Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-2xl w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Add Knowledge Entry
                        </h2>
                        <form onSubmit={handleAddKnowledge}>
                            <div className="mb-4">
                                <label className="label">Title *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Content *</label>
                                <textarea
                                    className="input"
                                    rows="8"
                                    value={formData.content}
                                    onChange={(e) =>
                                        setFormData({ ...formData, content: e.target.value })
                                    }
                                    placeholder="Enter the knowledge content..."
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="label">Source</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.source}
                                    onChange={(e) =>
                                        setFormData({ ...formData, source: e.target.value })
                                    }
                                    placeholder="e.g., URL, document name, or 'manual'"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">
                                    Add Knowledge
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

