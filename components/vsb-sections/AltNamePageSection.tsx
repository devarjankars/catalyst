import { PlusCircle, Trash2 } from 'lucide-react';
import React from 'react';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import { Button } from '../ui/button';

interface Props {
  data: any;
  onChange: (data: any) => void;
}

const AltNamePageSection: React.FC<Props> = ({ data, onChange }) => {
  const images = Array.isArray(data.images) ? data.images : [];
  const templateImages = useEmailBuilderStore(state => state.templateImages);

  // Add new image entry
  const addImage = () => {
    onChange({ ...data, images: [...images, { name: '', value: '' }] });
  };

  // Remove image entry
  const removeImage = (idx: number) => {
    onChange({ ...data, images: images.filter((_, i) => i !== idx) });
  };

  // Update image name (file url or name)
  const updateName = (idx: number, value: string) => {
    const updated = images.map((img, i) => i === idx ? { ...img, name: value } : img);
    onChange({ ...data, images: updated });
  };

  // Select image from gallery
  const selectFromGallery = (idx: number, url: string) => {
    const updated = images.map((img, i) => i === idx ? { ...img, name: url } : img);
    onChange({ ...data, images: updated });
  };

  // Update alt value
  const updateValue = (idx: number, value: string) => {
    const updated = images.map((img, i) => i === idx ? { ...img, value: value } : img);
    onChange({ ...data, images: updated });
  };

  // Handle file upload
  const handleFileUpload = (idx: number, file: File) => {
    // For demo, use file name as url. In real app, upload and get URL.
    const url = URL.createObjectURL(file);
    const updated = images.map((img, i) => i === idx ? { ...img, name: url } : img);
    onChange({ ...data, images: updated });
  };

  return (
    <div>
      <h2 className='text-xl font-bold mb-4'>Alt Name Page</h2>
      <div className='space-y-4'>
        {images.map((img, idx) => (
          <div key={idx} className='flex flex-col gap-2 border p-2 rounded'>
            <div className='flex items-center gap-4'>
              {/* Gallery selector */}
              <div>
                <div className='flex flex-wrap gap-2 mb-2'>
                  {templateImages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt='gallery-img'
                      className={`w-10 h-10 object-cover border-2 rounded cursor-pointer ${img.name === url ? 'border-blue-500' : 'border-gray-200'}`}
                      onClick={() => selectFromGallery(idx, url)}
                    />
                  ))}
                </div>
                <input
                  type='file'
                  accept='image/*'
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(idx, e.target.files[0]);
                    }
                  }}
                />
                {img.name && (
                  <img src={img.name} alt={img.value} className='w-16 h-16 object-cover mt-2'/>
                )}
              </div>
              <div className='flex flex-col'>
                <input
                  type='text'
                  value={img.value}
                  onChange={e => updateValue(idx, e.target.value)}
                  className='border px-2 py-1 rounded'
                  placeholder='Enter alt name'
                />
              </div>
              <Button
                className='px-2 py-1'
                variant={"outline"}
                onClick={() => removeImage(idx)}
              ><Trash2 size={"15px"}/></Button>
            </div>
          </div>
        ))}
        <Button
          variant={"ghost"}
          onClick={addImage}
        ><PlusCircle/>Add Image</Button>
      </div>
    </div>
  );
};

export default AltNamePageSection;
