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
                        <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">Departments</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{departments.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl flex items-center justify-center border border-secondary-100 dark:border-secondary-900/30">
                        <span className="text-2xl">📂</span>
                    </div>
                </div>
            </div>

            <div 
                className="card cursor-pointer hover:shadow-lg hover:border-red-200 dark:hover:border-red-900/30 transition-all" 
                onClick={() => setShowFiredStaff(!showFiredStaff)}
            >
                <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">Fired Staff</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{firedStaff?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center border border-red-100 dark:border-red-900/30">
                        <span className="text-2xl">🚫</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">Active Meetings</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {activeMeetings.length}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center border border-primary-100 dark:border-primary-900/30">
                        <span className="text-2xl">💬</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-1">Total Meetings</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {meetings.length}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center border border-green-100 dark:border-green-900/30">
                        <span className="text-2xl">📊</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
