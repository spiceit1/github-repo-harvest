import React, { useState, useRef, useEffect } from 'react';
import { X, Search, ExternalLink, Camera, Book, Fish, Save, Upload, Image as ImageIcon, Clipboard } from 'lucide-react';
import { FishData } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  fish: FishData | null;
  onImageUpdate?: (searchName: string, imageUrl: string) => Promise<void>;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, url, fish, onImageUpdate }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Store scroll position when modal opens
  useEffect(() => {
    if (isOpen) {
      scrollPositionRef.current = window.scrollY;
    }
  }, [isOpen]);

  if (!isOpen || !fish) return null;

  const searchUrls = {
    google: `https://www.google.com/search?q=${encodeURIComponent(fish.searchName)}`,
    images: `https://www.google.com/search?q=${encodeURIComponent(fish.searchName)}&tbm=isch`,
    wiki: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(fish.searchName)}`,
    fishbase: `https://www.fishbase.se/search.php?q=${encodeURIComponent(fish.searchName)}`
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    setMessage('');
    console.log('Paste event detected');
    
    const items = e.clipboardData?.items;
    
    if (!items) {
      console.log('No clipboard items found');
      return;
    }

    console.log(`Found ${items.length} items in clipboard`);
    
    // Check for image content
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Clipboard item ${i}: type=${item.type}`);
      
      if (item.type.startsWith('image/')) {
        console.log('Found image in clipboard');
        const file = item.getAsFile();
        if (!file) {
          console.log('Could not get file from clipboard item');
          continue;
        }

        console.log(`Image file: size=${file.size}, type=${file.type}`);

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          setMessage('Image size must be less than 2MB');
          return;
        }

        try {
          // Clear the URL field as we're using the pasted image
          setImageUrl('');
          setMessage('Processing image...');
          
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const result = event.target?.result;
              if (!result || typeof result !== 'string') {
                console.error('Invalid result from FileReader:', typeof result);
                setMessage('Failed to read image data');
                return;
              }
              
              // Validate that it's a proper base64 image string
              if (!result.startsWith('data:image/')) {
                console.error('Invalid base64 format, does not start with data:image/', result.substring(0, 50));
                setMessage('Invalid image format detected');
                return;
              }
              
              const mimeType = result.split(';')[0].split(':')[1];
              console.log(`Base64 image loaded successfully! MIME type: ${mimeType}, size: ${Math.round(result.length / 1024)}KB`);
              
              // Set the preview with the validated base64 string
              setPreviewUrl(result);
              setMessage('Image ready - click Save to update');
            } catch (validationError) {
              console.error('Error validating pasted image:', validationError);
              setMessage('Error processing pasted image');
            }
          };
          
          reader.onerror = (error) => {
            console.error('Error reading pasted image:', error);
            setMessage('Error reading pasted image');
          };
          
          console.log('Reading file as DataURL...');
          reader.readAsDataURL(file);
          console.log('FileReader initiated');
        } catch (error) {
          console.error('Exception during file reading:', error);
          setMessage('Failed to process pasted image');
        }
        
        return; // Exit after processing the first image
      }
    }
    
    // If no image is found in the clipboard
    console.log('No image found in clipboard');
    setMessage('No image found in clipboard. Try copying an image first.');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      setMessage('Please drop an image file');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setPreviewUrl(base64String);
      setImageUrl('');
      setMessage('');
    };
    reader.onerror = () => {
      setMessage('Error reading dropped image');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Image size must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setPreviewUrl(base64String);
      setImageUrl('');
      setMessage('');
    };
    reader.onerror = () => {
      setMessage('Error reading file');
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpdate = async () => {
    if (!fish) {
      console.error('No fish selected');
      return;
    }

    if (!onImageUpdate) {
      console.error('No image update handler provided');
      return;
    }

    if (!previewUrl) {
      setMessage('Please paste or drop an image first');
      return;
    }

    try {
      setMessage('Updating image...');
      await onImageUpdate(fish.searchName, previewUrl);
      setMessage('Image updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating image:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to update image');
    }
  };

  const handleModalClose = () => {
    onClose();
    // Restore scroll position after modal closes and content reflows
    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant'
      });
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleModalClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{fish.name}</h3>
            {fish.searchName !== fish.name && (
              <p className="text-sm text-gray-500 mt-1">Search term: {fish.searchName}</p>
            )}
          </div>
          <button
            onClick={handleModalClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Update Fish Image</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div
              ref={pasteZoneRef}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`
                mb-4 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                ${previewUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'}
                transition-colors
              `}
              onClick={() => pasteZoneRef.current?.focus()}
              tabIndex={0}
            >
              {previewUrl ? (
                <div className="relative">
                  <div className="w-full h-48 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
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
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Clipboard className="h-8 w-8" />
                  <p>Click here and paste an image (Ctrl+V)</p>
                  <p className="text-sm">or drag and drop an image here</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleImageUpdate}
                disabled={!previewUrl}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-medium
                  ${!previewUrl
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'}
                  transition-colors
                `}
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                message.includes('success')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Search Resources</h4>
            <div className="grid grid-cols-2 gap-4">
              <a
                href={searchUrls.google}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Search className="h-5 w-5 text-blue-500" />
                <span className="flex-1">Google Search</span>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
              <a
                href={searchUrls.images}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Camera className="h-5 w-5 text-blue-500" />
                <span className="flex-1">Google Images</span>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
              <a
                href={searchUrls.wiki}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Book className="h-5 w-5 text-blue-500" />
                <span className="flex-1">Wikipedia</span>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
              <a
                href={searchUrls.fishbase}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Fish className="h-5 w-5 text-blue-500" />
                <span className="flex-1">FishBase</span>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;