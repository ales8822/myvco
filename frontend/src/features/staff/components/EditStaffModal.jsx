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
    if (!showEditModal) return null;
    return (
        // 1.1 Updated Backdrop and Container (max-w-5xl)
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-5xl w-full my-8 shadow-2xl border border-transparent dark:border-neutral-800 transition-all duration-300">
                
                <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-neutral-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Staff Profile</h2>
                        <p className="text-sm text-gray-500 dark:text-neutral-500">Configure AI behavior, identity, and company knowledge.</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-8">
                    {/* 1.2 Top Grid: Metadata Section (2 Columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Name */}
                        <div>
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                <UserCircle size={14} /> Full Name
                            </label>
                            <input
                                type="text"
                                className="input h-11"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                <Briefcase size={14} /> Primary Role
                            </label>
                            <input
                                type="text"
                                className="input h-11"
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                required
                            />
                        </div>

                        {/* Expertise */}
                        <div>
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                <GraduationCap size={14} /> Expertise / Skills
                            </label>
                            <input
                                type="text"
                                className="input h-11"
                                value={editForm.expertise}
                                onChange={(e) => handleInputChange('expertise', e.target.value, true)}
                                placeholder="e.g. React, Python, UI Design"
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                <Building2 size={14} /> Department
                            </label>
                            <select
                                className="input h-11"
                                value={editForm.department_id}
                                onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                            >
                                <option value="">Global Staff (No Department)</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Personality (Mid-Width Section) */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-0">AI Personality & Tone</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'personality' ? null : 'personality')}
                                className="text-[10px] uppercase font-bold text-secondary-600 dark:text-secondary-400 flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                                <BookOpen size={12} /> From Library
                            </button>
                        </div>
                        <div className="relative">
                            {activeDropdown === 'personality' && (
                                <QuickAddDropdown 
                                    onSelect={(tag) => insertTag(tag, 'personality', true)} 
                                    libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                                />
                            )}
                            <textarea
                                className="input py-3"
                                rows="2"
                                value={editForm.personality}
                                onChange={(e) => handleInputChange('personality', e.target.value, true)}
                                placeholder="e.g. Precise, formal, and analytical with a focus on logic."
                            />
                        </div>
                    </div>

                    {/* 1.3 The Technical Wells: Instructions and Knowledge (Full Width) */}
                    <div className="grid grid-cols-1 gap-8 pt-4 border-t dark:border-neutral-800">
                        {/* System Prompt Area */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="label text-[11px] uppercase tracking-widest font-bold text-secondary-600 dark:text-secondary-400 mb-0">System Instructions / Manifestos</label>
                                <button
                                    type="button"
                                    onClick={() => setActiveDropdown(activeDropdown === 'system_prompt' ? null : 'system_prompt')}
                                    className="text-[10px] uppercase font-bold text-secondary-600 dark:text-secondary-400 flex items-center gap-1"
                                >
                                    <BookOpen size={12} /> Inject Module
                                </button>
                            </div>
                            <div className="relative">
                                {activeDropdown === 'system_prompt' && (
                                    <QuickAddDropdown 
                                        onSelect={(tag) => insertTag(tag, 'system_prompt', true)} 
                                        libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                                    />
                                )}
                                <textarea
                                    className="input font-mono text-[13px] leading-relaxed dark:bg-neutral-950 shadow-inner p-5"
                                    rows="8" // Tall expansion
                                    value={editForm.system_prompt}
                                    onChange={(e) => handleInputChange('system_prompt', e.target.value, true)}
                                    placeholder="Write behavioral logic or paste @manifesto tags here..."
                                />
                            </div>
                        </div>

                        {/* Knowledge Base Area */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-0">Domain Knowledge Base</label>
                                <button
                                    type="button"
                                    onClick={() => setActiveDropdown(activeDropdown === 'knowledge_base' ? null : 'knowledge_base')}
                                    className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1"
                                >
                                    <BookOpen size={12} /> Inject Knowledge
                                </button>
                            </div>
                            <div className="relative">
                                {activeDropdown === 'knowledge_base' && (
                                    <QuickAddDropdown 
                                        onSelect={(tag) => insertTag(tag, 'knowledge_base', true)} 
                                        libraryItems={libraryItems.filter(i => i.category === 'knowledge')} 
                                    />
                                )}
                                <textarea
                                    className="input font-mono text-[13px] leading-relaxed dark:bg-neutral-950 shadow-inner p-5 border-primary-500/20"
                                    rows="8" // Tall expansion
                                    value={editForm.knowledge_base}
                                    onChange={(e) => handleInputChange('knowledge_base', e.target.value, true)}
                                    placeholder="Facts, context, or data tags..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-4 pt-6">
                        <button
                            type="button"
                            onClick={() => { setShowEditModal(false); setActiveDropdown(null); }}
                            className="btn-secondary px-8"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary px-12 shadow-lg shadow-primary-500/20">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
