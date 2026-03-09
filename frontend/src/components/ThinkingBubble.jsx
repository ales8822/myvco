// frontend\src\components\ThinkingBubble.jsx
import React from 'react';

export default function ThinkingBubble() {
    return (
        <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center mr-2 mt-1 flex-shrink-0 animate-pulse">
                <span className="text-xs font-bold text-gray-500 dark:text-neutral-500">...</span>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-neutral-200 rounded-2xl rounded-tl-none shadow-sm px-4 py-3">
                <div className="flex space-x-1 h-6 items-center">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-600 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}

