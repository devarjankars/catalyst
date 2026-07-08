"use client"

import React from 'react'
import { VSBData } from '@/store/vsb-store'
import ALtnamePdfview from './ALtnamePdfview'
import VariablePagePdfView from './VariablePagePdfView'
import DesktopViewSection from './DesktopViewSection'
import MobileViewSection from './MobileViewSection'
import { useEmailBuilderStore } from '@/store/email-builder-store'

interface Props {
  data: VSBData;
  emailName: string;
}

export const VSBPageWrapper: React.FC<{
  title: string;
  number: number;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ title, number, children }) => (
  <div className="bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] border overflow-y-auto border-gray-100 rounded-lg mb-10 p-12 min-h-[1050px] relative flex flex-col">
    <div className="mb-8 border-b-2 border-[#006937] pb-3 flex justify-between items-end">
      <div>
        <h3 className="text-xl font-bold text-[#FF66CC] uppercase tracking-tight">{number}. {title}</h3>
      </div>
      <div className="text-[10px] text-gray-400 font-mono uppercase">VSB Component Section</div>
    </div>
    <div className="flex-1 overflow-auto">{children}</div>
    <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400">
      <span>Visual Story Board</span>
      <span>Page {number}</span>
    </div>
  </div>
)

const CombinedVSBView = ({ data, emailName }: Props) => {
  const { currentTemplate } = useEmailBuilderStore()

  return (
    <div className="flex flex-col gap-8 bg-gray-50/50 p-8 rounded-2xl min-h-screen">
      <div className="px-4">
        <h1 className="text-2xl font-black text-[#006937] uppercase tracking-tighter">{emailName}</h1>
        <p className="text-sm text-gray-500 font-medium italic">Combined VSB Document Preview</p>
      </div>

      <div className="space-y-4 text-black">
        <VSBPageWrapper title="Variable Copy" number={1}>
          <VariablePagePdfView emailname={emailName} data={data.variableCopy} headingColor={data.variableCopyHeadingColor} />
        </VSBPageWrapper>

        <VSBPageWrapper title="Desktop View" number={2} wide={currentTemplate?.optionMode === 'three'}>
          <DesktopViewSection data={data.desktopView} onChange={() => {}} isPreview={true} />
        </VSBPageWrapper>

        <VSBPageWrapper title="Mobile View" number={3} wide={currentTemplate?.optionMode === 'three'}>
          <MobileViewSection data={data.mobileView} onChange={() => {}} isPreview={true} />
        </VSBPageWrapper>

        <VSBPageWrapper title="Alt-Text Configuration" number={4}>
          <ALtnamePdfview data={data.altNamePage} emailName={emailName} />
        </VSBPageWrapper>
      </div>
    </div>
  )
}

export default CombinedVSBView
