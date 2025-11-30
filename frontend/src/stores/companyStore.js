// frontend\src\stores\companyStore.js
import { create } from 'zustand';
import { companiesApi } from '../lib/api';

export const useCompanyStore = create((set) => ({
    companies: [],
    archivedCompanies: [],
    currentCompany: null,
    loading: false,
    error: null,

    fetchCompanies: async (includeArchived = false) => {
        set({ loading: true, error: null });
        try {
            const response = await companiesApi.list({ include_archived: includeArchived });
            if (includeArchived) {
                set({ companies: response.data, loading: false });
            } else {
                set({ companies: response.data, loading: false });
            }
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchArchivedCompanies: async () => {
        set({ loading: true, error: null });
        try {
            const response = await companiesApi.list({ include_archived: true });
            const archived = response.data.filter(c => c.is_archived);
            set({ archivedCompanies: archived, loading: false });
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
                archivedCompanies: state.archivedCompanies.filter((c) => c.id !== companyId),
                currentCompany: null,
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    archiveCompany: async (companyId) => {
        set({ loading: true, error: null });
        try {
            const response = await companiesApi.archive(companyId);
            set((state) => {
                const isArchived = response.data.is_archived;

                let newCompanies = [...state.companies];
                let newArchived = [...state.archivedCompanies];

                if (isArchived) {
                    newCompanies = newCompanies.filter(c => c.id !== companyId);
                    if (!newArchived.find(c => c.id === companyId)) {
                        newArchived.push(response.data);
                    }
                } else {
                    newArchived = newArchived.filter(c => c.id !== companyId);
                    if (!newCompanies.find(c => c.id === companyId)) {
                        newCompanies.push(response.data);
                    }
                }

                return {
                    companies: newCompanies,
                    archivedCompanies: newArchived,
                    loading: false,
                    currentCompany: state.currentCompany?.id === companyId ? null : state.currentCompany
                };
            });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));
