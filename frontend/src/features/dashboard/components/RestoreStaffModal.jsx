export default function RestoreStaffModal({
  showRestoreModal,
  setShowRestoreModal,
  handleConfirmRestore,
  restoreData,
  setRestoreData,
  departments,
  setStaffToRestore,
}) {
  if (!showRestoreModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 max-w-md w-full shadow-2xl border border-transparent dark:border-neutral-800 transition-colors">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Restore Staff Member
        </h2>
        <form onSubmit={handleConfirmRestore}>
          <div className="mb-4">
            <label className="label">Department</label>
            <select
              className="input"
              value={restoreData.department_id}
              onChange={(e) =>
                setRestoreData({
                  ...restoreData,
                  department_id: e.target.value,
                })
              }
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
            <button
              type="submit"
              className="btn-primary bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 flex-1 shadow-sm"
            >
              Restore
            </button>
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
