"use client"

import React from 'react';
import VariablePagePdf from './variablePagePdf';

interface Props {
  section: string;
  data: any;
}

const PreviewSection: React.FC<Props> = ({ section, data }) => {
  // Simple preview logic for each section
  switch (section) {
    case 'Variable Copy':
      return (
        <VariablePagePdf emailname='MAT-US-ELA-01313_Third-Party-email_ORSERDU-Monitoring-Requirements' data={data}/>
      );
    case 'Desktop view':
      return (
        <div>
          <h3 className='font-bold'>Preview: Desktop View</h3>
          <div dangerouslySetInnerHTML={{ __html: data.desktopHtml || '' }} />
        </div>
      );
    case 'Mobile view':
      return (
        <div>
          <h3 className='font-bold'>Preview: Mobile View</h3>
          <div dangerouslySetInnerHTML={{ __html: data.mobileHtml || '' }} />
        </div>
      );
    case 'alt name page':
      return (
        <div>
          <h3 className='font-bold'>Preview: Alt Name Page</h3>
          <pre>{data.altNames}</pre>
        </div>
      );
    default:
      return <div>Select a section to preview.</div>;
  }
};

export default PreviewSection;
