"use client"

import React, { useRef } from 'react';
import {Input} from "../ui/input";
import {Button} from "../ui/button";
import { PlusCircle, Upload, X, Image as ImageIcon } from 'lucide-react';

interface Props {
  data: any;
  onChange: (data: any) => void;
}

const VariableCopySection: React.FC<Props> = ({ data, onChange }) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Ensure variableCopy is always an array
  const variableCopy = Array.isArray(data) ? data : [];

  // Add a new section
  const addSection = () => {
    const updated = [...variableCopy, { heading: '', options: [''] }];
    onChange(updated);
  };

  // Remove a section
  const removeSection = (idx: number) => {
    const updated = variableCopy.filter((_, i) => i !== idx);
    onChange(updated);
  };

  // Update section heading
  const updateHeading = (idx: number, value: string) => {
    const updated = variableCopy.map((section, i) =>
      i === idx ? { ...section, heading: value } : section
    );
    onChange(updated);
  };

  // Add option to section
  const addOption = (idx: number) => {
    const updated = variableCopy.map((section, i) =>
      i === idx ? { ...section, options: [...section.options, ''] } : section
    );
    onChange(updated);
  };

  // Remove option from section
  const removeOption = (sectionIdx: number, optIdx: number) => {
    const updated = variableCopy.map((section, i) => {
      if (i !== sectionIdx) return section;
      return { ...section, options: section.options.filter((_, j) => j !== optIdx) };
    });
    onChange(updated );
  };

  // Update option value
  const updateOption = (sectionIdx: number, optIdx: number, value: string) => {
    const updated = variableCopy.map((section, i) => {
      if (i !== sectionIdx) return section;
      return {
        ...section,
        options: section.options.map((opt, j) => (j === optIdx ? value : opt)),
      };
    });
    onChange(updated);
  };

  const handleImageUpload = (sectionIdx: number, optIdx: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateOption(sectionIdx, optIdx, base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 className='text-xl font-bold mb-4'>Variable Copy</h2>
      {variableCopy.length === 0 ? (
        <p className='text-gray-500 mb-4'>No variable copy added yet.</p>
      ) : (
        <div className='space-y-6'>
          {variableCopy.map((section, idx) => {
            const isImageSection = section.heading.toLowerCase().includes('image');
            
            return (
              <div key={idx} className='border rounded p-4 relative bg-gray-50'>
                <div className='flex items-center mb-4'>
                  <label className='mr-2 w-20 font-medium'>Heading</label>
                  <Input
                    value={section.heading}
                    onChange={e => updateHeading(idx, e.target.value)}
                    className='flex-1 mr-2 bg-white'
                    placeholder='Section heading'
                  />
                  <Button variant='ghost' size='icon' onClick={() => removeSection(idx)} title='Remove section'>
                    ✕
                  </Button>
                </div>
                
                <div className='space-y-3 ml-4'>
                  {/* <div className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-2'>Options</div> */}
                  {section.options.map((opt, optIdx) => {
                    const hasPreview = isImageSection && (opt.startsWith('data:image') || opt.startsWith('http'));

                    return (
                      <div key={optIdx} className='flex flex-col gap-2'>
                        <div className='flex items-center gap-2'>
                          <label className='text-sm text-gray-500 w-16 shrink-0'>Option {optIdx + 1}</label>
                          <Input
                            value={opt}
                            onChange={e => updateOption(idx, optIdx, e.target.value)}
                            className='flex-1 bg-white'
                            placeholder={isImageSection ? 'Image URL or Upload' : `Option ${optIdx + 1}`}
                          />
                          
                          {isImageSection && (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => {
                                  fileInputRefs.current[`${idx}-${optIdx}`] = el;
                                }}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(idx, optIdx, file);
                                }}
                              />
                              <Button 
                                variant='outline' 
                                size='icon' 
                                className='shrink-0 h-10 w-10 bg-white'
                                onClick={() => fileInputRefs.current[`${idx}-${optIdx}`]?.click()}
                                title='Upload Image'
                              >
                                <Upload size={14} />
                              </Button>
                            </>
                          )}
                          
                          <Button variant='ghost' size='icon' onClick={() => removeOption(idx, optIdx)} title='Remove option' className='shrink-0'>
                            ✕
                          </Button>
                        </div>
                        
                        {hasPreview && (
                          <div className='ml-16 mb-2'>
                             <img 
                                src={opt} 
                                alt="Preview" 
                                className='h-16 w-auto rounded border border-gray-200'
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <Button variant='ghost' size='sm' onClick={() => addOption(idx)} className='mt-2 ml-16'>
                    <PlusCircle className='mr-1' size={16}/> Add option
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
     
      <div className='flex justify-center'>
         <Button variant='outline' className='mt-4' onClick={addSection}>
        <PlusCircle className='mr-1' size={20}/> Add section
      </Button>
      </div>
    </div>
  );
};

export default VariableCopySection;
