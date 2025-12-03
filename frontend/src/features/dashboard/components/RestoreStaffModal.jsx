export default function RestoreStaffModal({
    showRestoreModal,
    setShowRestoreModal,
    handleConfirmRestore,
    restoreData,
    setRestoreData,
    departments,
    setStaffToRestore
}) {
    if (!showRestoreModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Restore Staff Member</h2>
                <form onSubmit={handleConfirmRestore}>
                    <div className="mb-4">
                        <label className="label">Department</label>
                        <select
                            className="input"
                            value={restoreData.department_id}
                            onChange={(e) => setRestoreData({ ...restoreData, department_id: e.target.value })}
                        >
                            <option value="">No Department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" className="btn-primary bg-green-600 hover:bg-green-700 flex-1">Restore</button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowRestoreModal(false);
                                setStaffToRestore(null);
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
