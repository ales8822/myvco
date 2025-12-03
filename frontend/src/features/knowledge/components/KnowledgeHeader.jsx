// KnowledgeHeader.jsx
import React from 'react';

export default function KnowledgeHeader({ setShowAddModal }) {
    return (
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
    );
}
