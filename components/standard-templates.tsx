import React, { useMemo } from 'react'
import type { EmailTemplate } from "@/types/template"
import { Plus } from 'lucide-react'
import { TemplateCard } from './template-card'
import { Button } from './ui/button'
import { LoadingSpinner } from "@/components/loading-spinner"

type RecentTemplatesProps = {
  temps: EmailTemplate[];
  handleUseTemplate: (template: EmailTemplate) => void;
  handleEditTemplate: (template: EmailTemplate) => void;
   setDeleteDialog: (
    value: { open: boolean; template: EmailTemplate | null }
  ) => void;
  handleDuplicateTemplate: (template: EmailTemplate) => void;
  handleCreateBlank: () => void;
  loading : boolean;
};
export default function StandardTemplates({ temps, handleUseTemplate, handleEditTemplate, setDeleteDialog, handleDuplicateTemplate, handleCreateBlank , loading }: RecentTemplatesProps) {
    const standardTemps = useMemo(() => {
    if (!temps || temps.length === 0) return [];

    return [...temps]
        .filter(t => t.isUserCreated)
        .slice(0, 4);
        
    }, [temps]);
    console.log("====== "+ standardTemps)
  return (
    <>
      {
        loading ? (<div className="h-[30vh] flex items-center justify-center bg-gray-50">
                                  <LoadingSpinner message="Loading your email templates..." />
                              </div>) :
        (standardTemps.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <Button onClick={handleCreateBlank} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Template
            </Button>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {standardTemps.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => setDeleteDialog({ open: true, template })}
                onDuplicate={() => handleDuplicateTemplate(template)}
              />
            ))}
          </div>
        ))
    }
    </>
  )
}
