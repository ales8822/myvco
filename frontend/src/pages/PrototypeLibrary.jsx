import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibraryData } from "../features/library/hooks/useLibraryData";
import { useLibraryActions } from "../features/library/hooks/useLibraryActions";
import LibraryHeader from "../features/library/components/LibraryHeader";
import LibraryList from "../features/library/components/LibraryList";
import LibraryForm from "../features/library/components/LibraryForm";

const PrototypeLibrary = () => {
    const navigate = useNavigate();

    // Data Hook
    const { items, loading, fetchItems } = useLibraryData();

    // Actions Hook
    const { createItem, updateItem, deleteItem } = useLibraryActions(fetchItems);

    // Local UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({
        slug: "",
        name: "",
        content: "",
        description: "",
        is_global: true,
    });

    const handleCreate = () => {
        setCurrentItem(null);
        setFormData({
            slug: "",
            name: "",
            content: "",
            description: "",
            is_global: true,
        });
        setIsEditing(true);
    };

    const handleEdit = (item) => {
        setCurrentItem(item);
        setFormData({
            slug: item.slug,
            name: item.name,
            content: item.content,
            description: item.description || "",
            is_global: item.is_global,
        });
        setIsEditing(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let success = false;
        if (currentItem) {
            success = await updateItem(currentItem.id, formData);
        } else {
            success = await createItem(formData);
        }

        if (success) {
            setIsEditing(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 text-gray-100 p-6 overflow-hidden min-h-screen">
            <LibraryHeader
                navigate={navigate}
                handleCreate={handleCreate}
                isEditing={isEditing}
            />

            {isEditing ? (
                <LibraryForm
                    currentItem={currentItem}
                    formData={formData}
                    setFormData={setFormData}
                    handleSubmit={handleSubmit}
                    setIsEditing={setIsEditing}
                />
            ) : (
                <LibraryList
                    items={items}
                    loading={loading}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    handleEdit={handleEdit}
                    handleDelete={deleteItem}
                />
            )}
        </div>
    );
};

export default PrototypeLibrary;