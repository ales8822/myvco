import { useState } from 'react';
import { useStaffStore } from '../../../stores/staffStore';
import { departmentsApi } from '../../../lib/api';

export const useStaffManagement = (currentCompany) => {
    const { updateStaff, removeStaff, restoreStaff } = useStaffStore();

    // State
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departmentStaff, setDepartmentStaff] = useState([]);
    const [showFiredStaff, setShowFiredStaff] = useState(false);

    // Edit State
    const [editingStaff, setEditingStaff] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        system_prompt: '',
        department_id: '',
    });
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Fire State
    const [showFireModal, setShowFireModal] = useState(false);
    const [fireReason, setFireReason] = useState('');
    const [staffToFire, setStaffToFire] = useState(null);

    // Restore State
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [staffToRestore, setStaffToRestore] = useState(null);
    const [restoreData, setRestoreData] = useState({ company_id: '', department_id: '' });

    // Fired Details State
    const [showFiredDetailsModal, setShowFiredDetailsModal] = useState(false);
    const [selectedFiredStaff, setSelectedFiredStaff] = useState(null);

    // Handlers
    const handleDepartmentClick = async (department) => {
        setSelectedDepartment(department);
        try {
            const response = await departmentsApi.getStaff(department.id);
            setDepartmentStaff(response.data);
        } catch (error) {
            console.error('Error loading department staff:', error);
        }
    };

    const handleBackToDepartments = () => {
        setSelectedDepartment(null);
        setDepartmentStaff([]);
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

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        try {
            const updatedData = {
                ...editForm,
                expertise: editForm.expertise.split(',').map(s => s.trim()).filter(Boolean),
                department_id: editForm.department_id ? parseInt(editForm.department_id) : null,
            };
            await updateStaff(editingStaff.id, updatedData);
            setShowEditModal(false);
            setEditingStaff(null);
            setActiveDropdown(null);
            if (selectedDepartment) {
                handleDepartmentClick(selectedDepartment);
            }
        } catch (error) {
            console.error('Error updating staff:', error);
        }
    };

    const handleFireClick = (member) => {
        setStaffToFire(member);
        setFireReason('');
        setShowFireModal(true);
    };

    const handleConfirmFire = async (e) => {
        e.preventDefault();
        if (staffToFire) {
            await removeStaff(staffToFire.id, fireReason);
            setShowFireModal(false);
            setStaffToFire(null);
            if (selectedDepartment) {
                handleDepartmentClick(selectedDepartment);
            }
        }
    };

    const handleRestoreClick = (member) => {
        setStaffToRestore(member);
        setRestoreData({
            company_id: currentCompany.id,
            department_id: member.department_id || ''
        });
        setShowRestoreModal(true);
    };

    const handleConfirmRestore = async (e) => {
        e.preventDefault();
        if (staffToRestore) {
            await restoreStaff(staffToRestore.id, {
                company_id: parseInt(restoreData.company_id),
                department_id: restoreData.department_id ? parseInt(restoreData.department_id) : null
            });
            setShowRestoreModal(false);
            setStaffToRestore(null);
        }
    };

    const handleFiredStaffClick = (member) => {
        setSelectedFiredStaff(member);
        setShowFiredDetailsModal(true);
    };

    const handleInputChange = (field, value) => {
        setEditForm({ ...editForm, [field]: value });
        if (value.endsWith('@')) {
            setActiveDropdown(field);
        }
    };

    const insertTag = (tag, field) => {
        let currentValue = editForm[field] || '';
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
            if (newValue && !newValue.trim().endsWith('\n') && newValue !== '') {
                newValue += ' ';
            }
            newValue += `@${tag}`;
        }

        setEditForm({ ...editForm, [field]: newValue });
        setActiveDropdown(null);
    };

    return {
        selectedDepartment,
        departmentStaff,
        showFiredStaff,
        setShowFiredStaff,
        editingStaff,
        setEditingStaff,
        showEditModal,
        setShowEditModal,
        editForm,
        setEditForm,
        activeDropdown,
        setActiveDropdown,
        showFireModal,
        setShowFireModal,
        fireReason,
        setFireReason,
        staffToFire,
        setStaffToFire,
        showRestoreModal,
        setShowRestoreModal,
        staffToRestore,
        setStaffToRestore,
        restoreData,
        setRestoreData,
        showFiredDetailsModal,
        setShowFiredDetailsModal,
        selectedFiredStaff,
        setSelectedFiredStaff,
        handleDepartmentClick,
        handleBackToDepartments,
        handleEditStaff,
        handleUpdateStaff,
        handleFireClick,
        handleConfirmFire,
        handleRestoreClick,
        handleConfirmRestore,
        handleFiredStaffClick,
        handleInputChange,
        insertTag
    };
};
