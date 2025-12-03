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
                        className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
                    >
                        ← Back to Departments
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {selectedDepartment.name} - Staff
                    </h2>
                    {departmentStaff.length === 0 ? (
                        <p className="text-gray-500">No staff in this department yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {departmentStaff.map((member) => (
                                <div key={member.id} className="card group relative">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditStaff(member); }}
                                            className="p-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded shadow-sm border border-gray-200"
                                            title="Edit Staff"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleFireClick(member); }}
                                            className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded shadow-sm border border-gray-200"
                                            title="Fire Staff"
                                        >
                                            🔥
                                        </button>
                                    </div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-primary-600 font-medium mb-3">
                                        {member.role}
                                    </p>
                                    {member.personality && (
                                        <p className="text-sm text-gray-600 mb-3">
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
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
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
