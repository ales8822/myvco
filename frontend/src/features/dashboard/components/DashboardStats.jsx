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
                        <p className="text-sm text-gray-600 mb-1">Departments</p>
                        <p className="text-3xl font-bold text-gray-900">{departments.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📂</span>
                    </div>
                </div>
            </div>

            <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowFiredStaff(!showFiredStaff)}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Fired Staff</p>
                        <p className="text-3xl font-bold text-gray-900">{firedStaff?.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🚫</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Active Meetings</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {activeMeetings.length}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">💬</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Total Meetings</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {meetings.length}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
