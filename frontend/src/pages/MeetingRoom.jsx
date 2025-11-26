// frontend\src\pages\MeetingRoom.jsx
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
import ThinkingBubble from '../components/ThinkingBubble';
import Breadcrumbs from '../components/Breadcrumbs';
import ReactMarkdown from 'react-markdown'; // Import Markdown
import remarkGfm from 'remark-gfm'; // Import GFM

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
    // End Meeting Modal State
    const [showEndModal, setShowEndModal] = useState(false);
    const [providers, setProviders] = useState(null);
    const [summaryConfig, setSummaryConfig] = useState({
        provider: 'gemini',
        model: ''
    });
    const [isEnding, setIsEnding] = useState(false);

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

        // Add temporary thinking message
        const thinkingMessageId = `thinking-${Date.now()}`;
        const selectedStaff = staff.find((s) => s.id === selectedStaffId);
        const thinkingMessage = {
            id: thinkingMessageId,
            meeting_id: parseInt(meetingId),
            staff_id: selectedStaffId,
            sender_type: 'staff',
            sender_name: selectedStaff?.name || 'Staff',
            content: '',
            isThinking: true,
            created_at: new Date().toISOString(),
        };
        addMessage(thinkingMessage);

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
            let isFirstChunk = true;

            const staffMessage = {
                id: Date.now() + 1,
                meeting_id: parseInt(meetingId),
                staff_id: selectedStaffId,
                sender_type: 'staff',
                sender_name: selectedStaff?.name || 'Staff',
                content: '',
                created_at: new Date().toISOString(),
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                streamedContent += chunk;
                staffMessage.content = streamedContent;

                if (isFirstChunk) {
                    updateMessage({ ...staffMessage, id: thinkingMessageId, isThinking: false });
                    isFirstChunk = false;
                } else {
                    updateMessage({ ...staffMessage, id: thinkingMessageId });
                }
            }

            setIsStreaming(false);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsStreaming(false);
        }
    };

    const handleAskAll = async () => {
        if (!inputMessage.trim()) return;

        // 1. Display User Message
        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: 'user',
            sender_name: 'User',
            content: inputMessage,
            created_at: new Date().toISOString(),
        };
        addMessage(userMessage);
        const messageToSend = inputMessage; // Store locally before clearing state
        setInputMessage('');
        setIsStreaming(true);

        // 2. Identify participants
        const participants = staff.filter(s => 
            currentMeeting?.participants?.some(p => p.staff_id === s.id)
        );

        if (participants.length === 0) {
            setIsStreaming(false);
            return;
        }

        // 3. Create thinking bubbles for everyone immediately
        const thinkingIds = {};
        participants.forEach(member => {
            const thinkingId = `thinking-${member.id}-${Date.now()}`;
            thinkingIds[member.id] = thinkingId;
            addMessage({
                id: thinkingId,
                meeting_id: parseInt(meetingId),
                staff_id: member.id,
                sender_type: 'staff',
                sender_name: member.name,
                content: '',
                isThinking: true,
                created_at: new Date().toISOString(),
            });
        });

        // 4. Function to fetch response for a single staff member
        const fetchStaffResponse = async (member, index) => {
            try {
                // Only the first request saves the user message to the DB to avoid duplicates
                // All agents still receive the 'content' in the request body so they know what to reply to.
                const saveUserMsg = index === 0; 
                
                const response = await fetch(
                    `/api/meetings/${meetingId}/messages?staff_id=${member.id}&save_user_message=${saveUserMsg}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            content: messageToSend, 
                            sender_name: 'User' 
                        }),
                    }
                );

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let streamedContent = '';
                let isFirstChunk = true;
                const thinkingId = thinkingIds[member.id];

                const staffMessage = {
                    id: Date.now() + Math.random(), // New permanent ID
                    meeting_id: parseInt(meetingId),
                    staff_id: member.id,
                    sender_type: 'staff',
                    sender_name: member.name,
                    content: '',
                    created_at: new Date().toISOString(),
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    streamedContent += chunk;
                    staffMessage.content = streamedContent;

                    // On first chunk, replace the "Thinking" bubble with the real message bubble
                    if (isFirstChunk) {
                        updateMessage({ ...staffMessage, id: thinkingId, isThinking: false });
                        isFirstChunk = false;
                    } else {
                        // Update content continuously
                        updateMessage({ ...staffMessage, id: thinkingId });
                    }
                }
            } catch (error) {
                console.error(`Error fetching response for ${member.name}:`, error);
            }
        };

        // 5. Fire requests IN PARALLEL (Concurrency)
        // map() creates an array of promises, Promise.all waits for them to finish
        await Promise.all(participants.map((member, index) => fetchStaffResponse(member, index)));

        setIsStreaming(false);
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
            // This is the new function that uses the API with config
            const confirmEndMeeting = async () => {
                setIsEnding(true);
                await endMeeting(parseInt(meetingId), summaryConfig);
                setIsEnding(false);
                setShowEndModal(false);
                navigate('/dashboard');
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
                            {/* Breadcrumbs */}
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
                                        <button onClick={() => setShowEndModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">End Meeting</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Messages Area */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {/* Summary for Ended Meetings - NOW WITH MARKDOWN */}
                                    {currentMeeting?.status === 'ended' && currentMeeting?.summary && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6 shadow-sm">
                                            <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                                <span>📝</span> Meeting Summary
                                            </h3>
                                            <div className="prose prose-sm max-w-none text-gray-800">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4" {...props} />,
                                                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-2" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2" {...props} />,
                                                    }}
                                                >
                                                    {currentMeeting.summary}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((message, idx) => (
                                        message.isThinking ? (
                                            <ThinkingBubble key={`${message.id}-${idx}`} />
                                        ) : (
                                            <ChatBubble
                                                key={`${message.id}-${idx}`}
                                                message={message}
                                            />
                                        )
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
                    {/* End Meeting Modal */}
                    {showEndModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-xl p-8 max-w-md w-full">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">End Meeting & Generate Summary</h2>
                                <p className="text-gray-600 mb-6">Choose the intelligence that will generate your meeting summary.</p>

                                <div className="mb-4">
                                    <label className="label">LLM Provider</label>
                                    <select
                                        className="input"
                                        value={summaryConfig.provider}
                                        onChange={(e) => setSummaryConfig({ ...summaryConfig, provider: e.target.value })}
                                    >
                                        <option value="gemini">Gemini</option>
                                        <option value="ollama">Ollama</option>
                                    </select>
                                </div>

                                {summaryConfig.provider === 'ollama' && providers?.ollama_models && (
                                    <div className="mb-6">
                                        <label className="label">Model</label>
                                        <select
                                            className="input"
                                            value={summaryConfig.model}
                                            onChange={(e) => setSummaryConfig({ ...summaryConfig, model: e.target.value })}
                                        >
                                            <option value="">Default Model</option>
                                            {providers.ollama_models.map(model => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={confirmEndMeeting}
                                        className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                                        disabled={isEnding}
                                    >
                                        {isEnding ? 'Generating Summary...' : 'Confirm End Meeting'}
                                    </button>
                                    <button
                                        onClick={() => setShowEndModal(false)}
                                        className="btn-secondary flex-1"
                                        disabled={isEnding}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
