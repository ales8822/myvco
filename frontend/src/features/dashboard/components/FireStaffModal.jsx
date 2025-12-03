export default function FireStaffModal({
    showFireModal,
    setShowFireModal,
    staffToFire,
    setStaffToFire,
    fireReason,
    setFireReason,
    handleConfirmFire
}) {
    if (!showFireModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Fire Staff Member</h2>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to fire <span className="font-semibold">{staffToFire?.name}</span>?
                    They will be moved to the archive.
                </p>
                <form onSubmit={handleConfirmFire}>
                    <div className="mb-6">
                        <label className="label">Reason for Firing</label>
                        <textarea
                            className="input"
                            rows="3"
                            value={fireReason}
                            onChange={(e) => setFireReason(e.target.value)}
                            placeholder="Optional reason..."
                        />
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700 flex-1">Fire</button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowFireModal(false);
                                setStaffToFire(null);
                            }}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
