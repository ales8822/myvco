import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../stores/meetingStore';
import { useStaffStore } from '../stores/staffStore';
import { meetingsApi } from '../lib/api';
import Sidebar from '../components/Sidebar';

// Features
import MeetingHeader from '../features/meeting/components/MeetingHeader';
import MeetingSidebar from '../features/meeting/components/MeetingSidebar';
import MeetingInput from '../features/meeting/components/MeetingInput';
import MeetingChatList from '../features/meeting/components/MeetingChatList';

// Hooks
import { useMentions } from '../features/meeting/hooks/useMentions';
import { useMeetingChat } from '../features/meeting/hooks/useMeetingChat';
import { useMeetingScroll } from '../features/meeting/hooks/useMeetingScroll';
import { useMeetingProviders } from '../features/meeting/hooks/useMeetingProviders';

export default function MeetingRoom() {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const { currentMeeting, messages, selectMeeting, endMeeting } = useMeetingStore();
    const { staff } = useStaffStore();

    // Local UI State
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [showActionItems, setShowActionItems] = useState(false);
    const [imagesRefreshTrigger, setImagesRefreshTrigger] = useState(0);
    const [showEndModal, setShowEndModal] = useState(false);
    const [summaryConfig, setSummaryConfig] = useState({
        provider: 'gemini',
        model: ''
    });
    const [isEnding, setIsEnding] = useState(false);

    // Derived State
    const participantStaff = currentMeeting?.participants?.map(p =>
        staff.find(s => s.id === p.staff_id)
    ).filter(Boolean) || [];

    // Custom Hooks
    const {
        availableMentions,
        filteredMentions,
        showMentionDropdown,
        setShowMentionDropdown,
        mentionQuery,
        mentionCursorIndex,
        selectedMentionIndex,
        handleMentionInput,
        handleMentionKeyDown
    } = useMentions(meetingId, currentMeeting, imagesRefreshTrigger);

    const {
        inputMessage,
        setInputMessage,
        selectedStaffId,
        setSelectedStaffId,
        isStreaming,
        thinkingStaff,
        handleSendMessage,
        handleStopGeneration,
        handleResendMessage,
        handleAskAll
    } = useMeetingChat(meetingId, currentMeeting, setImagesRefreshTrigger);

    const { messagesEndRef, chatContainerRef } = useMeetingScroll(messages, thinkingStaff);
    const { providers, isLoadingProviders, loadProviders } = useMeetingProviders();

    // Effects
    useEffect(() => {
        if (meetingId) {
            selectMeeting(parseInt(meetingId));
        }
    }, [meetingId]);

    useEffect(() => {
        if (currentMeeting?.participants && currentMeeting.participants.length > 0) {
            setSelectedStaffId(currentMeeting.participants[0].staff_id);
        }
    }, [currentMeeting]);

    // Handlers
    const handleImageUpload = async (imageData) => {
        try {
            const response = await meetingsApi.uploadImage(parseInt(meetingId), {
                image_data: imageData,
                description: inputMessage || 'Uploaded image',
            });
            // Refresh to get the new message
            await selectMeeting(parseInt(meetingId));

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

    const selectMention = (mention, inputRef) => {
        if (!inputRef.current) return;

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

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 flex flex-col h-screen bg-gray-50">
                <MeetingHeader
                    currentMeeting={currentMeeting}
                    participantStaff={participantStaff}
                    showActionItems={showActionItems}
                    setShowActionItems={setShowActionItems}
                    onEndMeetingClick={() => {
                        loadProviders(true);
                        setShowEndModal(true);
                    }}
                />

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col">
                        <MeetingChatList
                            messages={messages}
                            currentMeeting={currentMeeting}
                            thinkingStaff={thinkingStaff}
                            handleResendMessage={handleResendMessage}
                            messagesEndRef={messagesEndRef}
                            chatContainerRef={chatContainerRef}
                        />

                        {currentMeeting?.status === 'active' && (
                            <MeetingInput
                                inputMessage={inputMessage}
                                setInputMessage={setInputMessage}
                                selectedStaffId={selectedStaffId}
                                setSelectedStaffId={setSelectedStaffId}
                                participantStaff={participantStaff}
                                isStreaming={isStreaming}
                                showImageUpload={showImageUpload}
                                setShowImageUpload={setShowImageUpload}
                                handleSendMessage={handleSendMessage}
                                handleStopGeneration={handleStopGeneration}
                                handleAskAll={handleAskAll}
                                handleImageUpload={handleImageUpload}
                                showMentionDropdown={showMentionDropdown}
                                filteredMentions={filteredMentions}
                                selectedMentionIndex={selectedMentionIndex}
                                handleMentionInput={handleMentionInput}
                                handleMentionKeyDown={handleMentionKeyDown}
                                selectMention={selectMention}
                            />
                        )}
                    </div>

                    <MeetingSidebar
                        meetingId={meetingId}
                        currentMeeting={currentMeeting}
                        participantStaff={participantStaff}
                        imagesRefreshTrigger={imagesRefreshTrigger}
                        onInsertMention={handleInsertMention}
                        showActionItems={showActionItems}
                    />
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
                                        {providers.ollama_models.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-red-600 text-sm py-2">No Ollama models found</div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowEndModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                disabled={isEnding}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEndMeeting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                disabled={isEnding || (summaryConfig.provider === 'ollama' && !summaryConfig.model)}
                            >
                                {isEnding ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Ending...
                                    </>
                                ) : (
                                    'End Meeting'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}