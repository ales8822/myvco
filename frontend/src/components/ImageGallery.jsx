import React from 'react';

const ImageGallery = ({ images, onInsertMention }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="mt-4 border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Meeting Images (Click to mention)</h3>
            <div className="flex flex-wrap gap-2">
                {images.map((img, index) => {
                    // Calculate display order (1-based index)
                    // Use display_order from backend if available, otherwise fallback to index + 1
                    const displayOrder = img.display_order || (index + 1);
                    const mentionLabel = `@img${displayOrder}`;

                    return (
                        <button
                            key={img.id}
                            onClick={() => onInsertMention(mentionLabel)}
                            className="group relative flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-1 pr-3 transition-colors"
                            title={img.description || "No description"}
                        >
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-900">
                                <img
                                    src={img.image_url}
                                    alt={mentionLabel}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-bold text-blue-400">{mentionLabel}</span>
                                <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                                    {img.description ? img.description.substring(0, 15) + (img.description.length > 15 ? '...' : '') : 'Image'}
                                </span>
                            </div>

                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-black border border-gray-700 rounded p-1 shadow-xl">
                                    <img
                                        src={img.image_url}
                                        alt={mentionLabel}
                                        className="max-w-[200px] max-h-[150px] object-contain"
                                    />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ImageGallery;
