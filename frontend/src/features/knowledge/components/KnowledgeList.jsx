// KnowledgeList.jsx
import React from 'react';

export default function KnowledgeList({ knowledge, loading, handleDeleteKnowledge, setShowAddModal }) {
    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (knowledge.length === 0) {
        return (
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
        );
    }

    return (
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
    );
}
