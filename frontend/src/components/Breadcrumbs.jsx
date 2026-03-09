// 2. Modified frontend/src/components/Breadcrumbs.jsx
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
    return (
        <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                    {/* 2.1 Updated text-neutral-400 */}
                    <Link
                        to="/"
                        className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-neutral-400 hover:text-primary-600 transition-colors"
                    >
                        <span className="mr-1">🏠</span> Companies
                    </Link>
                </li>

                {items.map((item, index) => (
                    <li key={index}>
                        <div className="flex items-center">
                            {/* 2.2 Updated separator text-neutral-600 */}
                            <span className="mx-2 text-gray-400 dark:text-neutral-600 text-sm">/</span>
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className="text-sm font-medium text-gray-500 dark:text-neutral-400 hover:text-primary-600 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                // 2.3 Updated active item text-white
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
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