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
                <div key={member.id} className={`card group relative ${showFiredStaff ? 'border-red-100 bg-red-50' : ''}`}>
                    {!showFiredStaff && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEditStaff(member); }}
                                className="p-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded shadow-sm border border-gray-200"
                                title="Edit Staff"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleFireStaff(member.id); }}
                                className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded shadow-sm border border-gray-200"
                                title="Fire Staff"
                            >
                                🔥
                            </button>
                        </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                                {member.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        {showFiredStaff && (
                            <button
                                onClick={() => handleRestoreStaff(member.id)}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                            >
                                Restore
                            </button>
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-primary-600 font-medium mb-1">{member.role}</p>
                    {member.department_name && (
                        <p className="text-sm text-gray-500 mb-3">📂 {member.department_name}</p>
                    )}
                    {member.personality && (
                        <p className="text-sm text-gray-600 mb-3">{member.personality}</p>
                    )}
                    {member.system_prompt && (
                        <p className="text-xs text-gray-400 mb-2 italic truncate">Instr: {member.system_prompt}</p>
                    )}
                    {member.expertise && member.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {member.expertise.map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{skill}</span>
                            ))}
                        </div>
                    )}
                    {showFiredStaff && (
                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-red-200">Fired: {new Date(member.fired_at).toLocaleDateString()}</p>
                    )}
                </div>
            ))}
        </div>
    );
}
