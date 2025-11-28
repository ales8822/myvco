// frontend/src/pages/CompanySelector.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';

export default function CompanySelector() {
    const navigate = useNavigate();
    const { companies, fetchCompanies, selectCompany, createCompany, loading } =
        useCompanyStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        industry: '',
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleSelectCompany = async (companyId) => {
        await selectCompany(companyId);
        navigate('/dashboard');
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            await createCompany(formData);
            setShowCreateModal(false);
            setFormData({ name: '', description: '', industry: '' });
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating company:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <div className="container mx-auto px-4 py-16 relative">
                
                {/* Settings Button */}
                <button
                    onClick={() => navigate('/settings')}
                    className="absolute top-6 right-6 text-gray-500 hover:text-primary-600 flex items-center gap-2 transition-colors bg-white/50 px-3 py-2 rounded-lg hover:bg-white shadow-sm"
                    title="Application Settings"
                >
                    <span className="text-xl">⚙️</span>
                    <span className="text-sm font-medium">Settings</span>
                </button>

                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Welcome to <span className="text-primary-600">MyVCO</span>
                    </h1>
                    <p className="text-xl text-gray-600">
                        Your Virtual Company with AI-Powered Staff
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Select a Company
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary"
                        >
                            + Create New Company
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-600 mb-4">
                                No companies yet. Create your first virtual company!
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {companies.map((company) => (
                                <div
                                    key={company.id}
                                    onClick={() => handleSelectCompany(company.id)}
                                    className="card hover:shadow-lg transition-shadow cursor-pointer group"
                                >
                                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                                        <span className="text-2xl font-bold text-white">
                                            {company.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {company.name}
                                    </h3>
                                    {company.industry && (
                                        <p className="text-sm text-primary-600 mb-2">
                                            {company.industry}
                                        </p>
                                    )}
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                        {company.description || 'No description'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Company Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Create New Company
                        </h2>
                        <form onSubmit={handleCreateCompany}>
                            <div className="mb-4">
                                <label className="label">Company Name *</label>
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
                                <label className="label">Industry</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.industry}
                                    onChange={(e) =>
                                        setFormData({ ...formData, industry: e.target.value })
                                    }
                                    placeholder="e.g., Technology, Healthcare"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="label">Description</label>
                                <textarea
                                    className="input"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="What does your company do?"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">
                                    Create Company
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
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