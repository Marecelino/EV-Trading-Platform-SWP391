import React, { useState, useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import './ImageUploader.scss';

interface ImageItem {
  preview: string; // Blob URL cho preview
  cloudinaryUrl: string; // Cloudinary URL thực tế
}

interface ImageUploaderProps {
  onUploadComplete: (imageUrls: string[]) => void;
  onRemoveImage?: (cloudinaryUrl: string) => void; // Callback để xóa URL khỏi parent state
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadComplete, onRemoveImage }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const localPreviews = Array.from(files).map(file => URL.createObjectURL(file));

    try {
      const newImages: ImageItem[] = [];
      for (let i = 0; i < Array.from(files).length; i++) {
        const file = Array.from(files)[i];
        const cloudinaryUrl = await uploadToCloudinary(file);
        newImages.push({
          preview: localPreviews[i],
          cloudinaryUrl: cloudinaryUrl
        });
      }
      
      setImages(prev => [...prev, ...newImages]);
      // Gửi các Cloudinary URLs về parent
      onUploadComplete(newImages.map(img => img.cloudinaryUrl)); 
    } catch (error) {
      console.error("Upload error:", error);
      // Nếu upload thất bại, revoke blob URLs
      localPreviews.forEach(url => URL.revokeObjectURL(url));
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const removePreview = (indexToRemove: number) => {
    const imageToRemove = images[indexToRemove];
    if (!imageToRemove) return;

    // Revoke blob URL để giải phóng memory
    if (imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    // Xóa khỏi local state
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    
    // Thông báo cho parent để xóa Cloudinary URL khỏi state
    if (onRemoveImage) {
      onRemoveImage(imageToRemove.cloudinaryUrl);
    }
  };

  return (
    <div className="image-uploader">
      <div className="dropzone">
        <UploadCloud size={48} />
        <span>Kéo và thả ảnh vào đây, hoặc bấm để chọn ảnh</span>
        <p>Hỗ trợ tối đa 10 ảnh, định dạng JPG, PNG</p>
        <input 
          type="file" 
          multiple 
          accept="image/png, image/jpeg"
          onChange={handleFileChange} 
          disabled={isUploading}
        />
      </div>
      {isUploading && <div className="upload-loader">Đang tải lên...</div>}
      <div className="preview-area">
        {images.map((image, index) => (
          <div key={index} className="preview-item">
            <img src={image.preview} alt={`Preview ${index}`} />
            <button onClick={() => removePreview(index)} className="remove-btn">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploader;
