import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../stores/meetingStore';
import { useStaffStore } from '../stores/staffStore';
import { meetingsApi } from '../lib/api';
import Sidebar from '../components/Sidebar';
import ImageUpload from '../components/ImageUpload';
import ActionItemsPanel from '../components/ActionItemsPanel';
import ImageSidebarPanel from '../components/ImageSidebarPanel';
import ChatBubble from '../components/ChatBubble';
import Breadcrumbs from '../components/Breadcrumbs'; // <--- Import this

export default function MeetingRoom() {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const { currentMeeting, messages, selectMeeting, addMessage, updateMessage, endMeeting } =
        useMeetingStore();
    const { staff } = useStaffStore();
    const [inputMessage, setInputMessage] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [showActionItems, setShowActionItems] = useState(false);
    const [imagesRefreshTrigger, setImagesRefreshTrigger] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        selectMeeting(parseInt(meetingId));
    }, [meetingId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Auto-select first participant
        if (currentMeeting?.participants && currentMeeting.participants.length > 0) {
            setSelectedStaffId(currentMeeting.participants[0].staff_id);
        }
    }, [currentMeeting]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedStaffId) return;

        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: 'user',
            sender_name: 'User',
            content: inputMessage,
            created_at: new Date().toISOString(),
        };

        addMessage(userMessage);
        setInputMessage('');
        setIsStreaming(true);

        try {
            const response = await fetch(
                `/api/meetings/${meetingId}/messages?staff_id=${selectedStaffId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: inputMessage,
                        sender_name: 'User',
                    }),
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamedContent = '';

            const selectedStaff = staff.find((s) => s.id === selectedStaffId);

            const staffMessage = {
                id: Date.now() + 1,
                meeting_id: parseInt(meetingId),
                staff_id: selectedStaffId,
                sender_type: 'staff',
                sender_name: selectedStaff?.name || 'Staff',
                content: '',
                created_at: new Date().toISOString(),
            };

            addMessage(staffMessage);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                streamedContent += chunk;
                staffMessage.content = streamedContent;
                updateMessage({ ...staffMessage });
            }

            setIsStreaming(false);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsStreaming(false);
        }
    };

    const handleAskAll = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: 'user',
            sender_name: 'User',
            content: inputMessage,
            created_at: new Date().toISOString(),
        };

        addMessage(userMessage);
        setInputMessage('');
        setIsStreaming(true);

        try {
            const response = await fetch(
                `/api/meetings/${meetingId}/ask-all`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: inputMessage,
                        sender_name: 'User',
                    }),
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let currentStaffName = null;
            let streamedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);

                const staffMatch = chunk.match(/---STAFF:(.+?)---/);
                if (staffMatch) {
                    if (currentStaffName && streamedContent) {
                        const staffMember = staff.find(s => s.name === currentStaffName);
                        const staffMessage = {
                            id: Date.now() + Math.random(),
                            meeting_id: parseInt(meetingId),
                            staff_id: staffMember?.id,
                            sender_type: 'staff',
                            sender_name: currentStaffName,
                            content: streamedContent.trim(),
                            created_at: new Date().toISOString(),
                        };
                        addMessage(staffMessage);
                    }
                    currentStaffName = staffMatch[1];
                    streamedContent = '';
                } else {
                    streamedContent += chunk;
                    if (currentStaffName) {
                        const staffMember = staff.find(s => s.name === currentStaffName);
                        const staffMessage = {
                            id: `temp-${currentStaffName}`,
                            meeting_id: parseInt(meetingId),
                            staff_id: staffMember?.id,
                            sender_type: 'staff',
                            sender_name: currentStaffName,
                            content: streamedContent.trim(),
                            created_at: new Date().toISOString(),
                        };
                        updateMessage(staffMessage);
                    }
                }
            }

            if (currentStaffName && streamedContent) {
                const staffMember = staff.find(s => s.name === currentStaffName);
                const staffMessage = {
                    id: Date.now() + Math.random(),
                    meeting_id: parseInt(meetingId),
                    staff_id: staffMember?.id,
                    sender_type: 'staff',
                    sender_name: currentStaffName,
                    content: streamedContent.trim(),
                    created_at: new Date().toISOString(),
                };
                addMessage(staffMessage);
            }

            setIsStreaming(false);
        } catch (error) {
            console.error('Error asking all:', error);
            setIsStreaming(false);
        }
    };

    const handleImageUpload = async (imageData) => {
        try {
            const response = await meetingsApi.uploadImage(parseInt(meetingId), {
                image_data: imageData,
                description: inputMessage || 'Uploaded image',
            });
            const imageMessage = {
                id: Date.now(),
                meeting_id: parseInt(meetingId),
                sender_type: 'user',
                sender_name: 'User',
                content: `Uploaded image: ${response.data.description || 'No description'}`,
                image_url: response.data.image_url,
                created_at: new Date().toISOString(),
            };
            addMessage(imageMessage);
            setShowImageUpload(false);
            setInputMessage('');
            setImagesRefreshTrigger(Date.now());
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        }
    };

    const handleEndMeeting = async () => {
        if (confirm('Are you sure you want to end this meeting?')) {
            await endMeeting(parseInt(meetingId));
            navigate('/dashboard');
        }
    };

    const participantStaff = currentMeeting?.participants?.map(p =>
        staff.find(s => s.id === p.staff_id)
    ).filter(Boolean) || [];

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 flex flex-col h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-6">
                    {/* Add Breadcrumbs here */}
                    <Breadcrumbs 
                        items={[
                            { label: 'Dashboard', path: '/dashboard' },
                            { label: currentMeeting?.title || 'Meeting' }
                        ]} 
                    />

                    <div className="flex justify-between items-center mt-2">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {currentMeeting?.title}
                            </h1>
                            <p className="text-sm text-gray-600">
                                {currentMeeting?.meeting_type} •{' '}
                                {currentMeeting?.status === 'active' ? (
                                    <span className="text-green-600">Active</span>
                                ) : (
                                    <span className="text-gray-600">Ended</span>
                                )} • {participantStaff.length} participants
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowActionItems(!showActionItems)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {showActionItems ? 'Hide' : 'Show'} Action Items
                            </button>
                            {currentMeeting?.status === 'active' && (
                                <button
                                    onClick={handleEndMeeting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    End Meeting
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Messages Area */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Summary for Ended Meetings */}
                            {currentMeeting?.status === 'ended' && currentMeeting?.summary && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                        <span>📝</span> Meeting Summary
                                    </h3>
                                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {currentMeeting.summary}
                                    </div>
                                </div>
                            )}

                            {messages.map((message, idx) => (
                                <ChatBubble
                                    key={`${message.id}-${idx}`}
                                    message={message}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        {currentMeeting?.status === 'active' && (
                            <div className="bg-white border-t border-gray-200 p-6">
                                {showImageUpload ? (
                                    <div className="mb-4">
                                        <ImageUpload
                                            onImageSelect={(data) => { }}
                                            onUpload={handleImageUpload}
                                        />
                                        <button
                                            onClick={() => setShowImageUpload(false)}
                                            className="btn-secondary w-full mt-2"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="space-y-4">
                                        <div>
                                            <label className="label">Responding Staff Member</label>
                                            <select
                                                className="input"
                                                value={selectedStaffId || ''}
                                                onChange={(e) =>
                                                    setSelectedStaffId(parseInt(e.target.value))
                                                }
                                                required
                                            >
                                                <option value="">Select staff member</option>
                                                {participantStaff.map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.name} - {member.role}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                className="input flex-1"
                                                value={inputMessage}
                                                onChange={(e) => setInputMessage(e.target.value)}
                                                placeholder="Type your message..."
                                                disabled={isStreaming}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowImageUpload(true)}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                disabled={isStreaming}
                                            >
                                                🖼️
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn-primary"
                                                disabled={isStreaming || !selectedStaffId}
                                            >
                                                {isStreaming ? 'Sending...' : 'Send'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAskAll}
                                                className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
                                                disabled={isStreaming || participantStaff.length === 0}
                                            >
                                                Ask All
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
                        <div className="mb-6">
                            <ImageSidebarPanel
                                meetingId={parseInt(meetingId)}
                                isActive={currentMeeting?.status === 'active'}
                                refreshTrigger={imagesRefreshTrigger}
                            />
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                Participants ({participantStaff.length})
                            </h3>
                            <div className="space-y-3">
                                {participantStaff.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                {member.name}
                                            </p>
                                            <p className="text-xs text-gray-600">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {showActionItems && (
                            <ActionItemsPanel
                                meetingId={parseInt(meetingId)}
                                isActive={currentMeeting?.status === 'active'}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}