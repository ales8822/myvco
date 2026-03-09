// StaffHeader.jsx
import React from 'react';

export default function StaffHeader({ showFiredStaff, setShowFiredStaff, setShowHireModal }) {
    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Staff Management</h1>
                <p className="text-gray-600 dark:text-neutral-400">Manage your AI-powered team members</p>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => setShowHireModal(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Hire from Pool
                </button>
                <button
                    onClick={() => setShowFiredStaff(!showFiredStaff)}
                    className={`px-4 py-2 rounded-lg transition-colors ${showFiredStaff ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'}`}
                >
                    {showFiredStaff ? 'View Active Staff' : 'View Fired Staff'}
                </button>
            </div>
        </div>
    );
}
