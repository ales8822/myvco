// StaffList.jsx
import React from 'react';
import { BookOpen } from 'lucide-react';
import QuickAddDropdown from '../../../components/QuickAddDropdown';

export default function StaffList({
    staff,
    showFiredStaff,
    handleEditStaff,
    handleFireStaff,
    handleRestoreStaff,
    activeDropdown,
    setActiveDropdown,
    insertTag,
    libraryItems,
    departments,
    editForm,
    setEditForm,
    formData,
    setFormData,
    handleInputChange,
    handleUpdateStaff,
    handleHireStaff,
    handleUpdateStaffSubmit,
    handleHireSubmit,
    setShowHireModal,
    setShowEditModal,
    setEditingStaff,
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showFiredStaff ? staff.firedStaff : staff).map((member) => (
                <div key={member.id} className={`card h-full flex flex-col group relative ${showFiredStaff ? 'border-red-100 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30' : ''}`}>
                    {!showFiredStaff && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEditStaff(member); }}
                                className="p-1.5 bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-600 rounded shadow-sm border border-gray-200 dark:border-neutral-600"
                                title="Edit Staff"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleFireStaff(member.id); }}
                                className="p-1.5 bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-neutral-600 rounded shadow-sm border border-gray-200 dark:border-neutral-600"
                                title="Fire Staff"
                            >
                                🔥
                            </button>
                        </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-inner">
                            <span className="text-2xl font-bold text-white">
                                {member.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        {showFiredStaff && (
                            <button
                                onClick={() => handleRestoreStaff(member.id)}
                                className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                            >
                                Restore
                            </button>
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{member.name}</h3>
                    <p className="text-primary-600 dark:text-primary-400 font-medium mb-1">{member.role}</p>
                    {member.department_name && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">📂 {member.department_name}</p>
                    )}
                    {member.personality && (
                        <p className="text-sm text-gray-600 dark:text-neutral-300 mb-3 line-clamp-2">{member.personality}</p>
                    )}
                    <div className="mt-auto">
                        {member.system_prompt && (
                            <p className="text-xs text-gray-400 dark:text-neutral-500 mb-2 italic truncate">Instr: {member.system_prompt}</p>
                        )}
                        {member.expertise && member.expertise.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {member.expertise.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 text-xs rounded border border-gray-200 dark:border-neutral-600">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                        {showFiredStaff && (
                            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2 pt-2 border-t border-red-200 dark:border-red-900/30">Fired: {new Date(member.fired_at).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
