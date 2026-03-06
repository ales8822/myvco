import { useRef, useEffect, useState } from 'react';
import { Square, FolderCode, Folder, HardDrive, Eye } from 'lucide-react';
import ImageUpload from '../../../components/ImageUpload';
import { systemApi } from '../../../lib/api';
import PromptPreviewModal from './PromptPreviewModal';

export default function MeetingInput({
    meetingId,
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
    handleAutonomousSession,
    handleStopAutonomous,
    handleImageUpload,
    showMentionDropdown,
    filteredMentions,
    selectedMentionIndex,
    handleMentionInput,
    handleMentionKeyDown,
    selectMention,
    fetchPromptPreview,
    handleSendPreviewedMessage
}) {
    const inputRef = useRef(null);
    const [targetPath, setTargetPath] = useState('');
    const [showPathInput, setShowPathInput] = useState(false);
    
    // Browser State - ENSURE THESE ARE PRESENT
    const [showBrowser, setShowBrowser] = useState(false);
    const [currentPath, setCurrentPath] = useState('');
    const [directories, setDirectories] = useState([]);
    const [drives, setDrives] = useState([]);

    // Prompt Preview State
    const [isPromptPreviewOpen, setIsPromptPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);

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

        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + 4; 
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const onKeyDown = (e) => {
        if (handleMentionKeyDown(e, (mention) => {
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

    // --- FOLDER BROWSER LOGIC ---
    const openBrowser = async () => {
        setShowBrowser(true);
        try {
            const drv = await systemApi.getDrives();
            setDrives(drv.data.drives);
            // Load current path or default
            loadDirectory(targetPath || ''); 
        } catch (e) { console.error(e); }
    };

    const loadDirectory = async (path) => {
        try {
            const res = await systemApi.browse(path);
            setCurrentPath(res.data.current_path);
            setDirectories(res.data.directories);
        } catch (error) {
            console.error("Failed to browse", error);
        }
    };

    const handleSelectFolder = () => {
        setTargetPath(currentPath);
        setShowBrowser(false);
    };

    const handlePreviewClick = async () => {
        if (!inputMessage.trim() || !selectedStaffId || isStreaming) return;
        setIsFetchingPreview(true);
        const data = await fetchPromptPreview();
        setIsFetchingPreview(false);
        if (data) {
            setPreviewData(data);
            setIsPromptPreviewOpen(true);
        }
    };

    const handlePreviewSend = async ({ systemPrompt, userContent }) => {
        await handleSendPreviewedMessage(systemPrompt, userContent);
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
                        
                        <button 
                            type="button" 
                            onClick={handlePreviewClick} 
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center relative group" 
                            disabled={isStreaming || !inputMessage.trim() || !selectedStaffId || isFetchingPreview}
                            title="Preview Prompt"
                        >
                            {isFetchingPreview ? (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                        
                        {isStreaming && !showPathInput ? (
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
                            <button type="submit" className="btn-primary" disabled={!selectedStaffId || isStreaming}>Send</button>
                        )}
                        
                        <button type="button" onClick={handleAskAll} className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700" disabled={isStreaming || participantStaff.length === 0}>Ask All</button>

                        {/* Autonomous / File System Group */}
                        <div className="flex items-center relative">
                            {showPathInput && (
                                <div className="absolute bottom-full right-0 mb-2 bg-white p-3 rounded-lg shadow-xl border border-gray-200 flex flex-col gap-2 w-72 animate-in fade-in slide-in-from-bottom-2 z-50">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-gray-700">Target Project Path:</label>
                                        <button 
                                            type="button" 
                                            onClick={openBrowser}
                                            className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-blue-600 flex items-center gap-1"
                                        >
                                            <Folder size={10} /> Browse
                                        </button>
                                    </div>
                                    <input 
                                        type="text"
                                        className="input text-xs py-1 px-2"
                                        placeholder="C:\Projects\MyApp..."
                                        value={targetPath}
                                        onChange={(e) => setTargetPath(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="text-[10px] text-gray-400">⚠️ Agents will have R/W access here.</div>
                                    
                                    {/* Standard Stop Button - REPLACES Send button when streaming */}
                                    {isStreaming ? (
                                        <button
                                            type="button"
                                            onClick={handleStopAutonomous} // Use new stop handler
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                            title="Stop Autonomous Session"
                                        >
                                            <Square size={16} fill="currentColor" />
                                            Stop
                                        </button>
                                    ) : (
                                        <button type="submit" className="btn-primary" disabled={!selectedStaffId}>Send</button>
                                    )}
                                </div>
                            )}
                            
                            {/* Folder Browser Modal */}
                            {showBrowser && (
                                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
                                    <div className="bg-white rounded-lg w-96 max-h-[80vh] flex flex-col shadow-2xl">
                                        <div className="p-3 border-b border-gray-200 font-bold bg-gray-50 flex justify-between items-center">
                                            <span>Select Folder</span>
                                            <button onClick={() => setShowBrowser(false)} className="text-gray-500">✕</button>
                                        </div>
                                        <div className="p-2 bg-gray-100 text-xs font-mono break-all border-b border-gray-200">
                                            {currentPath}
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2">
                                            <div className="mb-2 flex flex-wrap gap-2">
                                                {drives.map(d => (
                                                    <button key={d} onClick={() => loadDirectory(d)} className="px-2 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300 flex items-center gap-1">
                                                        <HardDrive size={12} /> {d}
                                                    </button>
                                                ))}
                                            </div>
                                            <button onClick={() => loadDirectory(currentPath + '/..')} className="w-full text-left px-2 py-1.5 hover:bg-blue-50 rounded text-sm text-blue-600 mb-1">
                                                📁 .. (Up)
                                            </button>
                                            {directories.map(dir => (
                                                <button 
                                                    key={dir} 
                                                    onClick={() => loadDirectory(currentPath + (currentPath.endsWith(window.navigator.platform.includes("Win") ? "\\" : "/") ? "" : (window.navigator.platform.includes("Win") ? "\\" : "/")) + dir)}
                                                    className="w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                                                >
                                                    <Folder size={14} className="text-yellow-500" /> {dir}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-3 border-t border-gray-200 flex justify-end gap-2">
                                            <button onClick={() => setShowBrowser(false)} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                            <button onClick={handleSelectFolder} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Select Current</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button 
                                type="button" 
                                onClick={(e) => {
                                    if (!showPathInput && !e.shiftKey) {
                                        setShowPathInput(true);
                                    } else {
                                        if (!isStreaming) {
                                            handleAutonomousSession(targetPath); 
                                            setShowPathInput(false);
                                        }
                                    }
                                }} 
                                className={`px-4 py-2 text-white rounded-lg flex items-center gap-1 transition-colors ${showPathInput ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                disabled={participantStaff.length < 1}
                                title="Start Autonomous Round Table. Click to set path."
                            >
                                {showPathInput ? <span>🚀 GO</span> : <><FolderCode size={16} /> Auto</>}
                            </button>
                        </div>

                    </div>
                </form>
            )}
            
            <PromptPreviewModal
                isOpen={isPromptPreviewOpen}
                onClose={() => setIsPromptPreviewOpen(false)}
                previewData={previewData}
                onSend={handlePreviewSend}
                isStreaming={isStreaming}
                meetingId={meetingId}
                staffId={selectedStaffId}
            />
        </div>
    );
}