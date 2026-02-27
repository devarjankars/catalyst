"use client"

import React from 'react';
import {Input} from "../ui/input";
import {Button} from "../ui/button";
import { PlusCircle } from 'lucide-react';

interface Props {
  data: any;
  onChange: (data: any) => void;
}


const VariableCopySection: React.FC<Props> = ({ data, onChange }) => {
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

  return (
    <div>
      <h2 className='text-xl font-bold mb-4'>Variable Copy</h2>
      {variableCopy.length === 0 ? (
        <p className='text-gray-500 mb-4'>No variable copy added yet.</p>
      ) : (
        <div className='space-y-6'>
          {variableCopy.map((section, idx) => (
            <div key={idx} className='border rounded p-4 relative bg-gray-50'>
              <div className='flex items-center mb-2'>
                <label className='mr-2'>Heading</label>
                <Input
                  value={section.heading}
                  onChange={e => updateHeading(idx, e.target.value)}
                  className='flex-1 mr-2'
                  placeholder='Section heading'
                />
                <Button variant='ghost' size='icon' onClick={() => removeSection(idx)} title='Remove section'>
                  ✕
                </Button>
              </div>
              <div className='space-y-2'>
                {section.options.map((opt, optIdx) => (
                  <div key={optIdx} className='flex items-center'>
                    <label className='mr-2'>Option {optIdx + 1}</label>
                    <Input
                      value={opt}
                      onChange={e => updateOption(idx, optIdx, e.target.value)}
                      className='flex-1 mr-2'
                      placeholder={`Option ${optIdx + 1}`}
                    />
                    <Button variant='ghost' size='icon' onClick={() => removeOption(idx, optIdx)} title='Remove option'>
                      ✕
                    </Button>
                  </div>
                ))}
                <Button variant='ghost' size='sm' onClick={() => addOption(idx)} className='mt-2'>
                  <PlusCircle className='mr-1' size={18}/> Add option
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button variant='ghost' className='mt-4' onClick={addSection}>
        <PlusCircle className='mr-1' size={20}/> Add section
      </Button>
    </div>
  );
};

export default VariableCopySection;
