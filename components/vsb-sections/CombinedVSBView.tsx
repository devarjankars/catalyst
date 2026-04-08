"use client"

import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { Button } from '../ui/button'
import { Download, Loader2, History } from 'lucide-react'
import { VSBData, useVSBStore } from '@/store/vsb-store'
import { firebaseService } from '@/services/firebase-service'
import { useParams } from 'next/navigation'
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ALtnamePdfview from './ALtnamePdfview'
import VariablePagePdfView from './VariablePagePdfView'
import DesktopViewSection from './DesktopViewSection'
import MobileViewSection from './MobileViewSection'
import { useEmailBuilderStore } from '@/store/email-builder-store'
import { generateEmailHTML } from '@/lib/email-generator'
import { generateCombinedPdfAction } from '@/app/actions'
import { reactToHtml } from '@/lib/react-to-html'

interface Props {
  data: VSBData;
  emailName: string;
}

const VSBPageWrapper: React.FC<{ title: string; number: number; children: React.ReactNode }> = ({ title, number, children }) => (
  <div
    className="bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-gray-100 rounded-lg mb-10 p-12 min-h-[1050px] w-full max-w-[850px] mx-auto relative flex flex-col"
  >
    <div className="mb-8 border-b-2 border-[#006937] pb-3 flex justify-between items-end">
      <div>
        <h3 className="text-xl font-bold text-[#FF66CC] uppercase tracking-tight">{number}. {title}</h3>
      </div>
      <div className="text-[10px] text-gray-400 font-mono uppercase">VSB Component Section</div>
    </div>
    <div className="flex-1 overflow-auto">
      {children}
    </div>
    <div className="mt-8 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400">
      <span>Visual Story Board</span>
      <span>Page {number}</span>
    </div>
  </div>
);

