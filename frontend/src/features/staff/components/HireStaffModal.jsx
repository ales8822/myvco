// 1. Corrected frontend/src/features/staff/components/HireStaffModal.jsx
import React from 'react';
// 1.1 ADDED MISSING IMPORTS - This fixes the "UserCircle is not defined" error
import { 
    BookOpen, 
    UserCircle, 
    Briefcase, 
    GraduationCap, 
    Building2, 
    Sparkles,
    X
} from 'lucide-react';
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
    if (!showHireModal) return null;

    return (
        // 1.2 Wide-Body Backdrop and Container
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-5xl w-full my-8 shadow-2xl border border-transparent dark:border-neutral-800 transition-colors">
                
                {/* 1.3 Modal Header */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-neutral-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        <p className="text-sm text-gray-500 dark:text-neutral-500">Define identity, expertise, and behavioral parameters.</p>
                    </div>
                    <button 
                        onClick={() => setShowHireModal(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleHire} className="space-y-6">
                    {/* 1.4 Metadata Grid Section (2 Columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                        {/* Name Field */}
                        <div>
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                <UserCircle size={14} /> Full Name *
                            </label>
                            <input
                                type="text"
                                className="input h-11 border-gray-200 dark:border-neutral-800 focus:border-primary-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Role Field */}
                        <div>
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                <Briefcase size={14} /> Assigned Role *
                            </label>
                            <input
                                type="text"
                                className="input h-11 border-gray-200 dark:border-neutral-800 focus:border-primary-500"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                placeholder="e.g. Project Manager"
                                required
                            />
                        </div>

                        {/* Expertise Field */}
                        <div>
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                <GraduationCap size={14} /> Expertise / Skills
                            </label>
                            <input
                                type="text"
                                className="input h-11 border-gray-200 dark:border-neutral-800 focus:border-primary-500"
                                value={formData.expertise}
                                onChange={(e) => handleInputChange('expertise', e.target.value)}
                                placeholder="React, Python, Copywriting..."
                            />
                        </div>

                        {/* Department Field */}
                        <div>
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                <Building2 size={14} /> Department Assignment
                            </label>
                            <select
                                className="input h-11 border-gray-200 dark:border-neutral-800 focus:border-primary-500"
                                value={formData.department_id}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value ? parseInt(e.target.value) : '' })}
                            >
                                <option value="" className="dark:bg-neutral-900">No Department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id} className="dark:bg-neutral-900">{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Personality Field (Indigo Tint) */}
                    <div className="pt-4 border-t dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-2">
                            <label className="label text-[11px] uppercase tracking-widest font-bold text-secondary-600 dark:text-secondary-400 mb-0 flex items-center gap-2">
                                <Sparkles size={14} /> Personality Trait Description
                            </label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'personality' ? null : 'personality')}
                                className="text-[10px] uppercase font-bold text-secondary-600 dark:text-secondary-400 flex items-center gap-1 hover:opacity-70 transition-opacity"
                            >
                                <BookOpen size={12} /> From Library
                            </button>
                        </div>
                        <div className="relative">
                            {activeDropdown === 'personality' && (
                                <QuickAddDropdown 
                                    onSelect={(tag) => insertTag(tag, 'personality')} 
                                    libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                                />
                            )}
                            <textarea
                                className="input py-3 border-gray-200 dark:border-neutral-800 focus:border-primary-500"
                                rows="2"
                                value={formData.personality}
                                onChange={(e) => handleInputChange('personality', e.target.value)}
                                placeholder="Describe their conversational style..."
                            />
                        </div>
                    </div>

                    {/* 1.5 Textarea Interaction Wells (Full Width) */}
                    <div className="grid grid-cols-1 gap-8">
                        {/* System Instructions (Secondary - Indigo) */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="label text-[11px] uppercase tracking-widest font-bold text-secondary-600 dark:text-secondary-400 mb-0">System Instructions / Behavioral Prompts</label>
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
                                        onSelect={(tag) => insertTag(tag, 'system_prompt')} 
                                        libraryItems={libraryItems.filter(i => i.category === 'manifesto' || !i.category)} 
                                    />
                                )}
                                <textarea
                                    className="input font-mono text-[13px] leading-relaxed dark:bg-neutral-950 p-6 border-gray-200 dark:border-neutral-800"
                                    rows="8"
                                    value={formData.system_prompt}
                                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                                    placeholder="Enter complex behavioral logic or prompt instructions..."
                                />
                            </div>
                        </div>

                        {/* Knowledge Base (Primary - Teal) */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="label text-[11px] uppercase tracking-widest font-bold text-primary-600 dark:text-primary-400 mb-0">Domain Knowledge / Factual Context</label>
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
                                        onSelect={(tag) => insertTag(tag, 'knowledge_base')} 
                                        libraryItems={libraryItems.filter(i => i.category === 'knowledge')} 
                                    />
                                )}
                                <textarea
                                    className="input font-mono text-[13px] leading-relaxed dark:bg-neutral-950 p-6 border-primary-500/20"
                                    rows="8"
                                    value={formData.knowledge_base}
                                    onChange={(e) => handleInputChange('knowledge_base', e.target.value)}
                                    placeholder="Enter data context or technical knowledge here..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={() => {
                                setShowHireModal(false);
                                setActiveDropdown(null);
                            }}
                            className="btn-secondary px-8"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary px-16 shadow-lg shadow-primary-500/20"
                        >
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}