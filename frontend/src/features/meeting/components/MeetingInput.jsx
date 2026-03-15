// MeetingInput.jsx
import { useRef, useEffect, useState } from "react";
import { Square, FolderCode, Folder, HardDrive, Eye } from "lucide-react";
import ImageUpload from "../../../components/ImageUpload";
import { systemApi } from "../../../lib/api";
import PromptPreviewModal from "./PromptPreviewModal";

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
  handleSendPreviewedMessage,
}) {
  const inputRef = useRef(null);
  const [targetPath, setTargetPath] = useState("");
  const [showPathInput, setShowPathInput] = useState(false);

  // Browser State - ENSURE THESE ARE PRESENT
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [directories, setDirectories] = useState([]);
  const [drives, setDrives] = useState([]);

  // Prompt Preview State
  const [isPromptPreviewOpen, setIsPromptPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
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
    if (
      handleMentionKeyDown(e, (mention) => {
        selectMention(mention, inputRef);
      })
    )
      return;

    if (e.key === "Enter" && !e.shiftKey) {
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
      loadDirectory(targetPath || "");
    } catch (e) {
      console.error(e);
    }
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
    <div className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 p-6 relative transition-colors">
      {showImageUpload ? (
        <div className="mb-4">
          <ImageUpload onImageSelect={() => {}} onUpload={handleImageUpload} />
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
            <label className="label text-gray-500 dark:text-neutral-500 text-[10px] uppercase font-bold tracking-widest">
              Responding Staff
            </label>
            <select
              className="input h-10 py-0"
              value={selectedStaffId || ""}
              onChange={(e) => setSelectedStaffId(parseInt(e.target.value))}
              required
            >
              <option value="" className="dark:bg-neutral-900">
                Select staff member
              </option>
              {participantStaff.map((member) => (
                <option
                  key={member.id}
                  value={member.id}
                  className="dark:bg-neutral-900"
                >
                  {member.name} - {member.role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 relative items-end">
            {/* Autocomplete Dropdown */}
            {showMentionDropdown && filteredMentions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-3 w-80 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto backdrop-blur-md">
                {" "}
                {filteredMentions.map((mention, index) => (
                  <div
                    key={mention.id}
                    // Indigo tint for selection
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors border-l-4 ${index === selectedMentionIndex ? "bg-secondary-50 dark:bg-secondary-900/30 border-secondary-500" : "hover:bg-gray-50 dark:hover:bg-neutral-700 border-transparent"}`}
                    onClick={() => selectMention(mention, inputRef)}
                  >
                    <div className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-neutral-700">
                      {mention.type === "image" ||
                      (mention.type === "asset" && mention.url) ? (
                        <img
                          src={mention.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">📄</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {mention.display}
                      </div>
                      {mention.description && (
                        <div className="text-[10px] text-gray-500 dark:text-neutral-400 truncate uppercase mt-0.5 tracking-tight">
                          {mention.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={inputRef}
              className="input flex-1 min-h-[46px] max-h-48 py-3 resize-none overflow-y-auto shadow-inner bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 focus:ring-primary-500"
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
              className="h-[46px] px-3 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 font-mono text-sm font-bold transition-all active:scale-95"
              disabled={isStreaming}
              title="Insert Code Block"
            >
              &lt;/&gt;
            </button>

            <button
              type="button"
              onClick={() => setShowImageUpload(true)}
              className="h-[46px] px-4 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all active:scale-95"
              disabled={isStreaming}
            >
              🖼️
            </button>
            <button
              type="button"
              onClick={handlePreviewClick}
              className="h-[46px] px-4 bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-900/30 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-900/50 flex items-center justify-center transition-all active:scale-95 group"
              disabled={
                isStreaming ||
                !inputMessage.trim() ||
                !selectedStaffId ||
                isFetchingPreview
              }
            >
              {isFetchingPreview ? (
                <div className="w-5 h-5 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Eye
                  size={20}
                  className="group-hover:scale-110 transition-transform"
                />
              )}
            </button>

            {isStreaming && !showPathInput ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="h-[46px] px-6 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-500/20 font-bold text-sm"
              >
                <Square size={16} fill="currentColor" /> Stop
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary h-[46px] px-6 !rounded-xl shadow-lg shadow-primary-500/20"
                disabled={!selectedStaffId || isStreaming}
              >
                Send
              </button>
            )}

            <button
              type="button"
              onClick={handleAskAll}
              className="h-[46px] px-4 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
              disabled={isStreaming || participantStaff.length === 0}
            >
              Ask All
            </button>
            {/* Autonomous / File System Group */}
            <div className="flex items-center relative">
              {showPathInput && (
                <div className="absolute bottom-full right-0 mb-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 flex flex-col gap-4 w-80 animate-in fade-in slide-in-from-bottom-2 z-50">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                      Target Path
                    </label>
                    <button
                      type="button"
                      onClick={openBrowser}
                      className="text-[10px] bg-secondary-50 dark:bg-secondary-900/30 hover:bg-secondary-100 dark:hover:bg-secondary-900/50 px-2 py-1 rounded-lg text-secondary-600 dark:text-secondary-400 flex items-center gap-1 transition-colors border border-secondary-200/50 dark:border-secondary-900/30"
                    >
                      <Folder size={12} /> Browse Files
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input !h-9 text-xs"
                    placeholder="e.g. C:\Users\Dev\Project"
                    value={targetPath}
                    onChange={(e) => setTargetPath(e.target.value)}
                    autoFocus
                  />
                  <div className="text-[10px] text-gray-400">
                    ⚠️ Agents will have R/W access here.
                  </div>

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
                    <button
                      type="button" // 1.2 Changed from type="submit" to type="button"
                      // 1.3 Added specific handleAutonomousSession call
                      onClick={(e) => {
                        e.preventDefault();
                        if (!inputMessage.trim()) {
                          alert("Please type a task or goal first!");
                          return;
                        }
                        handleAutonomousSession(targetPath);
                        setShowPathInput(false);
                      }}
                      className="h-10 w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary-500/20"
                      disabled={!selectedStaffId}
                    >
                      🚀 Launch Auto Session
                    </button>
                  )}
                </div>
              )}

              {/* Folder Browser Modal */}
              {showBrowser && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
                  <div className="bg-white dark:bg-neutral-800 rounded-lg w-96 max-h-[80vh] flex flex-col shadow-2xl border border-transparent dark:border-neutral-700">
                    <div className="p-3 border-b border-gray-200 dark:border-neutral-700 font-bold bg-gray-50 dark:bg-neutral-700 flex justify-between items-center text-gray-900 dark:text-white">
                      <span>Select Folder</span>
                      <button
                        onClick={() => setShowBrowser(false)}
                        className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-neutral-700 text-xs font-mono break-all border-b border-gray-200 dark:border-neutral-600 text-gray-900 dark:text-neutral-200">
                      {currentPath}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <div className="mb-2 flex flex-wrap gap-2">
                        {drives.map((d) => (
                          <button
                            key={d}
                            onClick={() => loadDirectory(d)}
                            className="px-2 py-1 bg-gray-200 dark:bg-neutral-600 text-xs rounded hover:bg-gray-300 dark:hover:bg-neutral-500 flex items-center gap-1 text-gray-900 dark:text-neutral-200 transition-colors"
                          >
                            <HardDrive size={12} /> {d}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => loadDirectory(currentPath + "/..")}
                        className="w-full text-left px-2 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-sm text-blue-600 dark:text-blue-400 mb-1 transition-colors"
                      >
                        📁 .. (Up)
                      </button>
                      {directories.map((dir) => (
                        <button
                          key={dir}
                          onClick={() =>
                            loadDirectory(
                              currentPath +
                                (currentPath.endsWith(
                                  window.navigator.platform.includes("Win")
                                    ? "\\"
                                    : "/",
                                )
                                  ? ""
                                  : window.navigator.platform.includes("Win")
                                    ? "\\"
                                    : "/") +
                                dir,
                            )
                          }
                          className="w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded text-sm flex items-center gap-2 text-gray-900 dark:text-neutral-200 transition-colors"
                        >
                          <Folder size={14} className="text-yellow-500" /> {dir}
                        </button>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-neutral-700 flex justify-end gap-2">
                      <button
                        onClick={() => setShowBrowser(false)}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSelectFolder}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Select Current
                      </button>
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
                className={`h-[46px] px-4 rounded-xl flex items-center gap-2 font-bold text-sm transition-all active:scale-95 ${showPathInput ? "bg-red-500 text-white" : "bg-secondary-600 hover:bg-secondary-700 text-white shadow-md"}`}
                disabled={participantStaff.length < 1}
                title="Start Autonomous Round Table. Click to set path."
              >
                {showPathInput ? (
                  <span>🚀 GO</span>
                ) : (
                  <>
                    <FolderCode size={18} /> Auto
                  </>
                )}
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
