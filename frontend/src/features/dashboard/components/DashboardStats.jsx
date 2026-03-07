export default function DashboardStats({
    departments,
    firedStaff,
    activeMeetings,
    meetings,
    setShowFiredStaff,
    showFiredStaff
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Departments</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{departments.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📂</span>
                    </div>
                </div>
            </div>

            <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowFiredStaff(!showFiredStaff)}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fired Staff</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{firedStaff?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🚫</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Meetings</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {activeMeetings.length}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">💬</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Meetings</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {meetings.length}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
