// frontend\src\components\ImageSidebarPanel.jsx
import { useState, useEffect } from "react";
import { meetingsApi, assetsApi } from "../lib/api";
import ImageGallery from "./ImageGallery";

export default function ImageSidebarPanel({
  meetingId,
  companyId,
  isActive,
  refreshTrigger,
  onInsertMention,
}) {
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
      if (
        response.data.length > 0 &&
        currentImageIndex >= response.data.length
      ) {
        setCurrentImageIndex(response.data.length - 1);
      }
    } catch (error) {
      console.error("Error loading images:", error);
    }
  };

  const loadCompanyAssets = async () => {
    try {
      const response = await assetsApi.list(companyId);
      setCompanyAssets(response.data);
    } catch (error) {
      console.error("Error loading company assets:", error);
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
                description: file.name,
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
      console.error("Error uploading images:", error);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const currentImage = images[currentImageIndex];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider">
          Meeting Images
        </h3>
        {isActive && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700"
          >
            {showUpload ? "Cancel" : "+ Upload"}
          </button>
        )}
      </div>

      {showUpload && (
        <div className="mb-4">
          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-50 dark:bg-neutral-950/50">
            <div className="text-center">
              <span className="text-2xl mb-1 block">🖼️</span>
              <span className="text-[10px] uppercase font-bold text-gray-600 dark:text-neutral-500 tracking-tight">
                {uploading ? "Uploading..." : "Click or drop images"}
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
        <div className="text-center py-8 text-gray-500 dark:text-neutral-500 text-xs italic">
          No images uploaded yet
        </div>
      ) : (
        <>
          {/* Current Image Display */}
          <div className="mb-4 relative group">
            <div className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-10 font-mono">
              @img{currentImage.display_order || currentImageIndex + 1}
            </div>
            <img
              src={`http://localhost:8001${currentImage.image_url}`}
              alt={currentImage.description || "Meeting image"}
              className="w-full rounded-lg border border-gray-200 dark:border-neutral-800 cursor-pointer shadow-md hover:border-primary-500/50 transition-colors"
              onClick={() =>
                onInsertMention &&
                onInsertMention(
                  `@img${currentImage.display_order || currentImageIndex + 1}`,
                )
              }
            />
            {currentImage.description && (
              <p className="text-xs text-gray-600 dark:text-neutral-400 mt-2 line-clamp-2">
                {currentImage.description}
              </p>
            )}
          </div>

          {/* Image Navigation */}
          {images.length > 1 && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-widest">
                <span>
                  Item {currentImageIndex + 1} / {images.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentImageIndex(Math.max(0, currentImageIndex - 1))
                    }
                    disabled={currentImageIndex === 0}
                    className="p-1 px-2 bg-gray-100 dark:bg-neutral-800 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-neutral-300"
                  >
                    ←
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        Math.min(images.length - 1, currentImageIndex + 1),
                      )
                    }
                    disabled={currentImageIndex === images.length - 1}
                    className="p-1 px-2 bg-gray-100 dark:bg-neutral-800 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-neutral-300"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Gallery Grid */}
          <ImageGallery
            images={images}
            onInsertMention={(mention) => {
              // Also update current view to the clicked image
              const displayOrder = parseInt(mention.replace("@img", ""));
              const index = images.findIndex(
                (img) =>
                  (img.display_order || images.indexOf(img) + 1) ===
                  displayOrder,
              );

              if (index >= 0) {
                setCurrentImageIndex(index);
              }
              if (onInsertMention) onInsertMention(mention);
            }}
          />

          <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900/30 rounded-lg text-[10px] font-medium text-primary-800 dark:text-primary-400 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>
              Click an image or use <b>@imgN</b> to share with the AI.
            </span>
          </div>
        </>
      )}

      {/* Company Assets Section */}
      {companyAssets.length > 0 && (
        <div className="mt-8 border-t border-gray-100 dark:border-neutral-800 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500 mb-4">
            Company Library
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {companyAssets.map((asset) => (
              <div
                key={asset.id}
                className="relative group cursor-pointer border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden hover:border-primary-500 transition-all shadow-sm"
                onClick={() =>
                  onInsertMention && onInsertMention(`@${asset.asset_name}`)
                }
              >
                <div className="aspect-square bg-gray-50 dark:bg-neutral-950 flex items-center justify-center border-b dark:border-neutral-800">
                  {" "}
                  {asset.asset_type === "image" ? (
                    <img
                      src={`http://localhost:8001/${asset.file_path}`}
                      alt={asset.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">📄</span>
                  )}
                </div>
                <div className="p-1.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-[9px] font-bold font-mono truncate">
                  {" "}
                  @{asset.asset_name}
                </div>

                {/* Tooltip on hover */}
                {asset.asset_type === "image" && (
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
