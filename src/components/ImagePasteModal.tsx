import React, { useRef, useState } from 'react';
import { X, Search, Image } from 'lucide-react';

interface ImagePasteModalProps {
  searchName: string;
  onClose: () => void;
  onImagePasted: (searchName: string, base64Data: string) => Promise<void>;
}

export function ImagePasteModal({ searchName, onClose, onImagePasted }: ImagePasteModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    setError(null);

    const items = e.clipboardData?.items;
    if (!items) return;

    let imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
    if (!imageItem) {
      setError('No image found in clipboard');
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) {
      setError('Failed to get image from clipboard');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      if (!base64Data?.startsWith('data:image/')) {
        setError('Invalid image format');
        return;
      }
      setPreviewUrl(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!previewUrl) {
      setError('Please paste an image first');
      return;
    }

    try {
      await onImagePasted(searchName, previewUrl);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save image');
    }
  };

  const handleGoogleSearch = () => {
    const searchQuery = encodeURIComponent(searchName);
    window.open(`https://www.google.com/search?q=${searchQuery}&tbm=isch`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Update Image</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-center mb-4">
            <button
              onClick={handleGoogleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Search className="h-4 w-4" />
              Search Google Images
            </button>
          </div>

          <div
            ref={pasteZoneRef}
            onPaste={handlePaste}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-4
              ${previewUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'}
            `}
            onClick={() => pasteZoneRef.current?.focus()}
            tabIndex={0}
          >
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-gray-500">
                <Image className="h-8 w-8 mx-auto mb-2" />
                Click here and paste an image (Ctrl+V)
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!previewUrl}
              className={`
                px-4 py-2 rounded-lg
                ${!previewUrl
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'}
              `}
            >
              Save Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 