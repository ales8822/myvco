import { useRef, useEffect } from 'react';
import { Square } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';

export default function MeetingInput({
    inputMessage,
    setInputMessage,
    selectedStaffId,
    setSelectedStaffId,
    participantStaff,
    isStreaming,
    showImageUpload,
    setShowImageUpload,
    handleSendMessage,
    handleStopGeneration,
    handleAskAll,
    handleImageUpload,
    // Mentions props
    showMentionDropdown,
    filteredMentions,
    selectedMentionIndex,
    handleMentionInput,
    handleMentionKeyDown,
    selectMention
}) {
    const inputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
    }, [inputMessage]);

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

    const onKeyDown = (e) => {
        // Handle mention navigation first
        if (handleMentionKeyDown(e, (mention) => {
            // Need to calculate cursor position for replacement
            // This logic was inside selectMention in original file
            // We'll assume the parent component handles the actual text replacement logic
            // But wait, selectMention needs the inputRef to set cursor position.
            // Let's pass the ref or handle it here.

            // Actually, let's keep the selectMention logic in the parent or hook, 
            // but we need the inputRef there. 
            // Alternatively, we pass a callback that takes the mention and the inputRef.
            selectMention(mention, inputRef);
        })) return;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const onInputChange = (e) => {
        handleMentionInput(e, inputMessage, setInputMessage);
    };

    return (
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
                                        onClick={() => selectMention(mention, inputRef)}
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
                            onChange={onInputChange}
                            onKeyDown={onKeyDown}
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
    );
}
