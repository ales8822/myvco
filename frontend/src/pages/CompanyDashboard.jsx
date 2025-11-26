// frontend\src\pages\CompanyDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { useStaffStore } from '../stores/staffStore';
import { useMeetingStore } from '../stores/meetingStore';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import { llmApi } from '../lib/api';

export default function CompanyDashboard() {
    const navigate = useNavigate();
    const { currentCompany } = useCompanyStore();
    const { staff, fetchStaff } = useStaffStore();
    const { meetings, fetchMeetings, createMeeting, deleteMeeting } = useMeetingStore();
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    
    // LLM State
    const [providers, setProviders] = useState(null);
    
    // Meeting Form State
    const [meetingForm, setMeetingForm] = useState({
        title: '',
        meeting_type: 'general',
        participants: [], // Array of { staff_id, llm_provider, llm_model }
    });

    useEffect(() => {
        if (currentCompany) {
            fetchStaff(currentCompany.id);
            fetchMeetings(currentCompany.id);
        }
        loadProviders();
    }, [currentCompany]);

    const loadProviders = async () => {
        try {
            const response = await llmApi.getProviders();
            setProviders(response.data);
        } catch (error) {
            console.error('Error loading providers:', error);
        }
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

    // Toggle participant selection and initialize default config
    const handleParticipantToggle = (staffId) => {
        const isSelected = meetingForm.participants.find(p => p.staff_id === staffId);
        
        if (isSelected) {
            // Remove
            setMeetingForm({
                ...meetingForm,
                participants: meetingForm.participants.filter(p => p.staff_id !== staffId)
            });
        } else {
            // Add with default config
            setMeetingForm({
                ...meetingForm,
                participants: [
                    ...meetingForm.participants,
                    { 
                        staff_id: staffId, 
                        llm_provider: 'gemini', 
                        llm_model: '' 
                    }
                ]
            });
        }
    };

    // Update config for a specific participant
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
                                    <p className="text-sm text-gray-600 mb-1">Staff Members</p>
                                    <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">👥</span>
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

                    {/* Quick Actions */}
                    <div className="card mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="flex gap-4">
                            <button onClick={() => navigate('/staff')} className="btn-primary">👥 Hire Staff</button>
                            <button onClick={() => setShowMeetingModal(true)} className="btn-primary">💬 Start Meeting</button>
                            <button onClick={() => navigate('/knowledge')} className="btn-secondary">📚 Add Knowledge</button>
                        </div>
                    </div>

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
        </div>
    );
}
