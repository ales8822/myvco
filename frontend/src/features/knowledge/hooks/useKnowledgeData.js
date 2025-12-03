// useKnowledgeData.js
import { useState, useEffect } from 'react';
import { useCompanyStore } from '../../../stores/companyStore';
import { knowledgeApi } from '../../../lib/api';

export function useKnowledgeData() {
    const { currentCompany } = useCompanyStore();
    const [knowledge, setKnowledge] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchKnowledge = async () => {
        if (!currentCompany) return;

        setLoading(true);
        try {
            const response = await knowledgeApi.list(currentCompany.id);
            setKnowledge(response.data);
        } catch (error) {
            console.error('Error fetching knowledge:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKnowledge();
    }, [currentCompany]);

    return { knowledge, loading, fetchKnowledge };
}
