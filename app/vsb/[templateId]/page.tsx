"use client"

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useVSBStore, VSBData } from '@/store/vsb-store';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Edit2, Loader2, Download, Eye, Copy, Trash2, History } from 'lucide-react';
import VariableCopySection from '@/components/vsb-sections/VariableCopySection';
import DesktopViewSection from '@/components/vsb-sections/DesktopViewSection';
import MobileViewSection from '@/components/vsb-sections/MobileViewSection';
import AltNamePageSection from '@/components/vsb-sections/AltNamePageSection';
import PreviewSection from '@/components/vsb-sections/PreviewSection';
import CombinedVSBView, { VSBPageWrapper } from '@/components/vsb-sections/CombinedVSBView';
import HeaderDetailsEditor from '@/components/vsb-sections/HeaderDetailsEditor';
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { generateEmailHTML } from '@/lib/email-generator';
import { generateVsbPdfBlob, buildVariableCopyHtml, buildAltNameHtml, type VsbPdfPageSpec } from '@/lib/vsb-pdf-export';
import { firebaseService } from '@/services/firebase-service';
import { getVaribleCopyTemplate } from '@/types/variableSectionTemplate';

type SectionType = 'Variable Copy' | 'Desktop view' | 'Mobile view' | 'alt name page' | 'Combined Preview';

