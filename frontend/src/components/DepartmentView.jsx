// frontend\src\components\DepartmentView.jsx
import { useState } from 'react';
import { useDepartmentStore } from '../stores/departmentStore';
import { useStaffStore } from '../stores/staffStore';
import { departmentsApi } from '../lib/api';

export default function DepartmentView({ companyId, onDepartmentClick }) {
    const { departments, createDepartment, updateDepartment, deleteDepartment } = useDepartmentStore();
    const [showModal, setShowModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [departmentForm, setDepartmentForm] = useState({ name: '', description: '' });
    const [departmentStaffCounts, setDepartmentStaffCounts] = useState({});

    // Load staff counts for each department
    const loadStaffCounts = async () => {
        const counts = {};
        for (const dept of departments) {
            try {
                const response = await departmentsApi.getStaff(dept.id);
                counts[dept.id] = response.data.length;
            } catch (error) {
                counts[dept.id] = 0;
            }
        }
        setDepartmentStaffCounts(counts);
    };

    useState(() => {
        if (departments.length > 0) {
            loadStaffCounts();
        }
    }, [departments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDepartment) {
                await updateDepartment(editingDepartment.id, departmentForm);
            } else {
                await createDepartment(companyId, departmentForm);
            }
            setShowModal(false);
            setDepartmentForm({ name: '', description: '' });
            setEditingDepartment(null);
            loadStaffCounts();
        } catch (error) {
            console.error('Error saving department:', error);
            alert(error.response?.data?.detail || 'Failed to save department');
        }
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setDepartmentForm({ name: department.name, description: department.description || '' });
        setShowModal(true);
    };

    const handleDelete = async (departmentId) => {
        if (window.confirm('Are you sure you want to delete this department? This will fail if there are staff members assigned.')) {
            try {
                await deleteDepartment(departmentId);
                loadStaffCounts();
            } catch (error) {
                console.error('Error deleting department:', error);
                alert(error.response?.data?.detail || 'Failed to delete department');
            }
        }
    };

    const handleAddNew = () => {
        setEditingDepartment(null);
        setDepartmentForm({ name: '', description: '' });
        setShowModal(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
                <button onClick={handleAddNew} className="btn-primary">
                    ➕ Add Department
                </button>
            </div>

            {departments.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-500 mb-4">No departments yet</p>
                    <button onClick={handleAddNew} className="btn-primary">
                        Create First Department
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((department) => (
                        <div
                            key={department.id}
                            className="card hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => onDepartmentClick && onDepartmentClick(department)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {department.name}
                                    </h3>
                                    {department.description && (
                                        <p className="text-sm text-gray-600 mb-3">{department.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(department);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(department.id);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-2xl">👥</span>
                                <span className="text-lg font-medium">
                                    {departmentStaffCounts[department.id] || 0} Staff
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Department Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {editingDepartment ? 'Edit Department' : 'Add Department'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="label">Department Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={departmentForm.name}
                                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="label">Description</label>
                                <textarea
                                    className="input"
                                    rows="3"
                                    value={departmentForm.description}
                                    onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">
                                    {editingDepartment ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingDepartment(null);
                                        setDepartmentForm({ name: '', description: '' });
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
