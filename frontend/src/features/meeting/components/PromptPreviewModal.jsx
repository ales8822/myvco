import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Eye,
  Cpu,
  CheckSquare,
  Square as SquareIcon,
  Settings2,
  User,
  Bot,
  Terminal,
} from "lucide-react";
import { estimateTokenCount } from "../utils/tokenUtils";
import { meetingsApi } from "../../../lib/api";

export default function PromptPreviewModal({
  isOpen,
  onClose,
  previewData,
  onSend,
  isStreaming,
  meetingId,
  staffId,
}) {
  const [blocks, setBlocks] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userContent, setUserContent] = useState("");
  const [maxTokens, setMaxTokens] = useState(8192);
  const [llmInfo, setLlmInfo] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [isEditingSystem, setIsEditingSystem] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Simple syntax highlighter for the preview
  const renderHighlightedText = (text) => {
    if (!text) return null;

    // Regex to find keywords: "User:", "Personality:", Staff names like "Lexicon:", etc.
    // We'll highlight standard prefixes and things ending in colon at the start of lines
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0 && colonIndex < 30) {
        // Likely a prefix
        const prefix = line.substring(0, colonIndex + 1);
        const content = line.substring(colonIndex + 1);

        let prefixClass = "font-bold ";
        let containerClass = "min-h-[1.2em] py-0.5 ";

        if (prefix.toLowerCase().includes("user:")) {
          prefixClass += "text-primary-600 dark:text-primary-400";
          containerClass +=
            "mt-4 pt-2 border-t border-gray-100 dark:border-neutral-800";
        } else if (
          prefix.toLowerCase().includes("personality:") ||
          prefix.toLowerCase().includes("expertise:")
        ) {
          prefixClass += "text-secondary-600 dark:text-secondary-400";
          containerClass += "mt-3 first:mt-0";
        } else if (
          prefix.toLowerCase().includes("knowledge:") ||
          prefix.toLowerCase().includes("context:")
        ) {
          prefixClass += "text-primary-600 dark:text-primary-400";
          containerClass += "mt-3";
        } else {
          prefixClass += "text-secondary-600 dark:text-secondary-400"; // Staff names
          containerClass += "mt-2";
        }

        return (
          <div key={i} className={containerClass}>
            <span className={prefixClass}>{prefix}</span>
            <span className="ml-1 text-gray-700 dark:text-neutral-300">
              {content}
            </span>
          </div>
        );
      }
      return (
        <div
          key={i}
          className="min-h-[1.2em] leading-relaxed text-gray-700 dark:text-neutral-300"
        >
          {line}
        </div>
      );
    });
  };
  useEffect(() => {
    if (previewData) {
      setBlocks(previewData.context_blocks || []);
      setSystemPrompt(previewData.system_prompt || "");
      setUserContent(previewData.user_content || "");
      setMaxTokens(previewData.max_tokens || 8192);
      setLlmInfo(
        `${previewData.llm_provider || "gemini"} / ${previewData.llm_model || "default"}`,
      );
      setImageUrls(previewData.image_urls || []);
    }
  }, [previewData]);

  const toggleBlock = (id) => {
    const newBlocks = blocks.map((b) =>
      b.id === id ? { ...b, enabled: !b.enabled } : b,
    );
    setBlocks(newBlocks);

    // Re-construct system prompt string based on toggles
    const enabledParts = newBlocks
      .filter((b) => b.enabled)
      .map((b) => b.content);
    enabledParts.push("\nRespond naturally as this character.");
    setSystemPrompt(enabledParts.join("\n"));
  };

  const systemTokens = estimateTokenCount(systemPrompt);
  const userTokens = estimateTokenCount(userContent);
  const imageTokens = estimateTokenCount("", imageUrls);
  const totalTokens = systemTokens + userTokens + imageTokens;
  const isOverLimit = totalTokens > maxTokens;

  // Calculate percentage for progress bar (cap at 100%)
  const percentage = Math.min(100, (totalTokens / maxTokens) * 100);

  // Choose color based on usage
  let progressColor = "bg-primary-500";
  if (isOverLimit) progressColor = "bg-rose-500";
  else if (percentage > 80) progressColor = "bg-amber-500";

  if (!isOpen) return null;

  const handleSend = async () => {
    // Persist settings to backend
    try {
      const context_settings = {};
      blocks.forEach((b) => {
        context_settings[b.id] = b.enabled;
      });
      await meetingsApi.updateContextSettings(meetingId, staffId, {
        context_settings,
      });
    } catch (e) {
      console.error("Failed to persist context settings", e);
    }

    onSend({
      systemPrompt,
      userContent,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-800">
        {/* Header Section with Token Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-950/50 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Eye size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Prompt Preview
              </h2>
              {llmInfo && (
                <span className="ml-2 text-xs font-medium text-gray-500 dark:text-neutral-400 px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700 flex items-center gap-1">
                  <Cpu size={12} /> {llmInfo}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Token Usage Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-600 uppercase tracking-wider">
                Token Usage Estimation
              </span>
              <span
                className={`${isOverLimit ? "text-red-600" : "text-gray-900"} font-mono`}
              >
                {totalTokens.toLocaleString()}{" "}
                <span className="text-gray-400">
                  / {maxTokens.toLocaleString()} Max
                </span>
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {isOverLimit && (
              <p className="text-xs text-red-600 font-medium">
                ⚠️ Warning: Complete prompt exceeds the model's context window.
                It may fail to send.
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image Attachments Section */}
          {imageUrls.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                  Attached Assets
                </label>
                <span className="text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-900/30 px-2 py-0.5 rounded font-mono font-bold">
                  +{imageTokens} TOKENS
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800"
                  >
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="h-24 w-24 object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/96?text=Asset";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context Block Toggles */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
              <Settings2 size={16} className="text-secondary-500" />
              <span>Context Block Toggles</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => toggleBlock(block.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    block.enabled
                      ? "bg-secondary-50 dark:bg-secondary-900/20 border-secondary-200 dark:border-secondary-500/50 text-secondary-700 dark:text-secondary-300"
                      : "bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 text-gray-400 opacity-60"
                  }`}
                >
                  {block.enabled ? (
                    <CheckSquare size={18} />
                  ) : (
                    <SquareIcon size={18} />
                  )}
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold leading-tight">
                      {block.label}
                    </div>
                    <div className="text-[10px] uppercase font-mono mt-0.5">
                      {estimateTokenCount(block.content)} tokens
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* System Prompt Section */}
          <div className="space-y-3 p-5 bg-secondary-50/30 dark:bg-neutral-950 rounded-2xl border border-secondary-100 dark:border-neutral-800 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-secondary-700 dark:text-secondary-400">
                <Bot size={18} />
                <label className="text-sm font-bold uppercase tracking-wider">
                  Final System Prompt
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingSystem(!isEditingSystem)}
                  className={`text-[10px] px-2 py-1 rounded font-mono uppercase transition-colors ${
                    isEditingSystem
                      ? "bg-secondary-600 text-white"
                      : "bg-secondary-100 dark:bg-neutral-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {isEditingSystem ? "Finish Editing" : "Edit Text"}
                </button>
                <span className="text-[10px] bg-white text-indigo-400 border border-indigo-100 px-2 py-0.5 rounded font-mono uppercase">
                  Instructional Context
                </span>
              </div>
            </div>
            <div className="relative group min-h-[15rem]">
              {isEditingSystem ? (
                <>
                  <div className="absolute top-3 left-3 text-indigo-300 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                    <Terminal size={14} />
                  </div>
                  <textarea
                    autoFocus
                    className="w-full h-60 pl-9 pr-4 py-3 bg-white dark:bg-neutral-900 border border-secondary-200 dark:border-neutral-800 rounded-xl focus:ring-4 focus:ring-secondary-500/10 focus:border-secondary-500 transition-all font-mono text-sm text-gray-900 dark:text-neutral-100 resize-none shadow-inner"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Constructed system prompt will appear here..."
                  />
                </>
              ) : (
                <div className="w-full h-60 p-4 bg-white dark:bg-neutral-900 border border-secondary-100 dark:border-neutral-800 rounded-xl font-mono text-xs overflow-y-auto cursor-text shadow-inner">
                  {renderHighlightedText(systemPrompt)}
                </div>
              )}
            </div>
          </div>

          {/* User Content Section */}
          <div className="space-y-3 p-5 bg-primary-50/30 dark:bg-neutral-950 rounded-2xl border border-primary-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400">
                <User size={18} />
                <label className="text-sm font-bold uppercase tracking-wider">
                  User Message
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingUser(!isEditingUser)}
                  className={`text-[10px] px-2 py-1 rounded font-mono uppercase transition-colors ${
                    isEditingUser
                      ? "bg-primary-600 text-white"
                      : "bg-primary-100 dark:bg-neutral-800 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {isEditingUser ? "Finish Editing" : "Edit Text"}
                </button>
                <span className="text-[10px] bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-neutral-700 px-2 py-1 rounded font-mono uppercase">
                  {" "}
                  Input Content
                </span>
              </div>
            </div>
            {isEditingUser ? (
              <textarea
                autoFocus
                className="w-full h-40 p-4 bg-white dark:bg-neutral-900 border border-primary-200 dark:border-neutral-800 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono text-sm text-gray-900 dark:text-neutral-100 resize-none shadow-inner"
                value={userContent}
                onChange={(e) => setUserContent(e.target.value)}
                placeholder="User message will appear here..."
              />
            ) : (
              <div
                onClick={() => setIsEditingUser(true)}
                className="w-full h-40 p-4 bg-white dark:bg-neutral-900 border border-primary-100 dark:border-neutral-800 rounded-xl font-mono text-xs overflow-y-auto cursor-text hover:border-primary-300 dark:hover:border-neutral-700 transition-colors shadow-inner"
              >
                {renderHighlightedText(userContent)}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-950/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isStreaming}
            className="px-6 py-2.5 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            <Send size={18} />
            Send Prompt Now
          </button>
        </div>
      </div>
    </div>
  );
}
