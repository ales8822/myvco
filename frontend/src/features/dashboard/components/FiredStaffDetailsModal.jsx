export default function FiredStaffDetailsModal({
    showFiredDetailsModal,
    selectedFiredStaff,
    setShowFiredDetailsModal,
    handleRestoreClick
}) {
    if (!showFiredDetailsModal || !selectedFiredStaff) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-lg w-full">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedFiredStaff.name}</h2>
                    <button
                        onClick={() => setShowFiredDetailsModal(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Role</h3>
                        <p className="text-gray-900">{selectedFiredStaff.role}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Fired Date</h3>
                        <p className="text-gray-900">{new Date(selectedFiredStaff.fired_at).toLocaleString()}</p>
                    </div>

                    {selectedFiredStaff.fired_reason && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <h3 className="text-sm font-medium text-red-800 mb-1">Reason for Firing</h3>
                            <p className="text-red-900">{selectedFiredStaff.fired_reason}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Personality</h3>
                        <p className="text-gray-900">{selectedFiredStaff.personality || 'N/A'}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Expertise</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {selectedFiredStaff.expertise && selectedFiredStaff.expertise.length > 0 ? (
                                selectedFiredStaff.expertise.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">None listed</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => {
                            setShowFiredDetailsModal(false);
                            handleRestoreClick(selectedFiredStaff);
                        }}
                        className="btn-primary bg-green-600 hover:bg-green-700"
                    >
                        Restore Staff
                    </button>
                </div>
            </div>
        </div>
    );
}
