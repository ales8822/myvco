// frontend/src/pages/CompanySelector.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { useThemeStore } from '../stores/themeStore';
import { Sun, Moon } from 'lucide-react';

export default function CompanySelector() {
    const navigate = useNavigate();
    const { companies, fetchCompanies, selectCompany, createCompany, deleteCompany, archiveCompany, loading } =
        useCompanyStore();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const ThemeToggle = () => {
        const { theme, toggleTheme } = useThemeStore();
        return (
            <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
        );
    };
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

    const handleArchive = async (e, companyId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to archive this company?')) {
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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors">
            <div className="container mx-auto px-4 py-16 relative">

                {/* Global Actions (Settings, Library, Agent Factory, Theme Toggle) */}
                <div className="absolute top-6 right-6 flex gap-3">
                    <button
                        onClick={() => navigate('/agent-factory')}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                        title="Global Agent Factory"
                    >
                        <span className="text-xl">🤖</span>
                        <span className="text-sm font-medium">Agents</span>
                    </button>

                    <button
                        onClick={() => navigate('/library')}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                        title="Global Prototype Library"
                    >
                        <span className="text-xl">📚</span>
                        <span className="text-sm font-medium">Library</span>
                    </button>

                    <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                        title="Application Settings"
                    >
                        <span className="text-xl">⚙️</span>
                        <span className="text-sm font-medium">Settings</span>
                    </button>

                    <ThemeToggle />
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Welcome to <span className="text-primary-600">MyVCO</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Your Virtual Company with AI-Powered Staff
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
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
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
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
                                    className="card hover:shadow-lg transition-all cursor-pointer group relative"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => handleArchive(e, company.id)}
                                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                            title="Archive Company"
                                        >
                                            📥
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, company.id)}
                                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                            title="Delete Company"
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg mb-4 group-hover:scale-110 transition-transform shadow-inner">
                                        <span className="text-2xl font-bold text-white">
                                            {company.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        {company.name}
                                    </h3>
                                    {company.industry && (
                                        <p className="text-sm text-primary-600 dark:text-primary-400 mb-2">
                                            {company.industry}
                                        </p>
                                    )}
                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl border border-transparent dark:border-gray-700 transition-colors">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
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