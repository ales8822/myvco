import { useEffect, useState, useRef } from 'react';
import { useCompanyStore } from '../stores/companyStore';
import { knowledgeApi } from '../lib/api';
import Sidebar from '../components/Sidebar';

export default function KnowledgeBase() {
    const { currentCompany } = useCompanyStore();
    const [knowledge, setKnowledge] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [source, setSource] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

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

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('source', source);

        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        try {
            await knowledgeApi.create(currentCompany.id, formData);
            setShowAddModal(false);

            // Reset Form
            setTitle('');
            setContent('');
            setSource('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            fetchKnowledge();
        } catch (error) {
            console.error('Error adding knowledge:', error);
            alert("Failed to add knowledge. Please check the logs.");
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
                                    <p className="text-gray-700 mb-3 whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-100 p-3 rounded bg-gray-50">
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
                    <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Add Knowledge Entry
                        </h2>
                        <form onSubmit={handleAddKnowledge}>
                            <div className="mb-4">
                                <label className="label">Title *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-4 p-4 border border-blue-100 bg-blue-50 rounded-lg">
                                <label className="label text-blue-800 mb-2">Option 1: Upload PDF File</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    ref={fileInputRef}
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-600 file:text-white
                                        hover:file:bg-blue-700"
                                />
                                <p className="text-xs text-gray-500 mt-1">Text will be extracted automatically.</p>
                            </div>

                            <div className="mb-4">
                                <label className="label">Option 2: Manual Content</label>
                                <textarea
                                    className="input"
                                    rows="6"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Or type/paste content here directly..."
                                    // Make required only if no file selected
                                    required={!selectedFile}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="label">Source (Optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="e.g., URL, Manual V1.0"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">
                                    {selectedFile ? 'Upload & Add' : 'Add Knowledge'}
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