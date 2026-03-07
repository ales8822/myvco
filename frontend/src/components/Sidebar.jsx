import { Link, useLocation } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';

export default function Sidebar() {
    const { currentCompany } = useCompanyStore();
    const location = useLocation();
    const isAgentFactory = location.pathname === '/agent-factory';

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-primary-600">MyVCO</h1>
                {(currentCompany && !isAgentFactory) && <p className="text-sm text-gray-600 mt-1">{currentCompany.name}</p>}
            </div>

            <nav className="p-4">
                {(currentCompany && !isAgentFactory) && (
                    <>
                        <Link
                            to="/dashboard"
                            className="block px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium mb-2"
                        >
                            📊 Dashboard
                        </Link>
                        <Link
                            to="/staff"
                            className="block px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium mb-2"
                        >
                            👥 Company Staff
                        </Link>
                    </>
                )}
                <Link
                    to="/agent-factory"
                    className="block px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium mb-2"
                >
                    🏭 Agent Factory
                </Link>
                <Link
                    to="/"
                    className="block px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium mt-8"
                >
                    ← Back to Companies
                </Link>
            </nav>
        </div>
    );
}