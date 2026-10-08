import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import api from '../../services/api';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024;

export const ImageUpload = ({
  label = 'Image',
  value,
  onChange,
  purpose = 'general',
  multiple = false,
  maxFiles = 1,
  required = false,
  aspectClass = 'aspect-video',
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const images = multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);

  const handleFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    setError('');

    if (!selectedFiles.length) return;
    if (images.length + selectedFiles.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} image${maxFiles === 1 ? '' : 's'}.`);
      return;
    }

    const invalidType = selectedFiles.find((file) => !ACCEPTED_TYPES.includes(file.type));
    if (invalidType) {
      setError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }

    const oversized = selectedFiles.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError('Each image must be 8 MB or smaller.');
      return;
    }

    const body = new FormData();
    body.append('purpose', purpose);
    selectedFiles.forEach((file) => body.append(multiple ? 'images' : 'image', file));

    try {
      setUploading(true);
      const response = await api.post('/uploads', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrls = response.data.urls || [response.data.url];
      onChange(multiple ? [...images, ...uploadedUrls].slice(0, maxFiles) : uploadedUrls[0]);
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    if (multiple) onChange(images.filter((_, imageIndex) => imageIndex !== index));
    else onChange('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] uppercase font-bold text-slate-700">
          {label}{required ? ' *' : ''}
        </label>
        <span className="text-[10px] text-slate-400">JPEG, PNG or WebP · max 8 MB</span>
      </div>

      {images.length > 0 && (
        <div className={`grid gap-3 mb-3 ${multiple ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${aspectClass}`}>
              <img src={image} alt={`${label} preview ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/95 text-rose-600 shadow hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxFiles && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full min-h-24 border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-xl bg-slate-50 hover:bg-slate-100 transition flex flex-col items-center justify-center gap-1.5 text-slate-600 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : images.length ? <ImagePlus className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
          <span className="text-xs font-semibold">
            {uploading ? 'Optimizing and uploading…' : images.length ? 'Add another image' : 'Choose image from your computer'}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        required={required && images.length === 0}
        onChange={handleFiles}
        className="sr-only"
      />
      {error && <p role="alert" className="mt-1.5 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
};
