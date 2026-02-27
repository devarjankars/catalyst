"use client"

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVSBStore } from '@/store/vsb-store';
import { useEmailBuilderStore } from '@/store/email-builder-store';
import { Button } from '@/components/ui/button';

export default function VSBPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const { vsbs, fetchVSBs, createVSB, loading, error } = useVSBStore();
  const { currentTemplate, setCurrentTemplate, templateImages } = useEmailBuilderStore();

  // Fetch VSBs and template data on mount
  useEffect(() => {
    if (templateId) {
      fetchVSBs(templateId);
      // TODO: fetch template data if not already loaded
      // setCurrentTemplate(...)
    }
  }, [templateId, fetchVSBs]);

  // Handler to create a new VSB (demo: empty data)
  const handleCreateVSB = async () => {
    if (!templateId) return;
    await createVSB({
      templateId,
      variableCopy: {},
      altNamePage: {},
    });
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Visual Story Board (VSB) for Template</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Button onClick={handleCreateVSB} className="mb-4">Create New VSB</Button>
      <div className="space-y-4">
        {vsbs.length === 0 && <div>No VSBs found for this template.</div>}
        {vsbs.map(vsb => (
          <div key={vsb.id} className="border rounded p-4 flex flex-col gap-2">
            <div className="font-semibold">VSB ID: {vsb.id}</div>
            <div className="text-xs text-gray-500">Created: {vsb.createdAt}</div>
            <div className="text-xs text-gray-500">Updated: {vsb.updatedAt}</div>
            <Button size="sm" variant="outline" onClick={() => {/* TODO: navigate to edit/regenerate */}}>Edit/Regenerate</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
