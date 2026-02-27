import React from 'react';

interface Props {
  data: any;
  onChange: (data: any) => void;
}

const MobileViewSection: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div>
      <h2 className='text-xl font-bold mb-4'>Mobile View</h2>
      <div className='mb-2'>
        
      </div>
    </div>
  );
};

export default MobileViewSection;