const CombinedVSBView = forwardRef(({ data, emailName }: Props, ref) => {
  const { currentTemplate } = useEmailBuilderStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedPages, setSelectedPages] = useState({
    variableCopy: true,
    desktopView: true,
    mobileView: true,
    altNamePage: true
  });

  useImperativeHandle(ref, () => ({
    handleDownloadPDF: () => {
      setDownloadDialogOpen(true);
    },
    handleUpVersion: () => {
      handleUpVersion();
    }
  }));

  const { updateVSB } = useVSBStore();
  const { templateId } = useParams() as { templateId: string };
  const [isUpVersioning, setIsUpVersioning] = useState(false);

  const generatePDFBlob = async (options?: {
    variableCopy: boolean;
    desktopView: boolean;
    mobileView: boolean;
    altNamePage: boolean;
  }) => {
    const headerDetails = data?.headerDetails || [];
    const htmlContent = generateEmailHTML(currentTemplate?.components || [], currentTemplate?.preheaderText || '');

    const includeVC = options ? options.variableCopy : true;
    const includeDV = options ? options.desktopView : true;
    const includeMV = options ? options.mobileView : true;
    const includeANP = options ? options.altNamePage : true;

    const variableCopyHtml = includeVC ? reactToHtml(<VariablePagePdfView data={data.variableCopy} emailname={emailName} headingColor={data.variableCopyHeadingColor} />) : undefined;
    const altNameHtml = includeANP ? reactToHtml(<ALtnamePdfview data={data.altNamePage} emailName={emailName} />) : undefined;

    const desktopHeaderHtml = `
      <div >
        <div style="margin-left : 20px; width:fit-content; border:1px solid #000; padding:5px;margin-bottom:10px;margin-top:10px;font-size:13px;">
          Desktop View
        </div>
        <div style="border-top:1px solid #000;">
          <div style="margin-bottom: 20px; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; padding-top: 20px;">
              ${headerDetails.map(detail => `
                  <div style="margin-bottom: 2px;">
                      <span style="font-weight: bold; color: black;">${detail.name}: </span>
                      <span style="color: ${detail.value.includes('[') || detail.value.includes(']') ? '#FF66CC' : 'black'};">
                        ${detail.value}
                      </span>
                  </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;

    const mobileHeaderHtml = `
      <div style="background-color: #fff;padding-top:10px;padding-bottom:20px;">
        <div style="margin-left : 20px; width:fit-content; border:1px solid #000; padding:5px;margin-bottom:10px;font-size:13px;background-color: #fff;color:black">
          Mobile View
        </div>
        <div style="border-top:1px solid #000;">
          <div style="margin-left: 20px; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; padding-top: 20px;">
              ${headerDetails.map(detail => `
                  <div style="margin-bottom: 2px;">
                      <span style="font-weight: bold; color: black;">${detail.name}: </span>
                      <span style="color: ${detail.value.includes('[') || detail.value.includes(']') ? '#FF66CC' : 'black'};">
                        ${detail.value}
                      </span>
                  </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;

    let desktopFinalHtml = htmlContent;
    let mobileFinalHtml = htmlContent;

    const firstDivEnd = htmlContent.indexOf('</div>');
    if (firstDivEnd !== -1) {
      desktopFinalHtml = htmlContent.slice(0, firstDivEnd + 6) + desktopHeaderHtml + htmlContent.slice(firstDivEnd + 6);
      mobileFinalHtml = htmlContent.slice(0, firstDivEnd + 6) + mobileHeaderHtml + htmlContent.slice(firstDivEnd + 6);
    }

    const base64Merged = await generateCombinedPdfAction({
      emailHtmlDesktop: includeDV ? desktopFinalHtml : undefined,
      emailHtmlMobile: includeMV ? mobileFinalHtml : undefined,
      variableCopyHtml: variableCopyHtml,
      altNameHtml: altNameHtml,
      emailName: emailName
    });

    // Convert base64 to Blob
    const byteCharacters = atob(base64Merged);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/pdf' });
  };

  const executeDownloadPDF = async (options?: {
    variableCopy: boolean;
    desktopView: boolean;
    mobileView: boolean;
    altNamePage: boolean;
  }) => {
    setIsGenerating(true);
    setDownloadDialogOpen(false);
    try {
      const pdfBlob = await generatePDFBlob(options);
      const url = URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${emailName}-VSB-Combined.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpVersion = async () => {
    if (!confirm('Are you sure you want to create a new version? This will archive the current version in history.')) return;

    setIsUpVersioning(true);
    try {
      const pdfBlob = await generatePDFBlob();
      const newPdfUrl = await firebaseService.uploadVSBPDF(pdfBlob, templateId, data.id);

      if (newPdfUrl) {
        const versions = data.versions || [];
        const currentVersion = data.currentVersion;

        const newVersions = currentVersion ? [...versions, currentVersion] : versions;

        await updateVSB(data.id, {
          currentVersion: newPdfUrl,
          versions: newVersions
        });

        alert('VSB successfully up-versioned!');
      }
    } catch (error) {
      console.error('Failed to up-version VSB:', error);
      alert('Failed to up-version VSB.');
    } finally {
      setIsUpVersioning(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 bg-gray-50/50 p-8 rounded-2xl min-h-screen">
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-2xl font-black text-[#006937] uppercase tracking-tighter">{emailName}</h1>
          <p className="text-sm text-gray-500 font-medium italic">Combined VSB Document Preview</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleUpVersion}
            disabled={isUpVersioning || isGenerating}
            variant="outline"
            className="border-[#006937] text-[#006937] hover:bg-green-50 shadow-sm px-6 h-12 rounded-xl transition-all"
          >
            {isUpVersioning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <History className="mr-2 h-5 w-5" />}
            {isUpVersioning ? 'Archiving...' : 'Up-version'}
          </Button>
          <Button
            onClick={() => setDownloadDialogOpen(true)}
            disabled={isGenerating || isUpVersioning}
            className="bg-[#006937] hover:bg-[#00522b] shadow-lg shadow-green-900/10 px-6 h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div className="space-y-0 text-black">
        {/* Page 1: Variable Copy */}
        <VSBPageWrapper title="Variable Copy" number={1}>
          <VariablePagePdfView emailname={emailName} data={data.variableCopy} headingColor={data.variableCopyHeadingColor} />
        </VSBPageWrapper>

        {/* Page 2: Desktop View */}
        <VSBPageWrapper title="Desktop View" number={2}>
          <DesktopViewSection data={data.desktopView} onChange={() => { }} isPreview={true} />
        </VSBPageWrapper>

        {/* Page 3: Mobile View */}
        <VSBPageWrapper title="Mobile View" number={3}>
          <MobileViewSection data={data.mobileView} onChange={() => { }} isPreview={true} />
        </VSBPageWrapper>

        {/* Page 4: Alt Name Page */}
        <VSBPageWrapper title="Alt-Text Configuration" number={4}>
          <ALtnamePdfview data={data.altNamePage} emailName={emailName} />
        </VSBPageWrapper>
      </div>

      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Download Selective Pages</DialogTitle>
            <DialogDescription>
              Select the pages you want to include in the combined PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 cursor-default">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="variableCopy"
                checked={selectedPages.variableCopy}
                onCheckedChange={(checked) => setSelectedPages(s => ({ ...s, variableCopy: checked === true }))}
              />
              <label htmlFor="variableCopy" className="text-sm font-medium leading-none cursor-pointer">
                1. Variable Copy
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="desktopView"
                checked={selectedPages.desktopView}
                onCheckedChange={(checked) => setSelectedPages(s => ({ ...s, desktopView: checked === true }))}
              />
              <label htmlFor="desktopView" className="text-sm font-medium leading-none cursor-pointer">
                2. Desktop View
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mobileView"
                checked={selectedPages.mobileView}
                onCheckedChange={(checked) => setSelectedPages(s => ({ ...s, mobileView: checked === true }))}
              />
              <label htmlFor="mobileView" className="text-sm font-medium leading-none cursor-pointer">
                3. Mobile View
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="altNamePage"
                checked={selectedPages.altNamePage}
                onCheckedChange={(checked) => setSelectedPages(s => ({ ...s, altNamePage: checked === true }))}
              />
              <label htmlFor="altNamePage" className="text-sm font-medium leading-none cursor-pointer">
                4. Alt-Text Configuration
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => executeDownloadPDF(selectedPages)}
              disabled={!selectedPages.variableCopy && !selectedPages.desktopView && !selectedPages.mobileView && !selectedPages.altNamePage}
              className="bg-[#006937] hover:bg-[#00522b] text-white"
            >
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
});

CombinedVSBView.displayName = 'CombinedVSBView';

export default CombinedVSBView;
