'use client'

export const dynamic = 'force-dynamic'
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Search, X, Mail, Send, Globe } from "lucide-react"
import { useEffect, useState } from "react"
import { EmailTemplate } from "@/types/template"
import { ShimmerCardGrid } from "@/components/shimmer"
import { firebaseService } from "@/services/firebase-service"
import { TemplateCard } from "@/components/template-card"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"


export default function ManageTemplates() {
   const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const router = useRouter();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: EmailTemplate | null }>({
    open: false,
    template: null,
  })
  useEffect(() => {
        loadTemplates();
        
        setFilteredTemplates(templates);
      }, [])
  useEffect(() => {
        handleSearch();
  }, [templates, searchQuery, selectedCategory])
    const handleSearch = () => {
      let temps = [...templates].sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
      if (selectedCategory !== "all") {
        temps = temps.filter(t => t.category === selectedCategory)
      }
      if(searchQuery.trim()){
        temps = temps.filter(tem => tem.name.toLocaleLowerCase().includes(searchQuery.toLowerCase()) || tem.description.toLowerCase().includes(searchQuery.toLowerCase()))
      }
      setFilteredTemplates(temps);
    }
    const loadTemplates = async () => {
       setLoading(true);
       try{
          const loadedTemplates = await firebaseService.getAllTemplates();
          setTemplates(
            loadedTemplates
              .filter(t => t.isUserCreated)
              .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
          );
       }catch(error){
        console.error("Failed to load templates:", error)
       }finally{
          setLoading(false);
         
       }
    }
    const handleUseTemplate = async (template: EmailTemplate) => {
    // Navigate to builder with copy flag - template will be loaded but not saved until user saves
    router.push(`/builder?template=${template.id}&copy=true&keepImages=true&name=${encodeURIComponent(template.name)}&selectMode=true`)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    // Only allow editing of user-created templates (not sample templates)
    if (template.isUserCreated) {
      router.push(`/builder?template=${template.id}&edit=true`)
    } else {
      // For sample templates, create a copy instead
      handleUseTemplate(template)
    }
  }

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    try {
      await firebaseService.deleteTemplate(template.id)
      setTemplates((prev) => prev.filter((t) => t.id !== template.id))
      setDeleteDialog({ open: false, template: null })
    } catch (error) {
      console.error("Failed to delete template:", error)
      alert("Failed to delete template. Please try again.")
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      const duplicated = await firebaseService.duplicateTemplate(template.id)
      setTemplates((prev) => [duplicated, ...prev])
    } catch (error) {
      console.error("Failed to duplicate template:", error)
      alert("Failed to duplicate template. Please try again.")
    }
  }
  return (
    <div className="h-screen bg-gray-50 flex flex-col py-2 px-8">
          <div className="mt-4">
            <div className="px-4 sm:px-6 lg:px-8 py-8 border rounded-lg bg-[linear-gradient(168deg,rgba(255,160,162,1)_0%,rgba(255,239,239,1)_100%)]" >
              <div className="flex flex-col items-start">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-8 w-full">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors" />
                  <Input
                    placeholder="Search emailers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-11 w-full rounded-full border-0 bg-white/70 backdrop-blur-sm text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition-all duration-200 placeholder:text-slate-400 hover:bg-white hover:shadow-md hover:ring-slate-300/80 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#BC2030]/30 focus-visible:shadow-lg focus-visible:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {([
                    { id: "all",       label: "All",       icon: null },
                    { id: "rte",       label: "RTE",       icon: Mail },
                    { id: "sfmc",      label: "SFMC",      icon: Send },
                    { id: "unbranded", label: "Unbranded", icon: Globe },
                    { id: "other",     label: "Other",     icon: null },
                  ] as const).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSelectedCategory(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedCategory === id
                          ? "bg-[#BC2030] text-white border-[#BC2030]"
                          : "bg-white text-gray-600 border-gray-300 hover:border-[#BC2030] hover:text-[#BC2030]"
                      }`}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
                
              </div>
            </div>
          </div>
           <div className="overflow-y-auto p-4 h-full overflow-hidden">
          
          <div className="Templates mt-6">
            <div className="header flex items-center justify-between mb-4">
              <h1 className="font-bold">All Emailers</h1>
            </div>
            <div className="templates">
                  <div className="templates">
                            {loading ? <ShimmerCardGrid count={8} /> : templates.length === 0 ? (
                            <div className="text-center py-12">
                              {/* <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <Plus className="w-8 h-8 text-gray-400" />
                              </div> */}
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchQuery !== "all" ? "No templates found" : "No templates yet"}
                              </h3>
                              <p className="text-gray-600 mb-6">
                                {searchQuery !== "all"
                                  ? "Try adjusting your search or filter criteria"
                                  : ""}
                              </p>
                              {/* <Button onClick={handleCreateBlank} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Create Your First Template
                              </Button> */}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {filteredTemplates.length <= 0 ? (<h3 className="text-lg font-medium text-gray-900 mb-2">
                                No templates found
                              </h3>) : (filteredTemplates.map((template) => (
                                <TemplateCard
                                  key={template.id}
                                  template={template}
                                  onUse={() => handleUseTemplate(template)}
                                  onEdit={() => handleEditTemplate(template)}
                                  onDelete={() => setDeleteDialog({ open: true, template })}
                                  onDuplicate={() => handleDuplicateTemplate(template)}
                                />
                              ))) }
                             
                            </div>
                          )}
                            
                              </div> 
            </div>
          </div>
          </div>
          <DeleteConfirmDialog
        open={deleteDialog.open}
        template={deleteDialog.template}
        onConfirm={() => deleteDialog.template && handleDeleteTemplate(deleteDialog.template)}
        onCancel={() => setDeleteDialog({ open: false, template: null })}
      />
    </div>
  )
}

