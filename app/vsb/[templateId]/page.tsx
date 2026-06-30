"use client"

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useVSBStore, VSBData } from '@/store/vsb-store';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Edit2, Loader2, Download, Eye, Copy, Trash2 } from 'lucide-react';
import VariableCopySection from '@/components/vsb-sections/VariableCopySection';
import DesktopViewSection from '@/components/vsb-sections/DesktopViewSection';
import MobileViewSection from '@/components/vsb-sections/MobileViewSection';
import AltNamePageSection from '@/components/vsb-sections/AltNamePageSection';
import PreviewSection from '@/components/vsb-sections/PreviewSection';
import CombinedVSBView, { VSBPageWrapper } from '@/components/vsb-sections/CombinedVSBView';
import HeaderDetailsEditor from '@/components/vsb-sections/HeaderDetailsEditor';
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
  const combinedViewRef = useRef<{ handleDownloadPDF: () => void }>(null);

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
    if (!templateId) return;
    await createVSB({
      templateId,
      variableCopy: getVaribleCopyTemplate(currentTemplate?.category),
      altNamePage: { images: [{ name: '', value: '' }] },
      headerDetails: [
        { name: 'To', value: '[HCP’s email address]' },
        { name: 'From', value: '[Variable From]' },
        { name: 'Friendly From', value: 'Stemline Therapeutics, Inc.' },
        { name: 'Subject Line', value: '[Variable subject line]' },
        { name: 'Preheader', value: '[Variable preheader]' },
      ],
      
    });
    setActiveSection('Variable Copy');
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

  if (currentVsb) {
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
                data={currentVsb.headerDetails}
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
          return <CombinedVSBView ref={combinedViewRef} data={currentVsb} emailName={currentTemplate?.name || 'Template'} />;
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
              <Button onClick={() => combinedViewRef.current?.handleDownloadPDF()} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
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
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visual Story Boards</h1>
          <p className="text-gray-500 mt-1">Manage VSBs for {currentTemplate?.name || 'this template'}</p>
        </div>
        <Button onClick={handleCreateVSB} className="bg-blue-600 hover:bg-blue-700">
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


