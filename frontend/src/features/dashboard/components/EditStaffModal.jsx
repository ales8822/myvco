import { BookOpen, X } from 'lucide-react';

const QuickAddDropdown = ({ onSelect, setActiveDropdown, libraryItems }) => (
    <div className="absolute right-0 top-8 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
        <div className="p-2 text-xs font-semibold text-gray-500 border-b border-gray-100 flex justify-between items-center">
            <span>Quick Add Module</span>
            <button
                onClick={() => setActiveDropdown(null)}
                className="text-gray-400 hover:text-gray-600"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
        {libraryItems.length === 0 ? (
            <div className="p-2 text-sm text-gray-400">No modules available</div>
        ) : (
            libraryItems.map(item => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.slug)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 flex items-center justify-between group/item transition-colors"
                >
                    <span className="font-mono">@{item.slug}</span>
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
    setEditingStaff
}) {
    if (!showEditModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Staff Member</h2>
                <form onSubmit={handleUpdateStaff}>
                    <div className="mb-4">
                        <label className="label">Name</label>
                        <input
                            type="text"
                            className="input"
                            value={editForm.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="label">Role</label>
                        <input
                            type="text"
                            className="input"
                            value={editForm.role}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="label">Department</label>
                        <select
                            className="input"
                            value={editForm.department_id}
                            onChange={(e) => handleInputChange('department_id', e.target.value)}
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
                                onClick={() => setActiveDropdown(activeDropdown === 'personality' ? null : 'personality')}
                                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'personality' && (
                            <QuickAddDropdown
                                onSelect={(tag) => insertTag(tag, 'personality')}
                                setActiveDropdown={setActiveDropdown}
                                libraryItems={libraryItems}
                            />
                        )}
                        <textarea
                            className="input"
                            rows="2"
                            value={editForm.personality}
                            onChange={(e) => handleInputChange('personality', e.target.value)}
                        />
                    </div>
                    <div className="mb-6 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Expertise (comma-separated)</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'expertise' ? null : 'expertise')}
                                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'expertise' && (
                            <QuickAddDropdown
                                onSelect={(tag) => insertTag(tag, 'expertise')}
                                setActiveDropdown={setActiveDropdown}
                                libraryItems={libraryItems}
                            />
                        )}
                        <input
                            type="text"
                            className="input"
                            value={editForm.expertise}
                            onChange={(e) => handleInputChange('expertise', e.target.value)}
                        />
                    </div>
                    {/* Personal Instructions (System Prompt) */}
                    <div className="mb-4 relative group">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Personal Instructions</label>
                            <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === 'system_prompt' ? null : 'system_prompt')}
                                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                            >
                                <BookOpen className="w-3 h-3" /> Library
                            </button>
                        </div>
                        {activeDropdown === 'system_prompt' && (
                            <QuickAddDropdown
                                onSelect={(tag) => insertTag(tag, 'system_prompt')}
                                setActiveDropdown={setActiveDropdown}
                                libraryItems={libraryItems}
                            />
                        )}
                        <textarea
                            className="input"
                            rows="3"
                            value={editForm.system_prompt}
                            onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                            placeholder="Specific rules, manifestos, or behavioral instructions"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" className="btn-primary flex-1">Update</button>
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
