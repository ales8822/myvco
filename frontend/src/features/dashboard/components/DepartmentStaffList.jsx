import DepartmentView from '../../../components/DepartmentView';

export default function DepartmentStaffList({
    selectedDepartment,
    departmentStaff,
    currentCompany,
    handleBackToDepartments,
    handleEditStaff,
    handleFireClick,
    handleDepartmentClick
}) {
    return (
        <div className="card mb-8">
            {selectedDepartment ? (
                <div>
                    <button
                        onClick={handleBackToDepartments}
                        className="mb-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-2 font-medium transition-colors"
                    >
                        ← Back to Departments
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        {selectedDepartment.name} - Staff
                    </h2>
                    {departmentStaff.length === 0 ? (
                        <p className="text-gray-500 dark:text-neutral-500">No staff in this department yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {departmentStaff.map((member) => (
                                <div key={member.id} className="card bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 group relative">
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditStaff(member); }}
                                            className="p-1.5 bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-neutral-700 rounded shadow-sm border border-gray-200 dark:border-neutral-700 transition-colors"
                                            title="Edit Staff"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleFireClick(member); }}
                                            className="p-1.5 bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shadow-sm border border-gray-200 dark:border-neutral-700 transition-colors"
                                            title="Fire Staff"
                                        >
                                            🔥
                                        </button>
                                    </div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-2xl font-bold text-white">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-primary-600 dark:text-primary-400 font-semibold text-sm mb-3">
                                        {member.role}
                                    </p>
                                    {member.personality && (
                                        <p className="text-sm text-gray-600 dark:text-neutral-400 mb-3 line-clamp-2">
                                            {member.personality}
                                        </p>
                                    )}
                                    {member.system_prompt && (
                                        <p className="text-xs text-gray-400 mb-2 italic truncate">
                                            Instr: {member.system_prompt}
                                        </p>
                                    )}
                                    {member.expertise && member.expertise.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {member.expertise.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 text-[10px] font-bold uppercase tracking-tight rounded"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <DepartmentView companyId={currentCompany?.id} onDepartmentClick={handleDepartmentClick} />
            )}
        </div>
    );
}
