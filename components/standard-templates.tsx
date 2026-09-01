import React, { useMemo } from 'react'
import type { EmailTemplate, BrandId } from "@/types/template"
import { Plus } from 'lucide-react'
import { TemplateCard } from './template-card'
import { Button } from './ui/button'
import { ShimmerCardGrid } from "@/components/shimmer"
import { matchesBrand } from "@/lib/brand-filter"

type StandardTemplatesProps = {
  temps: EmailTemplate[];
  handleUseTemplate: (template: EmailTemplate) => void;
  handleEditTemplate: (template: EmailTemplate) => void;
  setDeleteDialog: (value: { open: boolean; template: EmailTemplate | null }) => void;
  handleDuplicateTemplate: (template: EmailTemplate) => void;
  handleCreateBlank: () => void;
  loading: boolean;
  selectedBrand?: BrandId;
};

export default function StandardTemplates({
  temps,
  handleUseTemplate,
  handleEditTemplate,
  setDeleteDialog,
  handleDuplicateTemplate,
  handleCreateBlank,
  loading,
  selectedBrand,
}: StandardTemplatesProps) {
  const standardTemps = useMemo(() => {
    if (!temps || temps.length === 0) return [];

    return [...temps]
      .filter(t => !t.isUserCreated)
      .filter(t => matchesBrand(t, selectedBrand))
      .slice(0, 4);
  }, [temps, selectedBrand]);

  return (
    <>
      {loading ? (
        <ShimmerCardGrid count={4} />
      ) : standardTemps.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm mb-4">
            {selectedBrand
              ? `No standard templates found for this brand yet.`
              : `No standard templates yet.`}
          </p>
          <Button onClick={handleCreateBlank} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
          {standardTemps.map((template) => (
            <div key={template.id} className="h-full">
              <TemplateCard
                template={template}
                onUse={() => handleUseTemplate(template)}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => setDeleteDialog({ open: true, template })}
                onDuplicate={() => handleDuplicateTemplate(template)}
                readOnly
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
