import { PlusCircle, Trash2, Image as ImageIcon, Check, Upload, RefreshCw, MousePointer2 } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { firebaseService } from '@/services/firebase-service';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';

interface Props {
  data: any;
  onChange: (data: any) => void;
}

const AltNamePageSection: React.FC<Props> = ({ data, onChange }) => {
  const images = Array.isArray(data.images) ? data.images : [];
  const templateImages = useEmailBuilderStore(state => state.templateImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeIdxRef = useRef<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [selectionIndex, setSelectionIndex] = useState<number | null>(null);

  // Toggle image selection from gallery
  const toggleImageFromGallery = (url: string) => {
    if (selectionIndex !== null) {
      selectImageForEntry(selectionIndex, url);
      setSelectionIndex(null);
      return;
    }

    const exists = images.find((img: any) => img.name === url);
    if (exists) {
      // Remove if already selected
      const updated = images.filter((img: any) => img.name !== url);
      onChange({ ...data, images: updated });
    } else {
      // Add if not selected
      const updated = [...images, { name: url, value: '' }];
      onChange({ ...data, images: updated });
    }
  };

  // Select image for a specific entry
  const selectImageForEntry = (idx: number, url: string) => {
    const updated = images.map((img: any, i: number) =>
      i === idx ? { ...img, name: url } : img
    );
    onChange({ ...data, images: updated });
  };

  // Remove image entry
  const removeImage = (idx: number) => {
    const updated = images.filter((_: any, i: number) => i !== idx);
    onChange({ ...data, images: updated });
  };

  const addImage = () => {
    const updated = [...images, { name: '', value: '' }];
    onChange({ ...data, images: updated });
  };

  // Update alt value
  const updateValue = (idx: number, value: string) => {
    const updated = images.map((img: any, i: number) => i === idx ? { ...img, value: value } : img);
    onChange({ ...data, images: updated });
  };

  const { templateId } = useParams() as { templateId: string };
  const [isUploading, setIsUploading] = useState<number | null>(null);

  // ... (selectImageForEntry, removeImage, addImage, updateValue unchanged)

  const handleImageUpload = async (idx: number, file: File) => {
    if (!file || !templateId) return;
    setIsUploading(idx);
    try {
      const url = await firebaseService.uploadVSBImage(file, templateId);
      if (url) {
        selectImageForEntry(idx, url);
        // Also add to template images gallery if not already there
        useEmailBuilderStore.getState().addTemplateImage(url);
      }
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setIsUploading(null);
    }
  };

  const triggerUpload = (idx: number) => {
    activeIdxRef.current = idx;
    fileInputRef.current?.click();
  };

  const startGallerySelection = (idx: number) => {
    setSelectionIndex(idx);
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeIdxRef.current !== null) {
            handleImageUpload(activeIdxRef.current, file);
          }
        }}
      />

      <div ref={galleryRef} className={`transition-all duration-500 rounded-2xl ${selectionIndex !== null ? 'ring-4 ring-blue-500/20 bg-blue-50/50 p-2' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <ImageIcon className="h-5 w-5" /> Image Gallery
            {selectionIndex !== null && (
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                Selecting for Row {selectionIndex + 1}
              </span>
            )}
          </h2>
          {selectionIndex !== null && (
            <Button variant="ghost" size="sm" onClick={() => setSelectionIndex(null)} className="text-gray-400 hover:text-gray-600">
              Cancel Selection
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">Select images from the template to add alt text.</p>
        <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 bg-gray-50 p-4 rounded-xl border border-dashed'>
          {templateImages.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-400 text-sm italic">
              No images found in this template.
            </div>
          )}
          {templateImages.map((url, i) => {
            const isSelected = images.some((img: any) => img.name === url);
            return (
              <div
                key={i}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-300'} ${selectionIndex !== null ? 'hover:scale-105 active:scale-95' : ''}`}
                onClick={() => toggleImageFromGallery(url)}
              >
                <img
                  src={url}
                  alt='gallery-img'
                  className="w-full h-full object-contain"
                />
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                {selectionIndex !== null && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center opacity-0 hover:opacity-100">
                    <MousePointer2 className="text-blue-600 h-6 w-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className='text-xl font-bold mb-4'>Selected Images & Alt Text</h2>
        <div className='space-y-4'>
          {images.length === 0 ? (
            <div className="border border-dashed rounded-xl p-12 text-center text-gray-400 bg-gray-50">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No images selected. Click images above or add a new entry.</p>
            </div>
          ) : (
            images.map((img: any, idx: number) => (
              <Card key={idx} className={`overflow-hidden transition-all border-gray-200 ${selectionIndex === idx ? 'ring-2 ring-blue-500 scale-[1.01]' : ''}`}>
                <CardContent className="p-4 flex items-center gap-6">
                  {img.name ? (
                    <div className="w-[120px] h-[80px] rounded overflow-hidden flex-shrink-0 bg-gray-100 border relative group">
                      <img src={img.name} alt="selected" className="w-full h-full object-contain" />
                      <div
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2"
                      >
                        <RefreshCw className="text-white h-5 w-5" onClick={(e) => { e.stopPropagation(); triggerUpload(idx); }} />
                        <ImageIcon className="text-white h-5 w-5" onClick={(e) => { e.stopPropagation(); startGallerySelection(idx); }} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-[200px] h-[80px] rounded flex-shrink-0 bg-blue-50 border border-blue-100 flex flex-col items-center justify-center gap-2 p-2">
                      <p className="text-[10px] font-bold text-blue-400 uppercase">Missing Image</p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-[10px] bg-white border-blue-200 hover:bg-blue-100"
                          onClick={() => triggerUpload(idx)}
                          disabled={isUploading === idx}
                        >
                          {isUploading === idx ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                          {isUploading === idx ? 'Uploading...' : 'Upload'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-[10px] bg-white border-blue-200 hover:bg-blue-100"
                          onClick={() => startGallerySelection(idx)}
                        >
                          <ImageIcon className="h-3 w-3 mr-1" /> Gallery
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alt Text Description</label>
                      <div className="flex gap-2">
                        <button
                          className="text-[10px] text-blue-500 hover:underline font-medium"
                          onClick={() => triggerUpload(idx)}
                        >
                          Upload
                        </button>
                        <span className="text-[10px] text-gray-300">|</span>
                        <button
                          className="text-[10px] text-blue-500 hover:underline font-medium"
                          onClick={() => startGallerySelection(idx)}
                        >
                          Gallery
                        </button>
                      </div>
                    </div>
                    <Input
                      type='text'
                      value={img.value}
                      onChange={e => updateValue(idx, e.target.value)}
                      className='h-10 text-sm'
                      placeholder='e.g. Woman drinking coffee outdoors'
                    />
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50"
                    onClick={() => removeImage(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className='flex justify-center pt-4'>
        <Button
          variant="outline"
          className="gap-2  h-12 px-8 text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl"
          onClick={addImage}
        >
          <PlusCircle className="h-5 w-5" /> Add Alt Text Row
        </Button>
      </div>
    </div>
  );
};

export default AltNamePageSection;
