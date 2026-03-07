// frontend\src\stores\staffStore.js
import { create } from 'zustand';
import { staffApi } from '../lib/api';

export const useStaffStore = create((set) => ({
    staff: [],
    globalStaff: [],
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

    fetchGlobalStaff: async () => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.listGlobal();
            set({ globalStaff: response.data, loading: false });
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

    createGlobalStaff: async (staffData) => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.createGlobal(staffData);
            set((state) => ({
                globalStaff: [...state.globalStaff, response.data],
                loading: false,
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    assignStaff: async (staffId, companyId) => {
        try {
            const response = await staffApi.hire(staffId, companyId);
            const updatedStaff = response.data;
            set((state) => ({
                staff: [...state.staff, updatedStaff], // Add to current company list
                globalStaff: state.globalStaff.map(s => s.id === staffId ? updatedStaff : s), // Update in pool
                firedStaff: state.firedStaff.filter((s) => s.id !== staffId),
            }));
        } catch (error) {
            console.error('Error assigning staff:', error);
        }
    },
    unassignStaff: async (staffId, companyId) => {
        try {
            const response = await staffApi.fire(staffId, companyId);
            const updatedStaff = response.data;
            set((state) => {
                // Remove from current company staff list
                const newStaff = state.staff.filter((s) => s.id !== staffId);
                
                // If the staff is now not working for any company, it should be in global staff
                const isGlobal = updatedStaff.companies.length === 0;
                
                return {
                    staff: newStaff,
                    globalStaff: isGlobal 
                        ? [...state.globalStaff.filter(s => s.id !== staffId), updatedStaff]
                        : state.globalStaff,
                };
            });
        } catch (error) {
            console.error('Error unassigning staff:', error);
        }
    },

    updateStaff: async (staffId, staffData) => {
        set({ loading: true, error: null });
        try {
            const response = await staffApi.update(staffId, staffData);
            set((state) => ({
                staff: state.staff.map((s) => (s.id === staffId ? response.data : s)),
                globalStaff: state.globalStaff.map((s) => (s.id === staffId ? response.data : s)),
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
                const staffMember = state.staff.find((s) => s.id === staffId) || state.globalStaff.find((s) => s.id === staffId);
                return {
                    staff: state.staff.filter((s) => s.id !== staffId),
                    globalStaff: state.globalStaff.filter((s) => s.id !== staffId),
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
            set((state) => {
                const newState = {
                    firedStaff: state.firedStaff.filter((s) => s.id !== staffId),
                    loading: false,
                };
                if (response.data.company_id) {
                    newState.staff = [...state.staff, response.data];
                } else {
                    newState.globalStaff = [...state.globalStaff, response.data];
                }
                return newState;
            });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));
