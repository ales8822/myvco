// frontend\src\components\ImageSidebarPanel.jsx
import { useState, useEffect } from 'react';
import { meetingsApi, assetsApi } from '../lib/api';
import ImageGallery from './ImageGallery';

export default function ImageSidebarPanel({ meetingId, companyId, isActive, refreshTrigger, onInsertMention }) {
    const [images, setImages] = useState([]);
    const [companyAssets, setCompanyAssets] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        if (meetingId) {
            loadImages();
        }
    }, [meetingId, refreshTrigger]);

    useEffect(() => {
        if (companyId) {
            loadCompanyAssets();
        }
    }, [companyId]);

    const loadImages = async () => {
        try {
            const response = await meetingsApi.getImages(meetingId);
            setImages(response.data);
            if (response.data.length > 0 && currentImageIndex >= response.data.length) {
                setCurrentImageIndex(response.data.length - 1);
            }
        } catch (error) {
            console.error('Error loading images:', error);
        }
    };

    const loadCompanyAssets = async () => {
        try {
            const response = await assetsApi.list(companyId);
            setCompanyAssets(response.data);
        } catch (error) {
            console.error('Error loading company assets:', error);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);

        try {
            // Upload each image
            for (const file of files) {
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onloadend = async () => {
                        try {
                            await meetingsApi.uploadImage(meetingId, {
                                image_data: reader.result,
                                description: file.name
                            });
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            // Reload images
            await loadImages();
            setShowUpload(false);
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const currentImage = images[currentImageIndex];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Meeting Images</h3>
                {isActive && (
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                    >
                        {showUpload ? 'Cancel' : '+ Upload'}
                    </button>
                )}
            </div>

            {showUpload && (
                <div className="mb-4">
                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                        <div className="text-center">
                            <span className="text-2xl mb-1 block">🖼️</span>
                            <span className="text-xs text-gray-600">
                                {uploading ? 'Uploading...' : 'Click or drop images'}
                            </span>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            disabled={uploading}
                        />
                    </label>
                </div>
            )}

            {images.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No images uploaded yet
                </div>
            ) : (
                <>
                    {/* Current Image Display */}
                    <div className="mb-4 relative group">
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                            @img{currentImage.display_order || (currentImageIndex + 1)}
                        </div>
                        <img
                            src={`http://localhost:8001${currentImage.image_url}`}
                            alt={currentImage.description || 'Meeting image'}
                            className="w-full rounded-lg border border-gray-200 cursor-pointer"
                            onClick={() => onInsertMention && onInsertMention(`@img${currentImage.display_order || (currentImageIndex + 1)}`)}
                            title="Click to mention this image"
                        />
                        {currentImage.description && (
                            <p className="text-sm text-gray-600 mt-2">
                                {currentImage.description}
                            </p>
                        )}
                    </div>

                    {/* Image Navigation */}
                    {images.length > 1 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Image {currentImageIndex + 1} of {images.length}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                                        disabled={currentImageIndex === 0}
                                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ←
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                                        disabled={currentImageIndex === images.length - 1}
                                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Image Gallery Grid */}
                    <ImageGallery images={images} onInsertMention={(mention) => {
                        // Also update current view to the clicked image
                        const displayOrder = parseInt(mention.replace('@img', ''));
                        const index = images.findIndex(img => (img.display_order || (images.indexOf(img) + 1)) === displayOrder);

                        if (index >= 0) {
                            setCurrentImageIndex(index);
                        }
                        if (onInsertMention) onInsertMention(mention);
                    }} />

                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        💡 Click an image or use <b>@imgN</b> to let agents see it.
                    </div>
                </>
            )}

            {/* Company Assets Section */}
            {companyAssets.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Company Assets</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {companyAssets.map(asset => (
                            <div
                                key={asset.id}
                                className="relative group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                                onClick={() => onInsertMention && onInsertMention(`@${asset.asset_name}`)}
                            >
                                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                    {asset.asset_type === 'image' ? (
                                        <img
                                            src={`http://localhost:8001/${asset.file_path}`}
                                            alt={asset.display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl">📄</span>
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                                    @{asset.asset_name}
                                </div>

                                {/* Tooltip on hover */}
                                {asset.asset_type === 'image' && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                        <div className="bg-black border border-gray-700 rounded p-1 shadow-xl">
                                            <img
                                                src={`http://localhost:8001/${asset.file_path}`}
                                                alt={asset.asset_name}
                                                className="max-w-[200px] max-h-[150px] object-contain"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        Use <b>@asset_name</b> to reference these assets.
                    </div>
                </div>
            )}
        </div>
    );
}
