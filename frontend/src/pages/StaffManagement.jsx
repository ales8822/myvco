// frontend\src\pages\StaffManagement.jsx
import { useEffect, useState } from 'react';
import { useCompanyStore } from '../stores/companyStore';
import { useStaffStore } from '../stores/staffStore';
import { useDepartmentStore } from '../stores/departmentStore';
import Sidebar from '../components/Sidebar';

export default function StaffManagement() {
    const { currentCompany } = useCompanyStore();
    const { staff, fetchStaff, hireStaff, removeStaff, firedStaff, fetchFiredStaff, updateStaff, restoreStaff } = useStaffStore();
    const { departments, fetchDepartments } = useDepartmentStore();
    const [showHireModal, setShowHireModal] = useState(false);
    const [showFiredStaff, setShowFiredStaff] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        department_id: '',
    });
    const [editForm, setEditForm] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        department_id: '',
    });

    useEffect(() => {
        if (currentCompany) {
            fetchStaff(currentCompany.id);
            fetchFiredStaff(currentCompany.id);
            fetchDepartments(currentCompany.id);
        }
    }, [currentCompany]);

    const handleHireStaff = async (e) => {
        e.preventDefault();
        try {
            const staffData = {
                ...formData,
                expertise: formData.expertise.split(',').map((e) => e.trim()),
            };
            await hireStaff(currentCompany.id, staffData);
            setShowHireModal(false);
            setFormData({
                name: '',
                role: '',
                personality: '',
                expertise: '',
                department_id: '',
            });
        } catch (error) {
            console.error('Error hiring staff:', error);
        }
    };

    const handleEditStaff = (member) => {
        setEditingStaff(member);
        setEditForm({
            name: member.name,
            role: member.role,
            personality: member.personality || '',
            expertise: Array.isArray(member.expertise) ? member.expertise.join(', ') : (member.expertise || ''),
            department_id: member.department_id || '',
        });
        setShowEditModal(true);
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        try {
            const updatedData = {
                ...editForm,
                expertise: editForm.expertise.split(',').map(s => s.trim()).filter(Boolean),
                department_id: editForm.department_id ? parseInt(editForm.department_id) : null,
            };
            await updateStaff(editingStaff.id, updatedData);
            setShowEditModal(false);
            setEditingStaff(null);
        } catch (error) {
            console.error('Error updating staff:', error);
        }
    };

    const handleFireStaff = async (staffId) => {
        if (window.confirm('Are you sure you want to fire this staff member? They will be moved to the archive.')) {
            await removeStaff(staffId);
        }
    };

    const handleRestoreStaff = async (staffId) => {
        if (window.confirm('Are you sure you want to restore this staff member?')) {
            await restoreStaff(staffId);
        }
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Staff Management
                            </h1>
                            <p className="text-gray-600">
                                Manage your AI-powered team members
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowFiredStaff(!showFiredStaff)}
                                className={`px-4 py-2 rounded-lg transition-colors ${showFiredStaff ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {showFiredStaff ? 'View Active Staff' : 'View Fired Staff'}
                            </button>
                            <button
                                onClick={() => setShowHireModal(true)}
                                className="btn-primary"
                            >
                                + Hire New Staff
                            </button>
                        </div>
                    </div>

                    {(showFiredStaff ? firedStaff : staff).length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-600 mb-4">
                                {showFiredStaff ? 'No fired staff in the archive.' : 'No staff members yet. Hire your first AI team member!'}
                            </p>
                            {!showFiredStaff && (
                                <button
                                    onClick={() => setShowHireModal(true)}
                                    className="btn-primary"
                                >
                                    Hire Staff
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(showFiredStaff ? firedStaff : staff).map((member) => (
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
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-primary-600 font-medium mb-1">
                                        {member.role}
                                    </p>
                                    {member.department_name && (
                                        <p className="text-sm text-gray-500 mb-3">
                                            📂 {member.department_name}
                                        </p>
                                    )}
                                    {member.personality && (
                                        <p className="text-sm text-gray-600 mb-3">
                                            {member.personality}
                                        </p>
                                    )}
                                    {member.expertise && member.expertise.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {member.expertise.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {showFiredStaff && (
                                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-red-200">
                                            Fired: {new Date(member.fired_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Hire Staff Modal */}
            {showHireModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full my-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Hire New Staff Member
                        </h2>
                        <form onSubmit={handleHireStaff}>
                            <div className="mb-4">
                                <label className="label">Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Role *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({ ...formData, role: e.target.value })
                                    }
                                    placeholder="e.g., CEO, Developer, Designer"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Personality</label>
                                <textarea
                                    className="input"
                                    rows="2"
                                    value={formData.personality}
                                    onChange={(e) =>
                                        setFormData({ ...formData, personality: e.target.value })
                                    }
                                    placeholder="Describe their personality traits"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Expertise (comma-separated)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.expertise}
                                    onChange={(e) =>
                                        setFormData({ ...formData, expertise: e.target.value })
                                    }
                                    placeholder="e.g., Python, React, Marketing"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="label">Department</label>
                                <select
                                    className="input"
                                    value={formData.department_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, department_id: e.target.value ? parseInt(e.target.value) : '' })
                                    }
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
                                <button type="submit" className="btn-primary flex-1">
                                    Hire Staff
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowHireModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full my-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Staff Member</h2>
                        <form onSubmit={handleUpdateStaff}>
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
                            <div className="mb-4">
                                <label className="label">Personality</label>
                                <textarea
                                    className="input"
                                    rows="2"
                                    value={editForm.personality}
                                    onChange={(e) => setEditForm({ ...editForm, personality: e.target.value })}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="label">Expertise (comma-separated)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editForm.expertise}
                                    onChange={(e) => setEditForm({ ...editForm, expertise: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">Update</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingStaff(null);
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
