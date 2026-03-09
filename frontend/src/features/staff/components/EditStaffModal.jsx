// EditStaffModal.jsx
import React from 'react';
import { BookOpen } from 'lucide-react';
import QuickAddDropdown from '../../../components/QuickAddDropdown';

export default function EditStaffModal({
    showEditModal,
    setShowEditModal,
    editForm,
    setEditForm,
    handleUpdate,
    activeDropdown,
    setActiveDropdown,
    insertTag,
    libraryItems,
    departments,
    handleInputChange,
}) {
    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 max-w-md w-full my-8 shadow-2xl border border-transparent dark:border-neutral-800 transition-colors">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Staff Member</h2>
                <form onSubmit={handleUpdate}>
                    <div className="mb-4">
                        <label className="label mb-0 font-bold text-primary-600 dark:text-primary-400">Name</label>
                        <input
                            type="text"
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="label mb-0 font-bold text-primary-600 dark:text-primary-400">Role</label>
                        <input
                            type="text"
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            required
                        />
                    </div>
                    {/* System Prompt */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0 font-bold text-primary-600 dark:text-primary-400">Personal Instructions</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'system_prompt' ? null : 'system_prompt')}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 font-medium"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'system_prompt' && (
                            <QuickAddDropdown 
                                onSelect={(tag) => insertTag(tag, 'system_prompt', true)} 
                                libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                            />
                        )}
                        <textarea
                            className="input"
                            rows="3"
                            value={editForm.system_prompt}
                            onChange={(e) => handleInputChange('system_prompt', e.target.value, true)}
                            placeholder="Specific rules, manifestos, or behavioral instructions"
                        />
                    </div>
                    {/* Knowledge Base */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0 font-bold text-primary-600 dark:text-primary-400">Knowledge Base</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'knowledge_base' ? null : 'knowledge_base')}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 font-medium"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'knowledge_base' && (
                            <QuickAddDropdown 
                                onSelect={(tag) => insertTag(tag, 'knowledge_base', true)} 
                                libraryItems={libraryItems.filter(i => i.category === 'knowledge')} 
                            />
                        )}
                        <textarea
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            rows="3"
                            value={editForm.knowledge_base}
                            onChange={(e) => handleInputChange('knowledge_base', e.target.value, true)}
                            placeholder="Factual knowledge, documents, or data"
                        />
                    </div>
                    {/* Personality */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0 font-bold text-primary-600 dark:text-primary-400">Personality</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'personality' ? null : 'personality')}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 font-medium"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'personality' && (
                            <QuickAddDropdown 
                                onSelect={(tag) => insertTag(tag, 'personality', true)} 
                                libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                            />
                        )}
                        <textarea
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            rows="2"
                            value={editForm.personality}
                            onChange={(e) => handleInputChange('personality', e.target.value, true)}
                            placeholder="Describe personality traits"
                        />
                    </div>
                    {/* Expertise */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0 font-bold text-primary-600 dark:text-primary-400">Expertise (comma-separated)</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'expertise' ? null : 'expertise')}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 font-medium"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'expertise' && (
                            <QuickAddDropdown 
                                onSelect={(tag) => insertTag(tag, 'expertise', true)} 
                                libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                            />
                        )}
                        <input
                            type="text"
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            value={editForm.expertise}
                            onChange={(e) => handleInputChange('expertise', e.target.value, true)}
                            placeholder="e.g., Python, React, Marketing"
                        />
                    </div>
                    {/* Department */}
                    <div className="mb-4">
                        <label className="label font-bold text-primary-600 dark:text-primary-400">Department</label>
                        <select
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            value={editForm.department_id}
                            onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                        >
                            <option value="">No Department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" className="btn-primary flex-1">Update</button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setActiveDropdown(null);
                            }}
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
