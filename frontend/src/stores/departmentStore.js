// frontend\src\stores\departmentStore.js
import { create } from 'zustand';
import { departmentsApi } from '../lib/api';

export const useDepartmentStore = create((set, get) => ({
    departments: [],
    currentDepartment: null,

    fetchDepartments: async (companyId) => {
        try {
            const response = await departmentsApi.list(companyId);
            set({ departments: response.data });
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    },

    createDepartment: async (companyId, departmentData) => {
        try {
            const response = await departmentsApi.create(companyId, departmentData);
            set((state) => ({
                departments: [...state.departments, response.data]
            }));
            return response.data;
        } catch (error) {
            console.error('Error creating department:', error);
            throw error;
        }
    },

    updateDepartment: async (departmentId, departmentData) => {
        try {
            const response = await departmentsApi.update(departmentId, departmentData);
            set((state) => ({
                departments: state.departments.map((dept) =>
                    dept.id === departmentId ? response.data : dept
                )
            }));
            return response.data;
        } catch (error) {
            console.error('Error updating department:', error);
            throw error;
        }
    },

    deleteDepartment: async (departmentId) => {
        try {
            await departmentsApi.delete(departmentId);
            set((state) => ({
                departments: state.departments.filter((dept) => dept.id !== departmentId),
                currentDepartment: state.currentDepartment?.id === departmentId ? null : state.currentDepartment
            }));
        } catch (error) {
            console.error('Error deleting department:', error);
            throw error;
        }
    },

    setCurrentDepartment: (department) => {
        set({ currentDepartment: department });
    },

    clearDepartments: () => {
        set({ departments: [], currentDepartment: null });
    }
}));
