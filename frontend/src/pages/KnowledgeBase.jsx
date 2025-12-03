import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useKnowledgeData } from '../features/knowledge/hooks/useKnowledgeData';
import { useKnowledgeActions } from '../features/knowledge/hooks/useKnowledgeActions';
import KnowledgeHeader from '../features/knowledge/components/KnowledgeHeader';
import KnowledgeList from '../features/knowledge/components/KnowledgeList';
import AddKnowledgeModal from '../features/knowledge/components/AddKnowledgeModal';

export default function KnowledgeBase() {
    const [showAddModal, setShowAddModal] = useState(false);

    // Hooks
    const { knowledge, loading, fetchKnowledge } = useKnowledgeData();
    const { addKnowledge, deleteKnowledge } = useKnowledgeActions(fetchKnowledge);

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <KnowledgeHeader setShowAddModal={setShowAddModal} />

                    <KnowledgeList
                        knowledge={knowledge}
                        loading={loading}
                        handleDeleteKnowledge={deleteKnowledge}
                        setShowAddModal={setShowAddModal}
                    />
                </div>
            </div>

            <AddKnowledgeModal
                showAddModal={showAddModal}
                setShowAddModal={setShowAddModal}
                handleAddKnowledge={addKnowledge}
            />
        </div>
    );
}