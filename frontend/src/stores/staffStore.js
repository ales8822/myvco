import { create } from 'zustand';
import { staffApi } from '../lib/api';

export const useStaffStore = create((set) => ({
    staff: [],
    loading: false,
    error: null,

    fetchStaff: async (companyId) => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.list(companyId);
            set({ staff: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    hireStaff: async (companyId, staffData) => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.create(companyId, staffData);
            set((state) => ({
                staff: [...state.staff, response.data],
                loading: false,
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateStaff: async (staffId, staffData) => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.update(staffId, staffData);
            set((state) => ({
                staff: state.staff.map((s) => (s.id === staffId ? response.data : s)),
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    removeStaff: async (staffId) => {
        set({ loading: true, error: null });
        try {
            await staffApi.delete(staffId);
            set((state) => ({
                staff: state.staff.filter((s) => s.id !== staffId),
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));
