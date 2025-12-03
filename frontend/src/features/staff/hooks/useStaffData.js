// useStaffData.js
// Hook to fetch staff, fired staff, departments, and library items for StaffManagement
import { useEffect, useState } from 'react';
import { useCompanyStore } from '../../../stores/companyStore';
import { useStaffStore } from '../../../stores/staffStore';
import { useDepartmentStore } from '../../../stores/departmentStore';
import { libraryApi } from '../../../lib/api';

export function useStaffData() {
    const { currentCompany } = useCompanyStore();
    const { staff, fetchStaff, firedStaff, fetchFiredStaff } = useStaffStore();
    const { departments, fetchDepartments } = useDepartmentStore();
    const [libraryItems, setLibraryItems] = useState([]);

    useEffect(() => {
        if (currentCompany) {
            const companyId = currentCompany.id;
            fetchStaff(companyId);
            fetchFiredStaff(companyId);
            fetchDepartments(companyId);
            fetchLibraryItems();
        }
    }, [currentCompany]);

    const fetchLibraryItems = async () => {
        try {
            const response = await libraryApi.list();
            setLibraryItems(response.data);
        } catch (error) {
            console.error('Error fetching library items:', error);
        }
    };

    return { staff, firedStaff, departments, libraryItems };
}
