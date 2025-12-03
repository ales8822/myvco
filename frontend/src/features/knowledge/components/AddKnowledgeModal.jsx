// AddKnowledgeModal.jsx
import React, { useState, useRef } from 'react';

export default function AddKnowledgeModal({ showAddModal, setShowAddModal, handleAddKnowledge }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [source, setSource] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('source', source);

        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        const success = await handleAddKnowledge(formData);

        if (success) {
            setShowAddModal(false);
            // Reset Form
            setTitle('');
            setContent('');
            setSource('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (!showAddModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Add Knowledge Entry
                </h2>
                <form onSubmit={handleSubmit}>
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
    );
}
