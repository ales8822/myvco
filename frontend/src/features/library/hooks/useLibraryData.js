// useLibraryData.js
import { useState, useEffect } from 'react';
import { libraryApi } from '../../../lib/api';

export function useLibraryData() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await libraryApi.list();
            setItems(response.data);
        } catch (error) {
            console.error("Error fetching library items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    return { items, loading, fetchItems };
}
