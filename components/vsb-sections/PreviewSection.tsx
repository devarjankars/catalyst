"use client"

import React from 'react';
import VariablePagePdf from './VariablePagePdf';
import ALtnamePdfview from './ALtnamePdfview';
import { useEmailBuilderStore } from '@/store/email-builder-store';

interface Props {
  section: string;
  data: any;
  headerDetails?: any[];
}

const HeaderDetailsPreview = ({ details }: { details?: any[] }) => {
  if (!details || details.length === 0) return null;
  return (
    <div className="bg-gray-50 border rounded p-3 mb-4 space-y-1">
      {details.map((detail, idx) => (
        <div key={idx} className=" text-[10px]">
          <span className="font-bold text-gray-500 uppercase">{detail.name}:</span>
          <span className="ml-1 text-gray-800">{detail.value}</span>
        </div>
      ))}
    </div>
  );
};

const PreviewSection: React.FC<Props> = ({ section, data, headerDetails }) => {
  const currentTemplate = useEmailBuilderStore(state=>state.currentTemplate);
  if (!data) return <div className="text-gray-400 italic">No data to preview</div>;


  switch (section) {
    case 'Variable Copy':
      return (
        <div className="border rounded bg-white shadow-sm overflow-hidden">
          <VariablePagePdf emailname={currentTemplate?.name || ''} data={data}/>
        </div>
      );
    // case 'Desktop view':
    //   return (
    //     <div className="space-y-2">
    //       <h3 className='font-bold text-sm text-gray-500 uppercase'>Desktop View</h3>
    //       <HeaderDetailsPreview details={headerDetails} />
    //       <div className="border rounded bg-white p-2 min-h-[200px] overflow-auto">
    //          {data.html ? (
    //              <div dangerouslySetInnerHTML={{ __html: data.html }} />
    //          ) : (
    //              <div className="text-gray-400 italic text-center py-10">No desktop HTML content</div>
    //          )}
    //       </div>
    //     </div>
    //   );
    // case 'Mobile view':
    //   return (
    //     <div className="space-y-2">
    //       <h3 className='font-bold text-sm text-gray-500 uppercase'>Mobile View</h3>
    //       <HeaderDetailsPreview details={headerDetails} />
    //       <div className="border rounded bg-white p-2 min-h-[200px] overflow-auto max-w-[300px] mx-auto">
    //          {data.html ? (
    //              <div dangerouslySetInnerHTML={{ __html: data.html }} />
    //          ) : (
    //              <div className="text-gray-400 italic text-center py-10">No mobile HTML content</div>
    //          )}
    //       </div>
    //     </div>
    //   );
    case 'alt name page':
      return (
         <ALtnamePdfview data={data}  />
      );
    default:
      return <div className="text-gray-400 italic">Select a section to preview.</div>;
  }
};

export default PreviewSection;
