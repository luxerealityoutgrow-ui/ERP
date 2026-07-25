"use client";
import { useState } from 'react';
import { Button } from './button';
import { Upload, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

import { supabase } from '@/lib/supabaseClient';

interface MediaPickerProps {
  bucket: string;
  fieldPrefix?: string;
  multiple?: boolean;
  accept?: string;
  onUploadComplete?: (urls: string[]) => void;
}

export function MediaPicker({ 
  bucket, 
  fieldPrefix = 'file_',
  multiple = true,
  accept = 'image/*',
  onUploadComplete
}: MediaPickerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Create previews
      newFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        setPreviews(prev => [...prev, url]);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        // Generate a clean path with timestamp and random characters
        const fileExt = file.name.split('.').pop();
        const cleanName = `${fieldPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(cleanName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedUrls.push(cleanName);
      }
      
      onUploadComplete?.(uploadedUrls);
      setFiles([]);
      setPreviews([]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('File upload failed: ' + (error as any).message);
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`media-picker-${bucket}`}
        />
        <label 
          htmlFor={`media-picker-${bucket}`}
          className="cursor-pointer flex flex-col items-center justify-center p-6"
        >
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Drag & drop files here, or click to select</p>
          <p className="text-sm text-gray-500">Supports: {accept}</p>
        </label>
      </div>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square w-24 h-24 rounded-lg overflow-hidden border">
                <img 
                  src={preview} 
                  alt={`Preview ${index}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-red-500 bg-white rounded-full p-0.5" />
                </button>
              </div>
              <p className="text-xs text-center truncate w-24">{files[index]?.name}</p>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      )}
    </div>
  );
}
