import React from 'react';

interface Props {
  data: any;
  onChange: (data: any) => void;
}

const DesktopViewSection: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div>
      <h2 className='text-xl font-bold mb-4'>Desktop View</h2>
      <div className='mb-2'>
        <label>Email HTML:</label>
        
      </div>
    </div>
  );
};

export default DesktopViewSection;
