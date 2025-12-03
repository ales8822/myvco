// useLibraryActions.js
import { libraryApi } from '../../../lib/api';

export function useLibraryActions(fetchItems) {
    const createItem = async (data) => {
        try {
            await libraryApi.create(data);
            fetchItems();
            return true;
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Error saving item. Ensure slug is unique.");
            return false;
        }
    };

    const updateItem = async (id, data) => {
        try {
            await libraryApi.update(id, data);
            fetchItems();
            return true;
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Error saving item. Ensure slug is unique.");
            return false;
        }
    };

    const deleteItem = async (id) => {
        if (window.confirm("Are you sure you want to delete this module?")) {
            try {
                await libraryApi.delete(id);
                fetchItems();
                return true;
            } catch (error) {
                console.error("Error deleting item:", error);
                return false;
            }
        }
        return false;
    };

    return { createItem, updateItem, deleteItem };
}
