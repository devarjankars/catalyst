"use client"

import React from 'react';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { PlusCircle, Trash2 } from 'lucide-react';
import { HeaderDetail } from '@/store/vsb-store';

interface Props {
  data: HeaderDetail[];
  onChange: (data: HeaderDetail[]) => void;
}

const HeaderDetailsEditor: React.FC<Props> = ({ data, onChange }) => {
  const details = Array.isArray(data) ? data : [];

  const addDetail = () => {
    onChange([...details, { name: '', value: '' }]);
  };

  const removeDetail = (idx: number) => {
    onChange(details.filter((_, i) => i !== idx));
  };

  const updateDetail = (idx: number, field: 'name' | 'value', value: string) => {
    onChange(details.map((detail, i) => 
      i === idx ? { ...detail, [field]: value } : detail
    ));
  };

  return (
    <div className='space-y-4 mb-8 bg-white p-6 rounded-lg border shadow-sm'>
      <div className='flex items-center justify-between border-b pb-2 mb-4'>
        <h3 className='text-lg font-semibold'>Header Details</h3>
        <p className='text-xs text-gray-400 font-normal'>(Shared between Desktop & Mobile)</p>
      </div>
      <div className='grid grid-cols-1 gap-3'>
        {details.map((detail, idx) => (
          <div key={idx} className='flex items-center gap-3 group'>
            <div className='w-1/3'>
              <Input
                value={detail.name}
                onChange={e => updateDetail(idx, 'name', e.target.value)}
                placeholder='Detail Name (e.g. To)'
                className='font-medium text-sm'
              />
            </div>
            <div className='flex-1'>
              <Input
                value={detail.value}
                onChange={e => updateDetail(idx, 'value', e.target.value)}
                placeholder='Value'
                className='text-sm'
              />
            </div>
            <Button 
              variant='ghost' 
              size='icon' 
              onClick={() => removeDetail(idx)}
              className='opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8'
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
      <Button variant='outline' size='sm' onClick={addDetail} className='mt-2'>
        <PlusCircle className='mr-2' size={16} /> Add Detail Row
      </Button>
    </div>
  );
};

export default HeaderDetailsEditor;
