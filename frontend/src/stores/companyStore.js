import { create } from 'zustand';
import { companiesApi } from '../lib/api';

export const useCompanyStore = create((set) => ({
    companies: [],
    currentCompany: null,
    loading: false,
    error: null,

    fetchCompanies: async () => {
        set({ loading: true, error: null });
        try {
            const response = await companiesApi.list();
            set({ companies: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    selectCompany: async (companyId) => {
        set({ loading: true, error: null });
        try {
            const response = await companiesApi.get(companyId);
            set({ currentCompany: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    createCompany: async (companyData) => {
        set({ loading: true, error: null });
        try {
            const response = await companiesApi.create(companyData);
            set((state) => ({
                companies: [...state.companies, response.data],
                currentCompany: response.data,
                loading: false,
            }));
            return response.data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateCompany: async (companyId, companyData) => {
        set({ loading: true, error: null });
        try {
            const response = await companiesApi.update(companyId, companyData);
            set((state) => ({
                companies: state.companies.map((c) =>
                    c.id === companyId ? response.data : c
                ),
                currentCompany: response.data,
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    deleteCompany: async (companyId) => {
        set({ loading: true, error: null });
        try {
            await companiesApi.delete(companyId);
            set((state) => ({
                companies: state.companies.filter((c) => c.id !== companyId),
                currentCompany: null,
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));
