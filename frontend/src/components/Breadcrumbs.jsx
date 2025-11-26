// frontend\src\components\Breadcrumbs.jsx
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
    return (
        <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                {/* Home Link */}
                <li className="inline-flex items-center">
                    <Link
                        to="/"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600"
                    >
                        <span className="mr-1">🏠</span> Companies
                    </Link>
                </li>

                {items.map((item, index) => (
                    <li key={index}>
                        <div className="flex items-center">
                            <span className="mx-2 text-gray-400 text-sm">/</span>
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className="text-sm font-medium text-gray-500 hover:text-primary-600"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-sm font-medium text-gray-900">
                                    {item.label}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
