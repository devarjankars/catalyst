"use client"

import { generateVariableCopyPdfAction } from '@/app/actions';
import React from 'react'
import { useRef } from 'react';
import { Button } from '../ui/button';
import { reactToHtml } from '@/lib/react-to-html';
import VariablePagePdfView from './VariablePagePdfView';

interface Pdfprops {
  heading: string;
  options: string[];
}



function VariablePagePdf({ emailname, data, headingColor }: { emailname: string, data: Pdfprops[], headingColor?: string }) {
  const pageRef = useRef(null)
  const items = Array.isArray(data) ? data : [];




  return (
    <>
      {/* <div ref={pageRef} className='w-full bg-white p-4'>
        <h1 className='text-[13px] text-[#006937] font-bold mb-2'>{emailname}</h1>
        <h3 className='text-[11px] text-[#FF66CC] font-bold mb-3'>Variable copy</h3>

        {/* content hear 
        {items?.map((item, index) => (
            <div key={index} className='mb-4'>
                <h2 className='text-[11px] text-[#FF66CC] font-bold mb-1'>[{item.heading}]</h2>
                {Array.isArray(item.options) ? item.options.map((contentItem, contentIndex) => (
                    <p key={contentIndex} className='text-[10px] text-[#000000] '><span style={{"fontWeight" : "bold",marginRight : "2px"}}>Option {contentIndex+1} :</span>{contentItem}</p>
                )) : null}
            </div>
        ))}
    </div> */}
      <div ref={pageRef}>
        <VariablePagePdfView emailname={emailname} data={data} headingColor={headingColor} />
      </div>
      {/* <Button className='mt-2' onClick={handleDownload}>Download</Button> */}
    </>
  )
}

export default VariablePagePdf
