import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';

export default function ArchivedCompanies() {
    const navigate = useNavigate();
    const { archivedCompanies, fetchArchivedCompanies, deleteCompany, archiveCompany, loading } = useCompanyStore();

    useEffect(() => {
        fetchArchivedCompanies();
    }, []);

    const handleUnarchive = async (e, companyId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to unarchive this company?')) {
            await archiveCompany(companyId);
        }
    };

    const handleDelete = async (e, companyId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to PERMANENTLY delete this company? This action cannot be undone.')) {
            await deleteCompany(companyId);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <div className="container mx-auto px-4 py-16 relative">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/settings')}
                    className="absolute top-6 left-6 text-gray-500 hover:text-primary-600 flex items-center gap-2 transition-colors bg-white/50 px-3 py-2 rounded-lg hover:bg-white shadow-sm"
                >
                    <span className="text-xl">←</span>
                    <span className="text-sm font-medium">Back to Settings</span>
                </button>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Archived Companies
                    </h1>
                    <p className="text-xl text-gray-600">
                        Manage your archived virtual companies
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : archivedCompanies.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-600 mb-4">
                                No archived companies found.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {archivedCompanies.map((company) => (
                                <div
                                    key={company.id}
                                    className="card hover:shadow-lg transition-shadow group relative"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={(e) => handleUnarchive(e, company.id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Unarchive Company"
                                        >
                                            ↩️
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, company.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete Permanently"
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-lg mb-4">
                                        <span className="text-2xl font-bold text-gray-500">
                                            {company.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {company.name}
                                    </h3>
                                    {company.industry && (
                                        <p className="text-sm text-gray-500 mb-2">
                                            {company.industry}
                                        </p>
                                    )}
                                    <p className="text-gray-500 text-sm line-clamp-2">
                                        {company.description || 'No description'}
                                    </p>
                                    <div className="mt-4 inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                        Archived
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