export default function VSBPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.templateId as string;
  const { vsbs, currentVsb, fetchVSBs, createVSB, updateVSB, deleteVSB, duplicateVSB, setCurrentVsb, loading, error, hasUnsavedChanges, saveVSB } = useVSBStore();
  const { currentTemplate, loadTemplateImages } = useEmailBuilderStore();

  const [activeSection, setActiveSection] = useState<SectionType>('Variable Copy');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isConnectingToMRL , seisConnectingToMRL] = useState(false)
  const [mlrDialogOpen, setMlrDialogOpen] = useState(false);
  const [mlrDialogStep, setMlrDialogStep] = useState<'idle' | 'downloading' | 'connecting' | 'redirecting' | 'success' | 'error'>('idle');
  const [mlrDialogMessage, setMlrDialogMessage] = useState('Preparing the MLR connection...');

  // Download dialog state
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isUpVersioning, setIsUpVersioning] = useState(false);
  const [selectedPages, setSelectedPages] = useState({
    variableCopy: true,
    desktopView:  true,
    mobileView:   true,
    altNamePage:  true,
  });

  const generatePDFBlob = async (options?: {
    variableCopy: boolean;
    desktopView:  boolean;
    mobileView:   boolean;
    altNamePage:  boolean;
  }) => {
    if (!currentVsb) throw new Error('No VSB selected');

    const emailName  = currentTemplate?.name || 'Template';
    const includeVC  = options ? options.variableCopy : true;
    const includeDV  = options ? options.desktopView  : true;
    const includeMV  = options ? options.mobileView   : true;
    const includeANP = options ? options.altNamePage  : true;

    const pages: VsbPdfPageSpec[] = [];

    if (includeVC) {
      pages.push({
        html: buildVariableCopyHtml(currentVsb.variableCopy, emailName, currentVsb.variableCopyHeadingColor),
        width: 600,
        // Use the browser layout so spacing matches the Combined View exactly.
        mode: 'image',
      });
    }

    const isThreeMode = currentTemplate?.optionMode === 'three';
    const headerDetails = currentVsb?.headerDetails || [];

    // imageOptionTitle is the label shown centered above each desktop emailer.
    // No dedicated field exists on EmailTemplate, so it is derived from the
    // option index.  Format matches the manual reference PDF:
    //   "Option 1 - Image Option 1", "Option 2 - Image Option 2", etc.
    const optArray = isThreeMode
      ? [
          { title: 'Option 1', imageOptionTitle: 'Option 1 - Image Option 1', components: currentTemplate?.components        || [] },
          { title: 'Option 2', imageOptionTitle: 'Option 2 - Image Option 2', components: currentTemplate?.option2Components || [] },
          { title: 'Option 3', imageOptionTitle: 'Option 3 - Image Option 3', components: currentTemplate?.option3Components || [] },
        ]
      : [{ title: 'Standard View', imageOptionTitle: '', components: currentTemplate?.components || [] }];

    // ── Header block ──────────────────────────────────────────────────────────
    // label       : the left-aligned label used for mobile (e.g. "Mobile View - Option 1")
    //               also used as fallback for desktop when no centerLabel is given.
    // centerLabel : when provided (desktop three-mode), the title box is
    //               centered within its column (e.g. "Option 1 - Image Option 1").
    //               Metadata below it stays left-aligned regardless.
    // mobile      : switches class names to the pdf-mobile-email-meta BEM tree.
    const makeHeaderHtml = (label: string, mobile = false, centerLabel?: string) => {
      const baseClass    = mobile ? 'pdf-mobile-email-meta'          : 'pdf-email-meta';
      const titleClass   = mobile ? 'pdf-mobile-email-meta__title'   : 'pdf-email-meta__title';
      const divClass     = mobile ? 'pdf-mobile-email-meta__divider' : 'pdf-email-meta__divider';
      const detailsClass = mobile ? 'pdf-mobile-email-meta__details' : 'pdf-email-meta__details';
      const rowClass     = mobile ? 'pdf-mobile-email-meta__row'     : 'pdf-email-meta__row';

      // Title box is always LEFT-ALIGNED at 20px from the column edge.
      // centerLabel is kept as the display text (e.g. "Option 1 - Image Option 1")
      // but it is no longer centered — it aligns with the metadata beneath it.
      const titleStyle = 'display:table;width:fit-content;margin-top:18px;margin-right:0;margin-bottom:18px;margin-left:20px;border:1px solid #000;padding:5px 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:black;font-weight:bold;text-align:left;';

      const titleText = centerLabel && !mobile ? centerLabel : label;

      return `
      <div class="${baseClass}" style="width:100%;box-sizing:border-box;background-color:#fff;text-align:left;">
        <div class="${titleClass}" style="${titleStyle}">
          ${titleText}
        </div>
        <div class="${divClass}" style="border-top:1px solid #000;padding-bottom:10px;">
          <div class="${detailsClass}" style="display:table;width:auto;margin:0 0 0 20px;padding-top:20px;font-family:Arial,sans-serif;font-size:11px;line-height:1.5;text-align:left;">
            ${headerDetails.map(detail => `
              <div class="${rowClass}" style="margin-bottom:2px;text-align:left;white-space:normal;">
                <span style="font-weight:bold;color:black;">${detail.name}: </span><span style="color:${detail.value.includes('[') || detail.value.includes(']') ? '#FF66CC' : 'black'};">${detail.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
    };

    // Inject header immediately after <body ...> — always present in every
    // generated email, unlike the specific table selector which can be absent.
    const injectHeader = (rawHtml: string, headerHtml: string) => {
      const bodyTagMatch = rawHtml.match(/<body[^>]*>/i);
      if (bodyTagMatch) {
        const idx = rawHtml.indexOf(bodyTagMatch[0]) + bodyTagMatch[0].length;
        return rawHtml.slice(0, idx) + headerHtml + rawHtml.slice(idx);
      }
      return headerHtml + rawHtml;
    };

    const normalizeEmailHtml = (raw: string, width: number) => raw.replace(
      /<body([^>]*)>/i,
      (_match, attributes: string) => {
        const existingStyle = attributes.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i)?.[2] || '';
        const attributesWithoutStyle = attributes.replace(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i, '');
        const mergedStyle = `${existingStyle};margin:0;padding:0;width:${width}px;`;
        return `<body${attributesWithoutStyle} style="${mergedStyle}">`;
      },
    );

    const desktopHtmls = optArray.map(opt => {
      const raw = generateEmailHTML(opt.components, currentTemplate?.preheaderText || '');
      const normalized = normalizeEmailHtml(raw, 600);
      // Pass imageOptionTitle as centerLabel so the title box is centered in
      // its 600px column.  Mobile does not use a centerLabel — its title is
      // left-aligned like the metadata beneath it.
      return injectHeader(normalized, makeHeaderHtml(`Desktop View - ${opt.title}`, false, opt.imageOptionTitle || `Desktop View - ${opt.title}`));
    });

    const mobileHtmls = optArray.map(opt => {
      const raw = generateEmailHTML(opt.components, currentTemplate?.preheaderText || '');
      const normalized = normalizeEmailHtml(raw, 375);

      // ── Force mobile media-query rules unconditionally ──────────────────────
      // When three mobile columns are rendered side-by-side, the Playwright
      // viewport is ~1205px wide. The @media (max-width:480px) in the email
      // <head> never fires, so mobile-only components stay hidden and
      // desktop-only components stay visible — wrong images, wrong layout.
      //
      // Fix: inject a <style> block that applies the same show/hide rules as
      // the media query, but without the media query condition. Each column
      // gets its own <style> so it renders as if it were in a 375px viewport.
      const mobileOverrideStyle = `<style>
        .mbl-show-table { display: table !important; }
        .mbl-show-tr    { display: table-row !important; }
        .mbl-show-cell  { display: table-cell !important; }
        .desk-show-table { display: none !important; }
        .desk-show-tr    { display: none !important; }
        .desk-show-cell  { display: none !important; }
        .mobile  { display: inline-block !important; }
        .desktop { display: none !important; }
        .deskDisp { display: none !important; }
        .mbDisp   { display: table !important; }
      </style>`;

      // Inject the override into <head> so it has higher specificity than the
      // original stylesheet but is still overridable by inline styles.
      const withMobileStyles = normalized.replace(
        /<\/head>/i,
        `${mobileOverrideStyle}</head>`,
      );

      // Mobile: left-aligned title, no centerLabel.
      return injectHeader(withMobileStyles, makeHeaderHtml(`Mobile View - ${opt.title}`, true));
    });

    if (includeDV) {
      if (isThreeMode) {
        // Three options side-by-side on one landscape page.
        // pageWidth = 3 × 600 + 2 × 24 (gap) + 2 × 24 (outer pad) = 1896px
        const COL_W   = 600;
        const GAP     = 24;
        const PADDING = 24;
        pages.push({
          columns: desktopHtmls.map((html) => ({ html, width: COL_W, variant: 'desktop' as const })),
          gap:       GAP,
          pageWidth: COL_W * 3 + GAP * 2 + PADDING * 2,
        });
      } else {
        pages.push({ html: desktopHtmls[0], width: 600 });
      }
    }

    if (includeMV) {
      if (isThreeMode) {
        // Three mobile options side-by-side on one landscape page.
        // pageWidth = 3 × 375 + 2 × 16 (gap) + 2 × 20 (outer pad) = 1205px
        const MOB_W   = 375;
        const GAP     = 16;
        const PADDING = 20;
        pages.push({
          columns: mobileHtmls.map((html) => ({ html, width: MOB_W, variant: 'mobile' as const })),
          gap:       GAP,
          pageWidth: MOB_W * 3 + GAP * 2 + PADDING * 2,
        });
      } else {
        // Single mobile option — centered on its own page.
        pages.push({ html: mobileHtmls[0], width: 375 });
      }
    }

    if (includeANP) {
      pages.push({
        html: buildAltNameHtml(currentVsb.altNamePage, emailName),
        width: 600,
        // Capture this page with the browser layout so its output matches the
        // combined preview and uploaded images keep their CSS dimensions.
        mode: 'image',
      });
    }

    if (pages.length === 0) throw new Error('No pages selected for PDF generation');

    return generateVsbPdfBlob(pages);
  };

  const executeDownloadPDF = async (options?: {
    variableCopy: boolean;
    desktopView:  boolean;
    mobileView:   boolean;
    altNamePage:  boolean;
  }) => {
    if (!currentVsb) return;
    
    setIsGeneratingPdf(true);
    setDownloadDialogOpen(false);
    try {
      const pdfBlob = await generatePDFBlob(options);
      const url  = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${currentTemplate?.name || 'Template'}-VSB-Combined.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert(`Failed to download PDF.\n\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleUpVersion = async () => {
    if (!currentVsb) return;
    if (!confirm('Are you sure you want to create a new version? This will archive the current version in history.')) return;

    setIsUpVersioning(true);
    try {
      const pdfBlob = await generatePDFBlob();
      const newPdfUrl = await firebaseService.uploadVSBPDF(pdfBlob, templateId, currentVsb.id);

      if (newPdfUrl) {
        const versions = currentVsb.versions || [];
        const currentVersion = currentVsb.currentVersion;
        const versionUpdates = {
          currentVersion: newPdfUrl,
          versions: currentVersion ? [...versions, currentVersion] : versions,
        };

        // Persist version data directly to Firestore (store's updateVSB is local-only)
        const success = await firebaseService.updateVSB(currentVsb.id, versionUpdates);
        if (success) {
          // Sync local Zustand state to reflect the saved changes
          await updateVSB(currentVsb.id, versionUpdates);
          alert('VSB successfully up-versioned!');
        } else {
          alert('PDF uploaded but failed to save version to database. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to up-version VSB:', error);
      alert('Failed to up-version VSB.');
    } finally {
      setIsUpVersioning(false);
    }
  };

  // Handle unsaved changes warning on page close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Fetch VSBs and template data on mount
  useEffect(() => {
    if (templateId) {
      fetchVSBs(templateId);
      loadTemplateImages(templateId);
      useEmailBuilderStore.getState().loadTemplate(templateId);
    }
  }, [templateId, fetchVSBs, loadTemplateImages]);

  const handleCreateVSB = async () => {
    if (!templateId || loading || currentTemplate?.id !== templateId) return;
    const newVsb = await createVSB({
      templateId,
      variableCopy: getVaribleCopyTemplate(currentTemplate?.category),
      altNamePage: { images: [{ name: '', value: '' }] },
      headerDetails: [
        { name: 'To', value: '[HCPÃ¢â‚¬â„¢s email address]' },
        { name: 'From', value: '[Variable From]' },
        { name: 'Friendly From', value: 'Stemline Therapeutics, Inc.' },
        { name: 'Subject Line', value: '[Variable subject line]' },
        { name: 'Preheader', value: '[Variable preheader]' },
      ],
      
    });
    if (newVsb) setActiveSection('Variable Copy');
  };

  const handleEditVSB = (vsb: VSBData) => {
    setCurrentVsb(vsb);
    setActiveSection('Variable Copy');
  };

  const handleDuplicateVSB = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await duplicateVSB(id);
  };

  const handleDeleteVSB = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this VSB?')) {
      await deleteVSB(id);
    }
  };

  const handleBackNavigation = ()=>{
    router.back()
  }


 const handleMLRconnection = async () => {
  const mlrUrl = encodeURI(
    `http://tuned.mlrcatalyst.com/MLRCatalyst/VerifyOTP?emailAddress=stalin.br@medtrixhealthcare.com`
  );

  setMlrDialogOpen(true);
  setMlrDialogStep('downloading');
  setMlrDialogMessage('Preparing the PDF download...');
  seisConnectingToMRL(true);

  try {
    await executeDownloadPDF();

    setMlrDialogStep('connecting');
    setMlrDialogMessage('The PDF download is complete. Connecting to MLR...');

    const response = await fetch('http://34.55.227.107:8000/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email: 'kumar@medtrixhealthcare.com' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to connect to MLR:', response.statusText);
      setMlrDialogStep('error');
      setMlrDialogMessage('The MLR connection could not be completed. Please try again.');
      return;
    }

    // 3. Open the MLR link only after both steps succeed
   const anchor = document.createElement('a');
    anchor.href = mlrUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setMlrDialogStep('success');
    setMlrDialogMessage('The MLR page is opening. You can close this dialog once the new tab appears.');
  } catch (error) {
    console.error('Error during MLR connection:', error);
    setMlrDialogStep('error');
    setMlrDialogMessage('Something went wrong while connecting to MLR. Please try again.');
  } finally {
    seisConnectingToMRL(false);
    setMlrDialogOpen(true);
  }
};

  const handleUpdateData = (section: string, data: any) => {
    if (!currentVsb) return;

    let updates: Partial<VSBData> = {};
    if (section === 'Variable Copy') updates.variableCopy = data;
    if (section === 'alt name page') updates.altNamePage = data;
    if (section === 'headerDetails') updates.headerDetails = data;

    updateVSB(currentVsb.id, updates);
  };

  const sectionList: SectionType[] = [
    'Variable Copy',
    'Desktop view',
    'Mobile view',
    'alt name page',
    'Combined Preview'
  ];

  if (currentVsb?.templateId === templateId) {
    const renderActiveSection = () => {
      switch (activeSection) {
        case 'Variable Copy':
          return <VariableCopySection 
            data={currentVsb.variableCopy} 
            color={currentVsb.variableCopyHeadingColor}
            onColorChange={(color) => updateVSB(currentVsb.id, { variableCopyHeadingColor: color })}
            onChange={(data) => handleUpdateData('Variable Copy', data)} 
          />;
        case 'Desktop view':
          return (
            <div className="space-y-6 ">
              <HeaderDetailsEditor
                data={currentVsb.headerDetails || []}
                onChange={(data) => handleUpdateData('headerDetails', data)}
              />
              <VSBPageWrapper title="Desktop View" number={2} wide={currentTemplate?.optionMode === 'three'}>
                <DesktopViewSection data={currentVsb.desktopView} onChange={(data) => handleUpdateData('Desktop view', data)} isPreview={true} />
              </VSBPageWrapper>
            </div>
          );
        case 'Mobile view':
          return (
            <div className="space-y-6">
              <VSBPageWrapper title="Mobile View" number={3} wide={currentTemplate?.optionMode === 'three'}>
                <MobileViewSection data={currentVsb.mobileView} onChange={(data) => handleUpdateData('Mobile view', data)} isPreview={true} />
              </VSBPageWrapper>
            </div>
          );
        case 'alt name page':
          return <AltNamePageSection data={currentVsb.altNamePage} onChange={(data) => handleUpdateData('alt name page', data)} />;
        case 'Combined Preview':
          return <CombinedVSBView data={currentVsb} emailName={currentTemplate?.name || 'Template'} />;
        default:
          return null;
      }
    };

    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              if (hasUnsavedChanges) {
                setShowExitDialog(true);
              } else {
                setCurrentVsb(null);
              }
            }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">VSB Editor: {currentTemplate?.name || 'Template'}</h1>
          </div>
          <div className="flex items-center gap-2">
            
            {activeSection === 'Combined Preview' && 
            (<Button className='bg-red-500' onClick={handleMLRconnection}>
              {isConnectingToMRL && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} Connect to MLR
            </Button>)}
            <Button variant="outline" onClick={() => {
              if (hasUnsavedChanges) {
                setShowExitDialog(true);
              } else {
                setCurrentVsb(null);
              }
            }}>Back to List</Button>

            <Button 
              onClick={() => saveVSB(currentVsb.id)} 
              disabled={!hasUnsavedChanges || loading}
              className={hasUnsavedChanges ? "bg-amber-600 hover:bg-amber-700 text-white font-medium" : "bg-gray-100 text-gray-500"}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasUnsavedChanges ? "Save Changes" : "Saved"}
            </Button>

            {activeSection === 'Combined Preview' && (
              <>
                <Button
                  onClick={handleUpVersion}
                  disabled={isUpVersioning || isGeneratingPdf}
                  variant="outline"
                  className="border-[#006937] text-[#006937] hover:bg-green-50"
                >
                  {isUpVersioning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                  {isUpVersioning ? 'Archiving...' : 'Up-version'}
                </Button>
                <Button onClick={() => setDownloadDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                  {isGeneratingPdf ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Download PDF
                </Button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r bg-white flex flex-col p-4 gap-2 shrink-0 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sections</div>
            {sectionList.map((section) => (
              <Button
                key={section}
                variant={activeSection === section ? "default" : "ghost"}
                className={`justify-start ${activeSection === section ? 'bg-blue-600' : ''}`}
                onClick={() => setActiveSection(section)}
              >
                {section === 'Combined Preview' ? <Eye className="mr-2 h-4 w-4" /> : null}
                {section}
              </Button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto  p-8">
            <div className={`${currentTemplate?.optionMode === 'three' && (activeSection === 'Desktop view' || activeSection === 'Mobile view') ? 'w-full' : 'max-w-4xl mx-auto'}`}>
              {renderActiveSection()}
            </div>
          </div>
{/* 
          <aside className="w-80 border-l bg-white p-4 overflow-y-auto shrink-0 hidden lg:block">
            <h3 className="font-semibold mb-4 text-gray-500 uppercase text-xs">Preview</h3>
            <PreviewSection
              section={activeSection as any}
              data={
                activeSection === 'Variable Copy' ? currentVsb.variableCopy :
                  activeSection === 'alt name page' ? currentVsb.altNamePage :
                    activeSection === 'Desktop view' ? currentVsb.desktopView :
                      currentVsb.mobileView
              }
              headerDetails={currentVsb.headerDetails}
              variableCopyHeadingColor={currentVsb.variableCopyHeadingColor}
            />
          </aside> */}
        </main>

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to go back? Any unsaved edits will be lost permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setCurrentVsb(null)} className="bg-red-600 hover:bg-red-700">
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Download Selective Pages</DialogTitle>
              <DialogDescription>
                Select the pages you want to include in the combined PDF.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 cursor-default">
              {[
                { id: 'variableCopy', label: '1. Variable Copy' },
                { id: 'desktopView',  label: '2. Desktop View'  },
                { id: 'mobileView',   label: '3. Mobile View'   },
                { id: 'altNamePage',  label: '4. Alt-Text Configuration' },
              ].map(({ id, label }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox
                    id={id}
                    checked={selectedPages[id as keyof typeof selectedPages]}
                    onCheckedChange={(checked) =>
                      setSelectedPages(s => ({ ...s, [id]: checked === true }))
                    }
                  />
                  <label htmlFor={id} className="text-sm font-medium leading-none cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => executeDownloadPDF(selectedPages)}
                disabled={!Object.values(selectedPages).some(Boolean) || isGeneratingPdf}
                className="bg-[#006937] hover:bg-[#00522b] text-white"
              >
                {'Download PDF'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={mlrDialogOpen} onOpenChange={(open) => {
          if (!isConnectingToMRL) {
            setMlrDialogOpen(open);
          }
        }}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Connecting to MLR</DialogTitle>
              <DialogDescription>{mlrDialogMessage}</DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-4">
              {(mlrDialogStep === 'downloading' || mlrDialogStep === 'connecting' || mlrDialogStep === 'redirecting') && (
                <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-blue-600" />
              )}
              <div className="text-sm text-slate-700">
                {mlrDialogStep === 'downloading' && 'Downloading the combined PDF...'}
                {mlrDialogStep === 'connecting' && 'Preparing the MLR connection request...'}
                {mlrDialogStep === 'redirecting' && 'Opening the MLR portal in a new tab...'}
                {mlrDialogStep === 'success' && 'The MLR page is opening. You can close this dialog once the new tab appears.'}
                {mlrDialogStep === 'error' && 'The connection could not be completed. Please try again.'}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMlrDialogOpen(false)}
                disabled={mlrDialogStep === 'downloading' || mlrDialogStep === 'connecting' || mlrDialogStep === 'redirecting'}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><span><ArrowLeft onClick={handleBackNavigation} className='hover:translate-x-1 cursor-pointer'/></span>Visual Story Boards</h1>
          <p className="text-gray-500 mt-1">Manage VSBs for {currentTemplate?.name || 'this template'}</p>
        </div>
        <Button onClick={handleCreateVSB} disabled={loading || currentTemplate?.id !== templateId} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Create New VSB
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vsbs.filter(v => v.templateId === templateId).length === 0 && !loading && (
          <div className="col-span-full border-2 border-dashed rounded-xl p-12 text-center text-gray-500">
            No VSBs found for this template. Click "Create New VSB" to get started.
          </div>
        )}
        {vsbs.filter(v => v.templateId === templateId).map(vsb => (
          <Card key={vsb.id} className="hover:shadow-lg transition-shadow cursor-pointer relative group" onClick={() => handleEditVSB(vsb)}>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white shadow-sm border" onClick={(e) => handleDuplicateVSB(e, vsb.id)} title="Duplicate">
                <Copy className="h-4 w-4 text-blue-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-white shadow-sm border" onClick={(e) => handleDeleteVSB(e, vsb.id)} title="Delete">
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Created: {vsb.createdAt ? new Date(vsb.createdAt).toLocaleDateString() : 'N/A'}
              </CardTitle>
              {/* <Edit2 className="h-4 w-4 text-gray-400" /> */}
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold mb-1">VSB Version {vsbs.indexOf(vsb) + 1}</div>
              <div className="text-xs text-gray-500 mb-4">Last updated: {vsb.updatedAt ? new Date(vsb.updatedAt).toLocaleString() : 'N/A'}</div>
              <Button variant="secondary" size="sm" className="w-full">Edit Story Board</Button>
            </CardContent>
          </Card>
        ))}
      </div>}
    </div>
  );
}


