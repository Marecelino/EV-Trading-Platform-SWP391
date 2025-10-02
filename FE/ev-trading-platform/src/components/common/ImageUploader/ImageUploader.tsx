import React, { useState, useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import './ImageUploader.scss';

interface ImageUploaderProps {
  onUploadComplete: (imageUrls: string[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadComplete }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const localPreviews = Array.from(files).map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...localPreviews]);

    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadToCloudinary(file);
        uploadedUrls.push(url);
      }
      onUploadComplete(uploadedUrls); // Gửi danh sách URL về form cha
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const removePreview = (indexToRemove: number) => {
    setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    // Nếu muốn xóa ảnh trên Cloudinary → gọi API xóa (cần public_id)
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
        {previews.map((src, index) => (
          <div key={index} className="preview-item">
            <img src={src} alt={`Preview ${index}`} />
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
