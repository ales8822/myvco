import { useEffect, useState } from 'react';
import { useCompanyStore } from '../stores/companyStore';
import { useStaffStore } from '../stores/staffStore';
import Sidebar from '../components/Sidebar';

export default function StaffManagement() {
    const { currentCompany } = useCompanyStore();
    const { staff, fetchStaff, hireStaff, removeStaff } = useStaffStore();
    const [showHireModal, setShowHireModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
    });

    useEffect(() => {
        if (currentCompany) {
            fetchStaff(currentCompany.id);
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
            });
        } catch (error) {
            console.error('Error hiring staff:', error);
        }
    };

    const handleRemoveStaff = async (staffId) => {
        if (confirm('Are you sure you want to remove this staff member?')) {
            await removeStaff(staffId);
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
                        <button
                            onClick={() => setShowHireModal(true)}
                            className="btn-primary"
                        >
                            + Hire New Staff
                        </button>
                    </div>

                    {staff.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-600 mb-4">
                                No staff members yet. Hire your first AI team member!
                            </p>
                            <button
                                onClick={() => setShowHireModal(true)}
                                className="btn-primary"
                            >
                                Hire Staff
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {staff.map((member) => (
                                <div key={member.id} className="card">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStaff(member.id)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-primary-600 font-medium mb-3">
                                        {member.role}
                                    </p>
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
                            <div className="mb-6">
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
        </div>
    );
}