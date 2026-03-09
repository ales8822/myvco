// HireStaffModal.jsx
import React from 'react';
import { BookOpen } from 'lucide-react';
import QuickAddDropdown from '../../../components/QuickAddDropdown';

export default function HireStaffModal({
    showHireModal,
    setShowHireModal,
    formData,
    setFormData,
    handleHire,
    activeDropdown,
    setActiveDropdown,
    insertTag,
    libraryItems,
    departments,
    handleInputChange,
    title = "Hire New Staff Member",
    submitLabel = "Hire Staff"
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm transition-all">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 max-w-md w-full my-8 shadow-2xl border border-transparent dark:border-neutral-800 transition-colors">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{title}</h2>
                <form onSubmit={handleHire}>
                    <div className="mb-4">
                        <label className="label font-bold text-primary-600 dark:text-primary-400">Name *</label>
                        <input
                            type="text"
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="label font-bold text-primary-600 dark:text-primary-400">Role *</label>
                        <input
                            type="text"
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            placeholder="e.g., CEO, Developer, Designer"
                            required
                        />
                    </div>
                    {/* System Prompt */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Personal Instructions (System Prompt)</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'system_prompt' ? null : 'system_prompt')}
                                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'system_prompt' && (
                            <QuickAddDropdown 
                                onSelect={(tag) => insertTag(tag, 'system_prompt')} 
                                libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                            />
                        )}
                        <textarea
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            rows="3"
                            value={formData.system_prompt}
                            onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                            placeholder="Specific rules, manifestos, or behavioral instructions (e.g. @personality_manifesto)"
                        />
                    </div>
                    {/* Knowledge Base */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0 font-bold text-amber-600">Knowledge Base (Factual Context)</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'knowledge_base' ? null : 'knowledge_base')}
                                className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium flex items-center gap-1 transition-colors"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'knowledge_base' && (
                            <QuickAddDropdown 
                                onSelect={(tag) => insertTag(tag, 'knowledge_base')} 
                                libraryItems={libraryItems.filter(i => i.category === 'knowledge')} 
                            />
                        )}
                        <textarea
                            className="input border-amber-100 dark:border-amber-900/30 focus:border-amber-500 dark:focus:border-amber-500"
                            rows="3"
                            value={formData.knowledge_base}
                            onChange={(e) => handleInputChange('knowledge_base', e.target.value)}
                            placeholder="Factual knowledge, documents, or data (e.g. @product_specs)"
                        />
                    </div>
                    {/* Personality */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Personality</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'personality' ? null : 'personality')}
                                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'personality' && (
                            <QuickAddDropdown 
                                onSelect={(tag) => insertTag(tag, 'personality')} 
                                libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                            />
                        )}
                        <textarea
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            rows="2"
                            value={formData.personality}
                            onChange={(e) => handleInputChange('personality', e.target.value)}
                            placeholder="Describe their personality traits"
                        />
                    </div>
                    {/* Expertise */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Expertise (comma-separated)</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'expertise' ? null : 'expertise')}
                                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'expertise' && (
                            <QuickAddDropdown 
                                onSelect={(tag) => insertTag(tag, 'expertise')} 
                                libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                            />
                        )}
                        <input
                            type="text"
                            className="input border-primary-100 dark:border-primary-900/30 focus:border-primary-500"
                            value={formData.expertise}
                            onChange={(e) => handleInputChange('expertise', e.target.value)}
                            placeholder="e.g., Python, React, Marketing"
                        />
                    </div>
                    {/* Department */}
                    <div className="mb-6">
                        <label className="label text-gray-700 dark:text-gray-300">Department</label>
                        <select
                            className="input dark:bg-gray-700"
                            value={formData.department_id}
                            onChange={(e) => setFormData({ ...formData, department_id: e.target.value ? parseInt(e.target.value) : '' })}
                        >
                            <option value="" className="dark:bg-gray-800">No Department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id} className="dark:bg-gray-800">
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" className="btn-primary flex-1">{submitLabel}</button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowHireModal(false);
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
