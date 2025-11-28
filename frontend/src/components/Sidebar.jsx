import { Link } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';

export default function Sidebar() {
    const { currentCompany } = useCompanyStore();

    if (!currentCompany) return null;

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-primary-600">MyVCO</h1>
                <p className="text-sm text-gray-600 mt-1">{currentCompany.name}</p>
            </div>

            <nav className="p-4">
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
                    👥 Staff
                </Link>
                <Link
                    to="/knowledge"
                    className="block px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium mb-2"
                >
                    📚 Knowledge Base
                </Link>
                {/* <Link
                    to="/settings"
                    className="block px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 font-medium mb-2"
                >
                    ⚙️ Settings
                </Link> */}
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