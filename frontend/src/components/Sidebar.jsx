// 1. Modified frontend/src/components/Sidebar.jsx
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
        // 1.1 Updated bg-white dark:bg-neutral-900 and border-neutral-800
        <div className="w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 h-screen fixed left-0 top-0 transition-colors duration-200">
            
            {/* 1.2 Updated border-neutral-800 */}
            <div className="p-6 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-primary-600">MyVCO</h1>
                    {(currentCompany && !isAgentFactory) && (
                        <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">{currentCompany.name}</p>
                    )}
                </div>
                
                {/* 1.3 Updated hover:bg-neutral-800 */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            <nav className="p-4">
                {(currentCompany && !isAgentFactory) && (
                    <>
                        {/* 1.4 Updated hover:bg-neutral-800 and dark text colors */}
                        <Link
                            to="/dashboard"
                            className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-medium mb-2 transition-colors"
                        >
                            📊 Dashboard
                        </Link>
                        <Link
                            to="/staff"
                            className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-medium mb-2 transition-colors"
                        >
                            👥 Company Staff
                        </Link>
                    </>
                )}
                <Link
                    to="/agent-factory"
                    className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-medium mb-2 transition-colors"
                >
                    🏭 Agent Factory
                </Link>
                <Link
                    to="/"
                    className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 font-medium mt-8 transition-colors"
                >
                    ← Back to Companies
                </Link>
            </nav>
        </div>
    );
}