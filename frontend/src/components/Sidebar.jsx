import { Link, useLocation } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { useThemeStore } from '../stores/themeStore';
import { Sun, Moon } from 'lucide-react';

export default function Sidebar() {
    const { currentCompany } = useCompanyStore();
    const { theme, toggleTheme } = useThemeStore();
    const location = useLocation();
    const isAgentFactory = location.pathname === '/agent-factory';

    return (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 transition-colors duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-primary-600">MyVCO</h1>
                    {(currentCompany && !isAgentFactory) && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentCompany.name}</p>}
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            <nav className="p-4">
                {(currentCompany && !isAgentFactory) && (
                    <>
                        <Link
                            to="/dashboard"
                            className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors"
                        >
                            📊 Dashboard
                        </Link>
                        <Link
                            to="/staff"
                            className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors"
                        >
                            👥 Company Staff
                        </Link>
                    </>
                )}
                <Link
                    to="/agent-factory"
                    className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors"
                >
                    🏭 Agent Factory
                </Link>
                <Link
                    to="/"
                    className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium mt-8 transition-colors"
                >
                    ← Back to Companies
                </Link>
            </nav>
        </div>
    );
}