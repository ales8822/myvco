// useStaffActions.js
// Hook to handle staff CRUD operations for StaffManagement
import { useCompanyStore } from '../../../stores/companyStore';
import { useStaffStore } from '../../../stores/staffStore';
import { useDepartmentStore } from '../../../stores/departmentStore';

export function useStaffActions() {
    const { currentCompany } = useCompanyStore();
    const { hireStaff, updateStaff, removeStaff, restoreStaff } = useStaffStore();
    const { fetchDepartments } = useDepartmentStore();

    const handleHire = async (formData) => {
        if (!currentCompany) return;
        const staffData = {
            ...formData,
            expertise: formData.expertise.split(',').map((e) => e.trim()),
        };
        await hireStaff(currentCompany.id, staffData);
        // Refresh data if needed (could be done by caller)
    };

    const handleUpdate = async (staffId, editForm) => {
        const updatedData = {
            ...editForm,
            expertise: editForm.expertise.split(',').map((e) => e.trim()).filter(Boolean),
            department_id: editForm.department_id ? parseInt(editForm.department_id) : null,
        };
        await updateStaff(staffId, updatedData);
    };

    const handleFire = async (staffId) => {
        if (window.confirm('Are you sure you want to fire this staff member?')) {
            await removeStaff(staffId);
        }
    };

    const handleRestore = async (staffId) => {
        if (window.confirm('Are you sure you want to restore this staff member?')) {
            await restoreStaff(staffId);
        }
    };

    return { handleHire, handleUpdate, handleFire, handleRestore };
}
