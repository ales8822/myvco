// StaffHeader.jsx
import React from 'react';

export default function StaffHeader({ showFiredStaff, setShowFiredStaff }) {
    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
                <p className="text-gray-600">Manage your AI-powered team members</p>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => setShowFiredStaff(!showFiredStaff)}
                    className={`px-4 py-2 rounded-lg transition-colors ${showFiredStaff ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    {showFiredStaff ? 'View Active Staff' : 'View Fired Staff'}
                </button>
            </div>
        </div>
    );
}
