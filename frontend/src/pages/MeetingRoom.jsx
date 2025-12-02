import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../stores/meetingStore';
import { useStaffStore } from '../stores/staffStore';
import { meetingsApi, llmApi, assetsApi } from '../lib/api';
import Sidebar from '../components/Sidebar';
import ImageUpload from '../components/ImageUpload';
import ActionItemsPanel from '../components/ActionItemsPanel';
import ImageSidebarPanel from '../components/ImageSidebarPanel';
import ChatBubble from '../components/ChatBubble';
import ThinkingBubble from '../components/ThinkingBubble';
import Breadcrumbs from '../components/Breadcrumbs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Square } from 'lucide-react';

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

    // Autocomplete State
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionCursorIndex, setMentionCursorIndex] = useState(-1);
    const [availableMentions, setAvailableMentions] = useState([]);
    const [filteredMentions, setFilteredMentions] = useState([]);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

    // End Meeting Modal State
    const [showEndModal, setShowEndModal] = useState(false);
    const [providers, setProviders] = useState(null);
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [summaryConfig, setSummaryConfig] = useState({
        provider: 'gemini',
        model: ''
    });
    const [isEnding, setIsEnding] = useState(false);

    const [thinkingStaff, setThinkingStaff] = useState([]);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const currentStreamingMessageIdRef = useRef(null);

    // Load Meeting Data
    useEffect(() => {
        if (meetingId) {
            selectMeeting(parseInt(meetingId));
        }
    }, [meetingId]);

    const loadMentions = async () => {
        try {
            // Fetch images
            const imagesRes = await meetingsApi.getImages(meetingId);

            let assetsRes = { data: [] };
            // Fetch assets if company_id is available
            if (currentMeeting?.company_id) {
                assetsRes = await assetsApi.list(currentMeeting.company_id);
            }

            const mentions = [];

            // Process Meeting Images
            if (imagesRes.data) {
                imagesRes.data.forEach((img, index) => {
                    const label = `img${img.display_order || (index + 1)}`;
                    mentions.push({
                        id: `meeting-img-${img.id}`,
                        label: label,
                        display: `@${label}`,
                        type: 'image',
                        url: `http://localhost:8001${img.image_url}`,
                        description: img.description
                    });
                });
            }

            // Process Company Assets
            if (assetsRes.data) {
                assetsRes.data.forEach(asset => {
                    mentions.push({
                        id: `asset-${asset.id}`,
                        label: asset.asset_name,
                        display: `@${asset.asset_name}`,
                        type: 'asset',
                        url: asset.asset_type === 'image' ? `http://localhost:8001/${asset.file_path}` : null,
                        description: asset.display_name
                    });
                });
            }

            setAvailableMentions(mentions);
        } catch (error) {
            console.error("Error loading mentions:", error);
        }
    };

    // Reload mentions when meetingId, refreshTrigger, or currentMeeting.company_id changes
    useEffect(() => {
        loadMentions();
    }, [meetingId, imagesRefreshTrigger, currentMeeting?.company_id]);

    // Load Providers on Mount
    useEffect(() => {
        if (!providers) {
            loadProviders();
        }
    }, []);

    const loadProviders = async (force = false) => {
        if (isLoadingProviders) return;
        if (providers && !force) return;

        setIsLoadingProviders(true);
        try {
            const response = await llmApi.getProviders();
            setProviders(response.data);
        } catch (error) {
            console.error('Error loading providers:', error);
        } finally {
            setIsLoadingProviders(false);
        }
    };

    // Smart Scroll Logic
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const lastMessage = messages[messages.length - 1];
        const isUserMessage = lastMessage?.sender_type === 'user';

        const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const wasAtBottom = distanceToBottom < 200;

        if (isUserMessage || wasAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, thinkingStaff.length]);

    useEffect(() => {
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

        const thinkingMessageId = `thinking-${Date.now()}`;
        currentStreamingMessageIdRef.current = thinkingMessageId;
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

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(
                `/api/meetings/${meetingId}/messages?staff_id=${selectedStaffId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: inputMessage, sender_name: 'User' }),
                    signal: abortControllerRef.current.signal,
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
            currentStreamingMessageIdRef.current = null;
            setImagesRefreshTrigger(Date.now());
        } catch (error) {
            if (error.name === 'AbortError') {
                // Remove the partial message from UI
                const updatedMessages = messages.filter(m => m.id !== thinkingMessageId);
                // Force re-render by updating the store
                selectMeeting(parseInt(meetingId));
            } else {
                console.error('Error sending message:', error);
            }
            setIsStreaming(false);
            currentStreamingMessageIdRef.current = null;
        }
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    const handleResendMessage = async (messageId) => {
        if (!selectedStaffId) {
            toast.error('Please select a staff member');
            return;
        }

        setIsStreaming(true);
        const thinkingMessageId = `thinking-${Date.now()}`;
        currentStreamingMessageIdRef.current = thinkingMessageId;
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

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(
                `/api/meetings/messages/${messageId}/resend?staff_id=${selectedStaffId}`,
                {
                    method: 'POST',
                    signal: abortControllerRef.current.signal,
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

            // Refresh messages to get the updated list after cascade delete
            await selectMeeting(parseInt(meetingId));
            setIsStreaming(false);
            currentStreamingMessageIdRef.current = null;
            setImagesRefreshTrigger(Date.now());
            toast.success('Message resent successfully');
        } catch (error) {
            if (error.name === 'AbortError') {
                selectMeeting(parseInt(meetingId));
            } else {
                console.error('Error resending message:', error);
                toast.error('Failed to resend message');
            }
            setIsStreaming(false);
            currentStreamingMessageIdRef.current = null;
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
        const messageToSend = inputMessage;
        setInputMessage('');
        setIsStreaming(true);

        const participants = staff.filter(s =>
            currentMeeting?.participants?.some(p => p.staff_id === s.id)
        );

        if (participants.length === 0) {
            setIsStreaming(false);
            return;
        }

        setThinkingStaff(participants);

        const fetchStaffResponse = async (member, index) => {
            try {
                const saveUserMsg = index === 0;
                const response = await fetch(
                    `/api/meetings/${meetingId}/messages?staff_id=${member.id}&save_user_message=${saveUserMsg}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: messageToSend, sender_name: 'User' }),
                    }
                );

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let streamedContent = '';
                let isFirstChunk = true;

                const staffMessage = {
                    id: Date.now() + Math.random(),
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

                    if (isFirstChunk) {
                        setThinkingStaff(prev => prev.filter(p => p.id !== member.id));
                        addMessage(staffMessage);
                        isFirstChunk = false;
                    } else {
                        updateMessage({ ...staffMessage });
                    }
                }
            } catch (error) {
                console.error(`Error fetching response for ${member.name}:`, error);
                setThinkingStaff(prev => prev.filter(p => p.id !== member.id));
            }
        };

        await Promise.all(participants.map((member, index) => fetchStaffResponse(member, index)));
        setIsStreaming(false);
        setImagesRefreshTrigger(Date.now());
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

    const confirmEndMeeting = async () => {
        setIsEnding(true);
        await endMeeting(parseInt(meetingId), summaryConfig);
        setIsEnding(false);
        setShowEndModal(false);
        navigate('/dashboard');
    };

    const handleProviderChange = (e) => {
        const newProvider = e.target.value;
        let newModel = '';

        if (newProvider === 'ollama') {
            if (providers?.ollama_models && providers.ollama_models.length > 0) {
                newModel = providers.ollama_models[0];
            }
        }

        setSummaryConfig({ provider: newProvider, model: newModel });
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputMessage(newValue);

        const cursorIndex = e.target.selectionStart;

        // Check if we are currently typing a mention
        const textBeforeCursor = newValue.slice(0, cursorIndex);
        const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtSymbolIndex !== -1) {
            const query = textBeforeCursor.slice(lastAtSymbolIndex + 1);

            // Only allow simple queries without spaces for now
            if (!query.includes(' ')) {
                setMentionQuery(query);
                setMentionCursorIndex(lastAtSymbolIndex);
                setShowMentionDropdown(true);

                // Filter mentions
                const filtered = availableMentions.filter(m =>
                    m.label.toLowerCase().includes(query.toLowerCase()) ||
                    m.display.toLowerCase().includes(query.toLowerCase())
                );
                setFilteredMentions(filtered);
                setSelectedMentionIndex(0);
                return;
            }
        }

        setShowMentionDropdown(false);
    };

    const handleKeyDown = (e) => {
        if (showMentionDropdown && filteredMentions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedMentionIndex(prev => (prev + 1) % filteredMentions.length);
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedMentionIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
                return;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectMention(filteredMentions[selectedMentionIndex]);
                return;
            } else if (e.key === 'Escape') {
                setShowMentionDropdown(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const insertCodeBlock = () => {
        const textarea = inputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = inputMessage;
        const before = text.substring(0, start);
        const after = text.substring(end);

        const newText = `${before}\`\`\`\n\n\`\`\`${after}`;
        setInputMessage(newText);

        // Set cursor position inside the code block
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + 4; // Position after ```\n
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
    }, [inputMessage]);

    const selectMention = (mention) => {
        const textBeforeAt = inputMessage.slice(0, mentionCursorIndex);
        const textAfterCursor = inputMessage.slice(inputRef.current.selectionStart);

        const newValue = `${textBeforeAt}${mention.display} ${textAfterCursor}`;
        setInputMessage(newValue);
        setShowMentionDropdown(false);

        // Restore focus and set cursor position
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newCursorPos = textBeforeAt.length + mention.display.length + 1;
                inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const handleInsertMention = (mentionText) => {
        setInputMessage(prev => prev + (prev ? ' ' : '') + mentionText + ' ');
    };

    const participantStaff = currentMeeting?.participants?.map(p =>
        staff.find(s => s.id === p.staff_id)
    ).filter(Boolean) || [];

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 flex flex-col h-screen bg-gray-50">
                <div className="bg-white border-b border-gray-200 p-6">
                    <Breadcrumbs items={[{ label: 'Dashboard', path: '/dashboard' }, { label: currentMeeting?.title || 'Meeting' }]} />
                    <div className="flex justify-between items-center mt-2">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{currentMeeting?.title}</h1>
                            <p className="text-sm text-gray-600">{currentMeeting?.meeting_type} • {currentMeeting?.status === 'active' ? <span className="text-green-600">Active</span> : <span className="text-gray-600">Ended</span>} • {participantStaff.length} participants</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowActionItems(!showActionItems)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{showActionItems ? 'Hide' : 'Show'} Action Items</button>
                            {currentMeeting?.status === 'active' && (
                                <button
                                    onClick={() => {
                                        loadProviders(true);
                                        setShowEndModal(true);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    End Meeting
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col">
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {currentMeeting?.status === 'ended' && currentMeeting?.summary && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2"><span>📝</span> Meeting Summary</h3>
                                    <div className="prose prose-sm max-w-none text-gray-800">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ul: ({ node, ...props }) => <ul className="list-disc ml-4" {...props} />, ol: ({ node, ...props }) => <ol className="list-decimal ml-4" {...props} />, h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-2" {...props} />, h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2" {...props} /> }}>{currentMeeting.summary}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                            {messages.map((message, idx) => {
                                const participantInfo = currentMeeting?.participants?.find(
                                    p => p.staff_id === message.staff_id
                                );
                                return (
                                    <ChatBubble
                                        key={`${message.id}-${idx}`}
                                        message={message}
                                        participantInfo={participantInfo}
                                        onResend={handleResendMessage}
                                    />
                                );
                            })}

                            {thinkingStaff.map((member) => (
                                <div key={`thinking-${member.id}`} className="flex justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                        <div className="text-xs opacity-70 mb-1">
                                            <span className="font-medium">{member.name}</span> is thinking...
                                        </div>
                                        <div className="flex gap-1 mt-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {currentMeeting?.status === 'active' && (
                            <div className="bg-white border-t border-gray-200 p-6 relative">
                                {showImageUpload ? (
                                    <div className="mb-4">
                                        <ImageUpload onImageSelect={() => { }} onUpload={handleImageUpload} />
                                        <button onClick={() => setShowImageUpload(false)} className="btn-secondary w-full mt-2">Cancel</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="space-y-4">
                                        <div>
                                            <label className="label">Responding Staff Member</label>
                                            <select className="input" value={selectedStaffId || ''} onChange={(e) => setSelectedStaffId(parseInt(e.target.value))} required>
                                                <option value="">Select staff member</option>
                                                {participantStaff.map((member) => <option key={member.id} value={member.id}>{member.name} - {member.role}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex gap-3 relative items-end">
                                            {/* Autocomplete Dropdown */}
                                            {showMentionDropdown && filteredMentions.length > 0 && (
                                                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                                    {filteredMentions.map((mention, index) => (
                                                        <div
                                                            key={mention.id}
                                                            className={`p-2 flex items-center gap-2 cursor-pointer ${index === selectedMentionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                                            onClick={() => selectMention(mention)}
                                                        >
                                                            <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                                                {mention.type === 'image' || (mention.type === 'asset' && mention.url) ? (
                                                                    <img src={mention.url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-xs">📄</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm text-gray-900 truncate">{mention.display}</div>
                                                                {mention.description && <div className="text-xs text-gray-500 truncate">{mention.description}</div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <textarea
                                                ref={inputRef}
                                                className="input flex-1 min-h-[44px] max-h-48 py-2 resize-none overflow-y-auto"
                                                value={inputMessage}
                                                onChange={handleInputChange}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Type your message... Shift+Enter for new line"
                                                disabled={isStreaming}
                                                rows={1}
                                            />
                                            <button
                                                type="button"
                                                onClick={insertCodeBlock}
                                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 border border-gray-200 font-mono text-sm font-bold"
                                                disabled={isStreaming}
                                                title="Insert Code Block"
                                            >
                                                &lt;/&gt;
                                            </button>
                                            <button type="button" onClick={() => setShowImageUpload(true)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300" disabled={isStreaming}>🖼️</button>
                                            {isStreaming ? (
                                                <button
                                                    type="button"
                                                    onClick={handleStopGeneration}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                                    title="Stop Generation"
                                                >
                                                    <Square size={16} fill="currentColor" />
                                                    Stop
                                                </button>
                                            ) : (
                                                <button type="submit" className="btn-primary" disabled={!selectedStaffId}>Send</button>
                                            )}
                                            <button type="button" onClick={handleAskAll} className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700" disabled={isStreaming || participantStaff.length === 0}>Ask All</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
                        <div className="mb-6"><ImageSidebarPanel meetingId={parseInt(meetingId)} companyId={currentMeeting?.company_id} isActive={currentMeeting?.status === 'active'} refreshTrigger={imagesRefreshTrigger} onInsertMention={handleInsertMention} /></div>
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Participants ({participantStaff.length})</h3>
                            <div className="space-y-3">
                                {participantStaff.map((member) => {
                                    const participantInfo = currentMeeting?.participants?.find(
                                        p => p.staff_id === member.id
                                    );
                                    return (
                                        <div key={member.id} className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-white">{member.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
                                                <p className="text-xs text-gray-600 truncate">{member.role}</p>
                                                {participantInfo?.department_name && (
                                                    <p className="text-xs text-gray-500 truncate">📂 {participantInfo.department_name}</p>
                                                )}
                                                <p className="text-xs text-gray-500 truncate">
                                                    🤖 {participantInfo?.llm_provider === 'ollama' && participantInfo?.llm_model
                                                        ? participantInfo.llm_model
                                                        : participantInfo?.llm_provider || 'gemini'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {showActionItems && <ActionItemsPanel meetingId={parseInt(meetingId)} isActive={currentMeeting?.status === 'active'} />}
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
                                onChange={handleProviderChange}
                            >
                                <option value="gemini">Gemini</option>
                                <option value="ollama">Ollama</option>
                            </select>
                        </div>

                        {summaryConfig.provider === 'ollama' && (
                            <div className="mb-6">
                                <label className="label">Model</label>
                                {isLoadingProviders ? (
                                    <div className="text-sm text-gray-600 flex items-center gap-2 py-2">
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                        Fetching available models...
                                    </div>
                                ) : providers?.ollama_models && providers.ollama_models.length > 0 ? (
                                    <select
                                        className="input"
                                        value={summaryConfig.model}
                                        onChange={(e) => setSummaryConfig({ ...summaryConfig, model: e.target.value })}
                                    >
                                        <option value="">Select a model...</option>
                                        {providers.ollama_models.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                                        <p className="font-medium">⚠️ No models found</p>
                                        <p className="mt-1">Is Ollama running? Check your connection.</p>
                                        <button
                                            onClick={loadProviders}
                                            className="mt-2 text-red-700 underline hover:text-red-800 text-xs"
                                        >
                                            Retry Fetching Models
                                        </button>
                                    </div>
                                )}
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