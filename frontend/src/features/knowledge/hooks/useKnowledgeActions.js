// useKnowledgeActions.js
import { useCompanyStore } from '../../../stores/companyStore';
import { knowledgeApi } from '../../../lib/api';

export function useKnowledgeActions(fetchKnowledge) {
    const { currentCompany } = useCompanyStore();

    const addKnowledge = async (formData) => {
        if (!currentCompany) return false;

        try {
            await knowledgeApi.create(currentCompany.id, formData);
            fetchKnowledge();
            return true;
        } catch (error) {
            console.error('Error adding knowledge:', error);
            alert("Failed to add knowledge. Please check the logs.");
            return false;
        }
    };

    const deleteKnowledge = async (id) => {
        if (confirm('Are you sure you want to delete this knowledge entry?')) {
            try {
                await knowledgeApi.delete(id);
                fetchKnowledge();
                return true;
            } catch (error) {
                console.error('Error deleting knowledge:', error);
                return false;
            }
        }
        return false;
    };

    return { addKnowledge, deleteKnowledge };
}
