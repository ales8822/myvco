import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { useStaffStore } from '../stores/staffStore';
import { useMeetingStore } from '../stores/meetingStore';
import { useDepartmentStore } from '../stores/departmentStore';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import DepartmentView from '../components/DepartmentView';
import AssetManager from '../components/AssetManager';
import { llmApi, departmentsApi, libraryApi } from '../lib/api';
import { BookOpen, X } from 'lucide-react';

export default function CompanyDashboard() {
    const navigate = useNavigate();
    const { currentCompany } = useCompanyStore();
    const { staff, fetchStaff, firedStaff, fetchFiredStaff, updateStaff, removeStaff, restoreStaff } = useStaffStore();
    const { meetings, fetchMeetings, createMeeting, deleteMeeting } = useMeetingStore();
    const { departments, fetchDepartments } = useDepartmentStore();
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departmentStaff, setDepartmentStaff] = useState([]);
    const [showFiredStaff, setShowFiredStaff] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Library State
    const [libraryItems, setLibraryItems] = useState([]);
    // NEW: Track which dropdown is currently open ('system_prompt', 'personality', 'expertise', or null)
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [editForm, setEditForm] = useState({
        name: '',
        role: '',
        personality: '',
        expertise: '',
        system_prompt: '',
        department_id: '',
    });
    const [showFireModal, setShowFireModal] = useState(false);
    const [fireReason, setFireReason] = useState('');
    const [staffToFire, setStaffToFire] = useState(null);

    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [staffToRestore, setStaffToRestore] = useState(null);
    const [restoreData, setRestoreData] = useState({ company_id: '', department_id: '' });

    const [showFiredDetailsModal, setShowFiredDetailsModal] = useState(false);
    const [selectedFiredStaff, setSelectedFiredStaff] = useState(null);

    const [selectedTab, setSelectedTab] = useState('overview');

    // LLM State
    const [providers, setProviders] = useState(null);

    // Meeting Form State
    const [meetingForm, setMeetingForm] = useState({
        title: '',
        meeting_type: 'general',
        participants: [],
    });

    useEffect(() => {
        if (currentCompany) {
            fetchStaff(currentCompany.id);
            fetchFiredStaff(currentCompany.id);
            fetchMeetings(currentCompany.id);
            fetchDepartments(currentCompany.id);
            fetchLibraryItems();
        }
        loadProviders();
    }, [currentCompany]);

    const fetchLibraryItems = async () => {
        try {
            const response = await libraryApi.list();
            setLibraryItems(response.data);
        } catch (error) {
            console.error("Error fetching library items:", error);
        }
    };

    const loadProviders = async () => {
        try {
            const response = await llmApi.getProviders();
            setProviders(response.data);
        } catch (error) {
            console.error('Error loading providers:', error);
        }
    };

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
        setActiveDropdown(null); // Reset dropdown state
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

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        try {
            const meeting = await createMeeting(currentCompany.id, meetingForm);
            setShowMeetingModal(false);
            setMeetingForm({ title: '', meeting_type: 'general', participants: [] });
            navigate(`/meeting/${meeting.id}`);
        } catch (error) {
            console.error('Error creating meeting:', error);
        }
    };

    const handleDeleteMeeting = async (e, meetingId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this meeting? This cannot be undone.')) {
            await deleteMeeting(meetingId);
        }
    };

    // Helper to handle input changes and detect '@' trigger
    const handleInputChange = (field, value) => {
        setEditForm({ ...editForm, [field]: value });
        
        // If user types '@', open the dropdown for this field
        if (value.endsWith('@')) {
            setActiveDropdown(field);
        }
    };

    // Helper to insert Library tags
    const insertTag = (tag, field) => {
        let currentValue = editForm[field] || '';
        
        // If triggered by typing '@', remove that trailing char so we don't double it
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
        setActiveDropdown(null); // Close dropdown after selection
    };

    // Quick Add Dropdown Component (No longer hover-based)
    const QuickAddDropdown = ({ onSelect }) => (
        <div className="absolute right-0 top-8 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            <div className="p-2 text-xs font-semibold text-gray-500 border-b border-gray-100 flex justify-between items-center">
                <span>Quick Add Module</span>
                <button 
                    onClick={() => setActiveDropdown(null)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
            {libraryItems.length === 0 ? (
                <div className="p-2 text-sm text-gray-400">No modules available</div>
            ) : (
                libraryItems.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.slug)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 flex items-center justify-between group/item transition-colors"
                    >
                        <span className="font-mono">@{item.slug}</span>
                    </button>
                ))
            )}
        </div>
    );

    const handleParticipantToggle = (staffId) => {
        const isSelected = meetingForm.participants.find(p => p.staff_id === staffId);
        if (isSelected) {
            setMeetingForm({
                ...meetingForm,
                participants: meetingForm.participants.filter(p => p.staff_id !== staffId)
            });
        } else {
            setMeetingForm({
                ...meetingForm,
                participants: [
                    ...meetingForm.participants,
                    { staff_id: staffId, llm_provider: 'gemini', llm_model: '' }
                ]
            });
        }
    };

    const updateParticipantConfig = (staffId, field, value) => {
        setMeetingForm({
            ...meetingForm,
            participants: meetingForm.participants.map(p =>
                p.staff_id === staffId ? { ...p, [field]: value } : p
            )
        });
    };

    const activeMeetings = meetings.filter((m) => m.status === 'active');
    const pastMeetings = meetings.filter((m) => m.status === 'ended');

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <Breadcrumbs items={[{ label: currentCompany?.name || 'Dashboard' }]} />

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {currentCompany?.name}
                        </h1>
                        <p className="text-gray-600">{currentCompany?.description}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Departments</p>
                                    <p className="text-3xl font-bold text-gray-900">{departments.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">📂</span>
                                </div>
                            </div>
                        </div>

                        <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowFiredStaff(!showFiredStaff)}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Fired Staff</p>
                                    <p className="text-3xl font-bold text-gray-900">{firedStaff?.length || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">🚫</span>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Active Meetings</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {activeMeetings.length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">💬</span>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Meetings</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {meetings.length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department/Staff View */}
                    <div className="card mb-8">
                        {selectedDepartment ? (
                            <div>
                                <button
                                    onClick={handleBackToDepartments}
                                    className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
                                >
                                    ← Back to Departments
                                </button>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    {selectedDepartment.name} - Staff
                                </h2>
                                {departmentStaff.length === 0 ? (
                                    <p className="text-gray-500">No staff in this department yet.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {departmentStaff.map((member) => (
                                            <div key={member.id} className="card group relative">
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditStaff(member); }}
                                                        className="p-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded shadow-sm border border-gray-200"
                                                        title="Edit Staff"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleFireClick(member); }}
                                                        className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded shadow-sm border border-gray-200"
                                                        title="Fire Staff"
                                                    >
                                                        🔥
                                                    </button>
                                                </div>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-white">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                                    {member.name}
                                                </h3>
                                                <p className="text-primary-600 font-medium mb-3">
                                                    {member.role}
                                                </p>
                                                {member.personality && (
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        {member.personality}
                                                    </p>
                                                )}
                                                {member.system_prompt && (
                                                    <p className="text-xs text-gray-400 mb-2 italic truncate">
                                                        Instr: {member.system_prompt}
                                                    </p>
                                                )}
                                                {member.expertise && member.expertise.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {member.expertise.map((skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <DepartmentView companyId={currentCompany?.id} onDepartmentClick={handleDepartmentClick} />
                        )}
                    </div>

                    {/* Fired Staff Panel */}
                    {showFiredStaff && (
                        <div className="card mb-8 bg-red-50 border-red-100">
                            <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                                <span>🚫</span> Fired Staff Archive
                            </h2>
                            {firedStaff?.length === 0 ? (
                                <p className="text-gray-500">No fired staff in the archive.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {firedStaff?.map((member) => (
                                        <div
                                            key={member.id}
                                            className="bg-white p-4 rounded-lg border border-red-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={() => handleFiredStaffClick(member)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRestoreClick(member); }}
                                                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">{member.role}</p>
                                            <p className="text-xs text-gray-500">
                                                Fired: {new Date(member.fired_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="card mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="flex gap-4">
                            <button onClick={() => navigate('/staff')} className="btn-primary">👥 Hire Staff</button>
                            <button onClick={() => setShowMeetingModal(true)} className="btn-primary">💬 Start Meeting</button>
                            <button onClick={() => navigate('/knowledge')} className="btn-secondary">📚 Add Knowledge</button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setSelectedTab('overview')}
                                className={`${selectedTab === 'overview'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setSelectedTab('assets')}
                                className={`${selectedTab === 'assets'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Company Assets
                            </button>
                        </nav>
                    </div>

                    {selectedTab === 'assets' ? (
                        <AssetManager companyId={currentCompany?.id} />
                    ) : (
                        <>
                            {/* Active Meetings */}
                            {activeMeetings.length > 0 && (
                                <div className="card mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Meetings</h2>
                                    <div className="space-y-3">
                                        {activeMeetings.map((meeting) => (
                                            <div
                                                key={meeting.id}
                                                onClick={() => navigate(`/meeting/${meeting.id}`)}
                                                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors flex justify-between items-center group"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {meeting.meeting_type} • Started {new Date(meeting.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteMeeting(e, meeting.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Meetings */}
                            {pastMeetings.length > 0 && (
                                <div className="card">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Meetings</h2>
                                    <div className="space-y-3">
                                        {pastMeetings.slice(0, 5).map((meeting) => (
                                            <div
                                                key={meeting.id}
                                                onClick={() => navigate(`/meeting/${meeting.id}`)}
                                                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors flex justify-between items-start group"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {meeting.meeting_type} • Ended {new Date(meeting.ended_at).toLocaleString()}
                                                    </p>
                                                    {meeting.summary && <p className="text-sm text-gray-700 line-clamp-2">{meeting.summary}</p>}
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteMeeting(e, meeting.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded transition-all ml-4"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create Meeting Modal */}
            {showMeetingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl p-8 max-w-2xl w-full my-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start New Meeting</h2>
                        <form onSubmit={handleCreateMeeting}>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="label">Meeting Title *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={meetingForm.title}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Meeting Type</label>
                                    <select
                                        className="input"
                                        value={meetingForm.meeting_type}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, meeting_type: e.target.value })}
                                    >
                                        <option value="general">General Discussion</option>
                                        <option value="brainstorm">Brainstorming</option>
                                        <option value="decision">Decision Making</option>
                                        <option value="review">Review</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="label">Select Participants & Assign Intelligence</label>
                                <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                                    {staff.map((member) => {
                                        const participant = meetingForm.participants.find(p => p.staff_id === member.id);
                                        const isSelected = !!participant;

                                        return (
                                            <div key={member.id} className={`p-4 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleParticipantToggle(member.id)}
                                                            className="w-5 h-5 rounded text-blue-600"
                                                        />
                                                        <div>
                                                            <span className="font-semibold text-gray-900">{member.name}</span>
                                                            <span className="text-sm text-gray-500 ml-2">({member.role})</span>
                                                        </div>
                                                    </label>
                                                </div>

                                                {isSelected && (
                                                    <div className="ml-8 grid grid-cols-2 gap-4 mt-3 bg-white p-3 rounded border border-gray-200">
                                                        <div>
                                                            <label className="text-xs font-medium text-gray-500 mb-1 block">LLM Provider</label>
                                                            <select
                                                                className="w-full text-sm border-gray-300 rounded-md"
                                                                value={participant.llm_provider}
                                                                onChange={(e) => updateParticipantConfig(member.id, 'llm_provider', e.target.value)}
                                                            >
                                                                <option value="gemini">Gemini</option>
                                                                <option value="ollama">Ollama</option>
                                                            </select>
                                                        </div>

                                                        {participant.llm_provider === 'ollama' && (
                                                            <div>
                                                                <label className="text-xs font-medium text-gray-500 mb-1 block">Model</label>
                                                                <select
                                                                    className="w-full text-sm border-gray-300 rounded-md"
                                                                    value={participant.llm_model}
                                                                    onChange={(e) => updateParticipantConfig(member.id, 'llm_model', e.target.value)}
                                                                >
                                                                    <option value="">Default</option>
                                                                    {providers?.ollama_models?.map(model => (
                                                                        <option key={model} value={model}>{model}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">Start Meeting</button>
                                <button type="button" onClick={() => setShowMeetingModal(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Staff Member</h2>
                        <form onSubmit={handleUpdateStaff}>
                            <div className="mb-4">
                                <label className="label">Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editForm.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Role</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editForm.role}
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Department</label>
                                <select
                                    className="input"
                                    value={editForm.department_id}
                                    onChange={(e) => handleInputChange('department_id', e.target.value)}
                                >
                                    <option value="">No Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            

                            <div className="mb-4 relative group">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="label mb-0">Personality</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveDropdown(activeDropdown === 'personality' ? null : 'personality')}
                                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                    >
                                        <BookOpen className="w-3 h-3" /> Library
                                    </button>
                                </div>
                                {activeDropdown === 'personality' && (
                                    <QuickAddDropdown onSelect={(tag) => insertTag(tag, 'personality')} />
                                )}
                                <textarea
                                    className="input"
                                    rows="2"
                                    value={editForm.personality}
                                    onChange={(e) => handleInputChange('personality', e.target.value)}
                                />
                            </div>
                            <div className="mb-6 relative group">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="label mb-0">Expertise (comma-separated)</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveDropdown(activeDropdown === 'expertise' ? null : 'expertise')}
                                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                    >
                                        <BookOpen className="w-3 h-3" /> Library
                                    </button>
                                </div>
                                {activeDropdown === 'expertise' && (
                                    <QuickAddDropdown onSelect={(tag) => insertTag(tag, 'expertise')} />
                                )}
                                <input
                                    type="text"
                                    className="input"
                                    value={editForm.expertise}
                                    onChange={(e) => handleInputChange('expertise', e.target.value)}
                                />
                            </div>
                            {/* Personal Instructions (System Prompt) - MODIFIED */}
                            <div className="mb-4 relative group">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="label mb-0">Personal Instructions</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveDropdown(activeDropdown === 'system_prompt' ? null : 'system_prompt')}
                                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                    >
                                        <BookOpen className="w-3 h-3" /> Library
                                    </button>
                                </div>
                                {activeDropdown === 'system_prompt' && (
                                    <QuickAddDropdown onSelect={(tag) => insertTag(tag, 'system_prompt')} />
                                )}
                                <textarea
                                    className="input"
                                    rows="3"
                                    value={editForm.system_prompt}
                                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                                    placeholder="Specific rules, manifestos, or behavioral instructions"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">Update</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingStaff(null);
                                        setActiveDropdown(null);
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Fire Staff Modal */}
            {showFireModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Fire Staff Member</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to fire <span className="font-semibold">{staffToFire?.name}</span>?
                            They will be moved to the archive.
                        </p>
                        <form onSubmit={handleConfirmFire}>
                            <div className="mb-6">
                                <label className="label">Reason for Firing</label>
                                <textarea
                                    className="input"
                                    rows="3"
                                    value={fireReason}
                                    onChange={(e) => setFireReason(e.target.value)}
                                    placeholder="Optional reason..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700 flex-1">Fire</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFireModal(false);
                                        setStaffToFire(null);
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Restore Staff Modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Restore Staff Member</h2>
                        <form onSubmit={handleConfirmRestore}>
                            <div className="mb-4">
                                <label className="label">Department</label>
                                <select
                                    className="input"
                                    value={restoreData.department_id}
                                    onChange={(e) => setRestoreData({ ...restoreData, department_id: e.target.value })}
                                >
                                    <option value="">No Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary bg-green-600 hover:bg-green-700 flex-1">Restore</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRestoreModal(false);
                                        setStaffToRestore(null);
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Fired Staff Details Modal */}
            {showFiredDetailsModal && selectedFiredStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-lg w-full">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{selectedFiredStaff.name}</h2>
                            <button
                                onClick={() => setShowFiredDetailsModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                                <p className="text-gray-900">{selectedFiredStaff.role}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Fired Date</h3>
                                <p className="text-gray-900">{new Date(selectedFiredStaff.fired_at).toLocaleString()}</p>
                            </div>

                            {selectedFiredStaff.fired_reason && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                    <h3 className="text-sm font-medium text-red-800 mb-1">Reason for Firing</h3>
                                    <p className="text-red-900">{selectedFiredStaff.fired_reason}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Personality</h3>
                                <p className="text-gray-900">{selectedFiredStaff.personality || 'N/A'}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Expertise</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedFiredStaff.expertise && selectedFiredStaff.expertise.length > 0 ? (
                                        selectedFiredStaff.expertise.map((skill, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">None listed</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowFiredDetailsModal(false);
                                    handleRestoreClick(selectedFiredStaff);
                                }}
                                className="btn-primary bg-green-600 hover:bg-green-700"
                            >
                                Restore Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}