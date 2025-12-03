// StaffManagement.jsx
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import StaffHeader from '../features/staff/components/StaffHeader';
import StaffList from '../features/staff/components/StaffList';
import HireStaffModal from '../features/staff/components/HireStaffModal';
import EditStaffModal from '../features/staff/components/EditStaffModal';
import QuickAddDropdown from '../components/QuickAddDropdown'; // shared component
import { useStaffData } from '../features/staff/hooks/useStaffData';
import { useStaffActions } from '../features/staff/hooks/useStaffActions';

export default function StaffManagement() {
    // UI state
    const [showHireModal, setShowHireModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFiredStaff, setShowFiredStaff] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        system_prompt: '',
        department_id: '',
    });
    const [editForm, setEditForm] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        system_prompt: '',
        department_id: '',
    });

    // Data fetching hook
    const { staff, firedStaff, departments, libraryItems } = useStaffData();

    // Action hook
    const { handleHire, handleUpdate, handleFire, handleRestore } = useStaffActions();

    // Helpers
    const handleInputChange = (field, value, isEdit = false) => {
        const setter = isEdit ? setEditForm : setFormData;
        const currentForm = isEdit ? editForm : formData;
        setter({ ...currentForm, [field]: value });
        if (value.endsWith('@')) {
            setActiveDropdown(field);
        }
    };

    const insertTag = (tag, field, isEdit = false) => {
        const setter = isEdit ? setEditForm : setFormData;
        const currentForm = isEdit ? editForm : formData;
        let currentValue = currentForm[field] || '';
        if (currentValue.endsWith('@')) {
            currentValue = currentValue.slice(0, -1);
        }
        let newValue = currentValue;
        if (field === 'expertise') {
            if (newValue && !newValue.trim().endsWith(',')) {
                newValue += ', ';
            }
            newValue += `@${tag}`;
        } else {
            if (newValue && !newValue.trim().endsWith('\n')) {
                newValue += ' ';
            }
            newValue += `@${tag}`;
        }
        setter({ ...currentForm, [field]: newValue });
        setActiveDropdown(null);
    };

    const handleEditStaff = (member) => {
        setEditingStaff(member);
        setEditForm({
            name: member.name,
            role: member.role,
            personality: member.personality || '',
            expertise: Array.isArray(member.expertise) ? member.expertise.join(', ') : (member.expertise || ''),
            system_prompt: member.system_prompt || '',
            department_id: member.department_id || '',
        });
        setShowEditModal(true);
        setActiveDropdown(null);
    };

    const handleHireSubmit = async (e) => {
        e.preventDefault();
        await handleHire(formData);
        setShowHireModal(false);
        setFormData({ name: '', role: '', personality: '', expertise: '', system_prompt: '', department_id: '' });
        setActiveDropdown(null);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        await handleUpdate(editingStaff.id, editForm);
        setShowEditModal(false);
        setEditingStaff(null);
        setActiveDropdown(null);
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <StaffHeader showFiredStaff={showFiredStaff} setShowFiredStaff={setShowFiredStaff} />
                    <StaffList
                        staff={showFiredStaff ? firedStaff : staff}
                        showFiredStaff={showFiredStaff}
                        handleEditStaff={handleEditStaff}
                        handleFireStaff={handleFire}
                        handleRestoreStaff={handleRestore}
                        activeDropdown={activeDropdown}
                        setActiveDropdown={setActiveDropdown}
                        insertTag={insertTag}
                        libraryItems={libraryItems}
                        departments={departments}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        formData={formData}
                        setFormData={setFormData}
                        handleInputChange={handleInputChange}
                        handleUpdateStaff={handleUpdateSubmit}
                        handleHireStaff={handleHireSubmit}
                        setShowHireModal={setShowHireModal}
                        setShowEditModal={setShowEditModal}
                        setEditingStaff={setEditingStaff}
                    />
                    {showHireModal && (
                        <HireStaffModal
                            showHireModal={showHireModal}
                            setShowHireModal={setShowHireModal}
                            formData={formData}
                            setFormData={setFormData}
                            handleHire={handleHireSubmit}
                            activeDropdown={activeDropdown}
                            setActiveDropdown={setActiveDropdown}
                            insertTag={insertTag}
                            libraryItems={libraryItems}
                            departments={departments}
                            handleInputChange={handleInputChange}
                        />
                    )}
                    {showEditModal && (
                        <EditStaffModal
                            showEditModal={showEditModal}
                            setShowEditModal={setShowEditModal}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            handleUpdate={handleUpdateSubmit}
                            activeDropdown={activeDropdown}
                            setActiveDropdown={setActiveDropdown}
                            insertTag={insertTag}
                            libraryItems={libraryItems}
                            departments={departments}
                            handleInputChange={handleInputChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}