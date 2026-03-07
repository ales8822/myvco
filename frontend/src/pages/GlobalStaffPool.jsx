import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useStaffStore } from '../stores/staffStore';
import { libraryApi } from '../lib/api';
import HireStaffModal from '../features/staff/components/HireStaffModal';

export default function GlobalStaffPool() {
    const { globalStaff, fetchGlobalStaff, createGlobalStaff, removeStaff, updateStaff } = useStaffStore();
    const [libraryItems, setLibraryItems] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        system_prompt: '',
    });

    useEffect(() => {
        fetchGlobalStaff();
        fetchLibraryItems();
    }, []);

    const fetchLibraryItems = async () => {
        try {
            const response = await libraryApi.list();
            setLibraryItems(response.data);
        } catch (error) {
            console.error('Error fetching library items:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (value.endsWith('@')) {
            setActiveDropdown(field);
        }
    };

    const insertTag = (tag, field) => {
        let currentValue = formData[field] || '';
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
        setFormData({ ...formData, [field]: newValue });
        setActiveDropdown(null);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const staffData = {
            ...formData,
            expertise: formData.expertise.split(',').map((e) => e.trim()).filter(Boolean),
        };
        
        if (editingStaff) {
            await updateStaff(editingStaff.id, staffData);
        } else {
            await createGlobalStaff(staffData);
        }
        
        setShowCreateModal(false);
        setEditingStaff(null);
        setFormData({ name: '', role: '', personality: '', expertise: '', system_prompt: '' });
    };

    const openEditModal = (agent) => {
        setEditingStaff(agent);
        setFormData({
            name: agent.name,
            role: agent.role,
            personality: agent.personality || '',
            expertise: Array.isArray(agent.expertise) ? agent.expertise.join(', ') : (agent.expertise || ''),
            system_prompt: agent.system_prompt || '',
        });
        setShowCreateModal(true);
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Agent Factory</h1>
                            <p className="text-gray-600">Create and manage global AI agents available for hire.</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            + Create New Agent
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {globalStaff.map((agent) => (
                            <div key={agent.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900">{agent.name}</h3>
                                        <p className="text-primary-600 font-medium mb-2">{agent.role}</p>
                                    </div>
                                    {agent.companies.length > 0 && (
                                        <div className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider">
                                            Hired
                                        </div>
                                    )}
                                </div>
                                
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{agent.personality}</p>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {agent.expertise?.map((skill, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openEditModal(agent)}
                                        className="flex-1 text-gray-600 hover:bg-gray-50 border border-gray-200 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => removeStaff(agent.id)}
                                        className="flex-1 text-red-600 hover:bg-red-50 border border-red-100 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                                
                                {agent.companies.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Hired by:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {agent.companies.map(c => (
                                                <span key={c.id} className="bg-gray-50 text-gray-600 text-[10px] px-2 py-1 rounded border border-gray-100">
                                                    {c.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {globalStaff.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 text-lg">No unassigned agents available.</p>
                            <button 
                                onClick={() => {
                                    setFormData({ name: '', role: '', personality: '', expertise: '', system_prompt: '' });
                                    setShowCreateModal(true);
                                }}
                                className="mt-4 text-primary-600 font-medium hover:underline"
                            >
                                Create your first agent →
                            </button>
                        </div>
                    )}

                    {showCreateModal && (
                        <HireStaffModal 
                            showHireModal={showCreateModal}
                            setShowHireModal={(val) => {
                                setShowCreateModal(val);
                                if (!val) setEditingStaff(null);
                            }}
                            formData={formData}
                            setFormData={setFormData}
                            handleHire={handleCreateSubmit}
                            activeDropdown={activeDropdown}
                            setActiveDropdown={setActiveDropdown}
                            insertTag={insertTag}
                            libraryItems={libraryItems}
                            departments={[]} // No departments in global pool
                            handleInputChange={handleInputChange}
                            title={editingStaff ? "Edit Agent" : "Create New Agent"}
                            submitLabel={editingStaff ? "Update Agent" : "Create Agent"}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
