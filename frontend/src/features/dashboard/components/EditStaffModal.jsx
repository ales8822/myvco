import { BookOpen, X } from "lucide-react";

const QuickAddDropdown = ({ onSelect, setActiveDropdown, libraryItems }) => (
  <div className="absolute right-0 top-8 w-64 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto transition-colors">
    <div className="p-2 text-xs font-semibold text-gray-500 dark:text-neutral-400 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-800">
      <span>Quick Add Module</span>
      <button
        onClick={() => setActiveDropdown(null)}
        className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
    {libraryItems.length === 0 ? (
      <div className="p-3 text-sm text-gray-400 dark:text-neutral-500 italic text-center">
        No modules available
      </div>
    ) : (
      libraryItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.slug)}
          className="w-full text-left px-3 py-2 text-sm hover:bg-secondary-50 dark:hover:bg-secondary-900/20 hover:text-secondary-700 dark:hover:text-secondary-300 flex items-center justify-between group/item transition-colors text-gray-700 dark:text-neutral-200"
        >
          <span className="font-mono text-primary-600 dark:text-primary-400">
            @{item.slug}
          </span>
        </button>
      ))
    )}
  </div>
);

export default function EditStaffModal({
  showEditModal,
  setShowEditModal,
  handleUpdateStaff,
  editForm,
  handleInputChange,
  departments,
  activeDropdown,
  setActiveDropdown,
  insertTag,
  libraryItems,
  setEditingStaff,
}) {
  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 max-w-md w-full shadow-2xl border border-transparent dark:border-neutral-800 transition-colors">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Edit Staff Member
        </h2>
        <form onSubmit={handleUpdateStaff}>
          <div className="mb-4">
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              value={editForm.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="label">Role</label>
            <input
              type="text"
              className="input"
              value={editForm.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="label">Department</label>
            <select
              className="input"
              value={editForm.department_id}
              onChange={(e) =>
                handleInputChange("department_id", e.target.value)
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

          <div className="mb-4 relative group">
            <div className="flex justify-between items-center mb-1">
              <label className="label mb-0">Personality</label>
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "personality" ? null : "personality",
                  )
                }
                className="text-xs text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium flex items-center gap-1 transition-colors"
              >
                <BookOpen className="w-3 h-3" /> Library
              </button>
            </div>
            {activeDropdown === "personality" && (
              <QuickAddDropdown
                onSelect={(tag) => insertTag(tag, "personality")}
                setActiveDropdown={setActiveDropdown}
                libraryItems={libraryItems}
              />
            )}
            <textarea
              className="input"
              rows="2"
              value={editForm.personality}
              onChange={(e) => handleInputChange("personality", e.target.value)}
            />
          </div>
          <div className="mb-6 relative group">
            <div className="flex justify-between items-center mb-1">
              <label className="label mb-0">Expertise (comma-separated)</label>
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "expertise" ? null : "expertise",
                  )
                }
                className="text-xs text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" /> Library
              </button>
            </div>
            {activeDropdown === "expertise" && (
              <QuickAddDropdown
                onSelect={(tag) => insertTag(tag, "expertise")}
                setActiveDropdown={setActiveDropdown}
                libraryItems={libraryItems}
              />
            )}
            <input
              type="text"
              className="input"
              value={editForm.expertise}
              onChange={(e) => handleInputChange("expertise", e.target.value)}
            />
          </div>
          {/* Personal Instructions (System Prompt) */}
          <div className="mb-4 relative group">
            <div className="flex justify-between items-center mb-1">
              <label className="label mb-0 font-bold text-primary-600 dark:text-primary-400">
                Personal Instructions
              </label>
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "system_prompt" ? null : "system_prompt",
                  )
                }
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" /> Library
              </button>
            </div>
            {activeDropdown === "system_prompt" && (
              <QuickAddDropdown
                onSelect={(tag) => insertTag(tag, "system_prompt")}
                setActiveDropdown={setActiveDropdown}
                libraryItems={libraryItems}
              />
            )}
            <textarea
              className="input border-primary-100 dark:border-neutral-700 focus:border-primary-500"
              rows="3"
              value={editForm.system_prompt}
              onChange={(e) =>
                handleInputChange("system_prompt", e.target.value)
              }
              placeholder="Specific rules, manifestos, or behavioral instructions"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">
              Update
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingStaff(null);
                setActiveDropdown(null);
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
