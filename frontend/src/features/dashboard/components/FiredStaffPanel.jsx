export default function FiredStaffPanel({ firedStaff, handleFiredStaffClick, handleRestoreClick }) {
    return (
        <div className="card mb-8 bg-red-50 border-red-100">
            <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                <span>🚫</span> Fired Staff Archive
            </h2>
            {firedStaff?.length === 0 ? (
                <p className="text-gray-500">No fired staff in the archive.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {firedStaff?.map((member) => (
                        <div
                            key={member.id}
                            className="bg-white p-4 rounded-lg border border-red-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => handleFiredStaffClick(member)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRestoreClick(member); }}
                                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                >
                                    Restore
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{member.role}</p>
                            <p className="text-xs text-gray-500">
                                Fired: {new Date(member.fired_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
