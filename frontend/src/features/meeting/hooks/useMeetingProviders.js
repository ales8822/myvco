import { useState, useEffect } from 'react';
import { llmApi } from '../../../lib/api';

export function useMeetingProviders() {
    const [providers, setProviders] = useState(null);
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);

    const loadProviders = async (force = false) => {
        if (isLoadingProviders) return;
        if (providers && !force) return;

        setIsLoadingProviders(true);
        try {
            const response = await llmApi.getProviders();
            setProviders(response.data);
        } catch (error) {
            console.error('Error loading providers:', error);
        } finally {
            setIsLoadingProviders(false);
        }
    };

    useEffect(() => {
        if (!providers) {
            loadProviders();
        }
    }, []);

    return { providers, isLoadingProviders, loadProviders };
}
