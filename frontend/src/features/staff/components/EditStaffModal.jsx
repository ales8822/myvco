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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-8 max-w-md w-full my-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Staff Member</h2>
                <form onSubmit={handleUpdate}>
                    <div className="mb-4">
                        <label className="label">Name</label>
                        <input
                            type="text"
                            className="input"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="label">Role</label>
                        <input
                            type="text"
                            className="input"
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            required
                        />
                    </div>
                    {/* System Prompt */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Personal Instructions</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'system_prompt' ? null : 'system_prompt')}
                                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'system_prompt' && (
                            <QuickAddDropdown onSelect={(tag) => insertTag(tag, 'system_prompt', true)} />
                        )}
                        <textarea
                            className="input"
                            rows="3"
                            value={editForm.system_prompt}
                            onChange={(e) => handleInputChange('system_prompt', e.target.value, true)}
                            placeholder="Specific rules, manifestos, or behavioral instructions"
                        />
                    </div>
                    {/* Personality */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Personality</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'personality' ? null : 'personality')}
                                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'personality' && (
                            <QuickAddDropdown onSelect={(tag) => insertTag(tag, 'personality', true)} />
                        )}
                        <textarea
                            className="input"
                            rows="2"
                            value={editForm.personality}
                            onChange={(e) => handleInputChange('personality', e.target.value, true)}
                            placeholder="Describe personality traits"
                        />
                    </div>
                    {/* Expertise */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Expertise (comma-separated)</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'expertise' ? null : 'expertise')}
                                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'expertise' && (
                            <QuickAddDropdown onSelect={(tag) => insertTag(tag, 'expertise', true)} />
                        )}
                        <input
                            type="text"
                            className="input"
                            value={editForm.expertise}
                            onChange={(e) => handleInputChange('expertise', e.target.value, true)}
                            placeholder="e.g., Python, React, Marketing"
                        />
                    </div>
                    {/* Department */}
                    <div className="mb-4">
                        <label className="label">Department</label>
                        <select
                            className="input"
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
