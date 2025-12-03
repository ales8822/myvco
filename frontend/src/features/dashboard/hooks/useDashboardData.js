import { useState, useEffect } from 'react';
import { useCompanyStore } from '../../../stores/companyStore';
import { useStaffStore } from '../../../stores/staffStore';
import { useMeetingStore } from '../../../stores/meetingStore';
import { useDepartmentStore } from '../../../stores/departmentStore';
import { llmApi, libraryApi } from '../../../lib/api';

export const useDashboardData = () => {
    const { currentCompany } = useCompanyStore();
    const { fetchStaff, fetchFiredStaff } = useStaffStore();
    const { fetchMeetings } = useMeetingStore();
    const { fetchDepartments } = useDepartmentStore();

    const [libraryItems, setLibraryItems] = useState([]);
    const [providers, setProviders] = useState(null);

    useEffect(() => {
        if (currentCompany) {
            fetchStaff(currentCompany.id);
            fetchFiredStaff(currentCompany.id);
            fetchMeetings(currentCompany.id);
            fetchDepartments(currentCompany.id);
            fetchLibraryItems();
        }
        loadProviders();
    }, [currentCompany]);

    const fetchLibraryItems = async () => {
        try {
            const response = await libraryApi.list();
            setLibraryItems(response.data);
        } catch (error) {
            console.error("Error fetching library items:", error);
        }
    };

    const loadProviders = async () => {
        try {
            const response = await llmApi.getProviders();
            setProviders(response.data);
        } catch (error) {
            console.error('Error loading providers:', error);
        }
    };

    return {
        libraryItems,
        providers,
        currentCompany
    };
};
