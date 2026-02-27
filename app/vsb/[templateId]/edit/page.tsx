"use client"

import React, { useState } from 'react';
import VariableCopySection from '../../../../components/vsb-sections/VariableCopySection';
import DesktopViewSection from '../../../../components/vsb-sections/DesktopViewSection';
import MobileViewSection from '../../../../components/vsb-sections/MobileViewSection';
import AltNamePageSection from '../../../../components/vsb-sections/AltNamePageSection';
import PreviewSection from '../../../../components/vsb-sections/PreviewSection';

function page() {
  // Section config
  const sectionConfig = {
    'Variable Copy': VariableCopySection,
    'Desktop view': DesktopViewSection,
    'Mobile view': MobileViewSection,
    'alt name page': AltNamePageSection,
  };

  const sectionList = Object.keys(sectionConfig);
  const [activeSection, setActiveSection] = useState(sectionList[0]);
  const [sectionData, setSectionData] = useState({
    'Variable Copy': [{ heading: '', options: [] }],
    'Desktop view': {},
    'Mobile view': {},
    'alt name page': [{ name: '', value: '' }],
  });

  const ActiveComponent = sectionConfig[activeSection];

  return (
    <div className='w-full flex items-center flex-col justify-center h-[100dvh]'>
      {/* main  content page*/}
      <div className='w-full h-[10vh] flex items-center  '>
        <h1 className='text-2xl font-bold pl-10'>Visual Story Board Builder</h1>
      </div>
      <div className='w-full h-[90vh]    flex items-start justify-center '>
        <div className='w-[80%]   border-black '>
          {/* VSB Section Cards */}
          <div className='flex w-full justify-around py-8'>
            {sectionList.map((section) => (
              <div
                key={section}
                className={`cursor-pointer w-48 h-32 flex items-center justify-center border-2 rounded-lg shadow-md text-lg font-semibold transition-all ${activeSection === section ? 'border-blue-700 bg-blue-100' : 'border-blue-400 hover:bg-blue-100'}`}
                onClick={() => setActiveSection(section)}
              >
                {section}
              </div>
            ))}
          </div>
          {/* Dynamic content area for selected section */}
          <div className='p-4'>
            <ActiveComponent
              data={sectionData[activeSection]}
              onChange={data => setSectionData(prev => ({ ...prev, [activeSection]: data }))}
            />
          </div>
        </div>
        <div className='w-[20%]  p-4 overflow-auto h-full'>
          <PreviewSection section={activeSection} data={sectionData[activeSection]} />
        </div>
      </div>
    </div>
  );
}

export default page
