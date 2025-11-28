// frontend\src\stores\staffStore.js
import { create } from 'zustand';
import { staffApi } from '../lib/api';

export const useStaffStore = create((set) => ({
    staff: [],
    firedStaff: [],
    loading: false,
    error: null,

    fetchStaff: async (companyId) => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.list(companyId, true);
            set({ staff: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchFiredStaff: async (companyId) => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.list(companyId, false);
            set({ firedStaff: response.data, loading: false });
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

    removeStaff: async (staffId, reason) => {
        set({ loading: true, error: null });
        try {
            await staffApi.delete(staffId, reason);
            set((state) => {
                const staffMember = state.staff.find((s) => s.id === staffId);
                return {
                    staff: state.staff.filter((s) => s.id !== staffId),
                    firedStaff: staffMember ? [...state.firedStaff, { ...staffMember, is_active: false, fired_at: new Date().toISOString(), fired_reason: reason }] : state.firedStaff,
                    loading: false,
                };
            });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    restoreStaff: async (staffId, restoreData) => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.restore(staffId, restoreData);
            set((state) => ({
                firedStaff: state.firedStaff.filter((s) => s.id !== staffId),
                staff: [...state.staff, response.data],
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));
