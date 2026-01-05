"use client"

import { useState, useEffect, useMemo , lazy , Suspense, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Calendar, ChevronRight } from "lucide-react"
import { TemplateCard } from "@/components/template-card"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { EmailTemplate } from "@/types/template"
import { firebaseService } from "@/services/firebase-service"
import CreateProjectDialog from "@/components/create-project"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {useClientStore} from "@/store/client-store"
import Link from "next/link"
import Tasktable from "@/components/task-table"
import { useLoggedInUserStore } from "@/store/logged-in-user"
import dummyTasks from "@/data/dummy-tasks.json"

const RecentTemplates = lazy(() => import("@/components/recent-templates"));
const StandardTemplates = lazy(() => import("@/components/standard-templates"))
export default function Dashboard() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userName , setUserName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedclients, setSelectedclients] = useState<string>("elzonris");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: EmailTemplate | null }>({
    open: false,
    template: null,
  })
  const [showAll, setShowAll] = useState(false);
  const [openCreate , setCreate] = useState(false);
 const {clientsFolders} = useClientStore(); 
 const displayedFolders = showAll ? clientsFolders : clientsFolders.slice(0, 6);

  // const categories = [
  //   { id: "all", label: "All Templates", count: 0 },
  //   { id: "rte", label: "RTE", count: 0 },
  //   { id: "sfmc", label: "SFMC", count: 0 },
  //   { id: "unbranded", label: "Unbranded", count: 0 },
  //   { id: "other", label: "Other", count: 0 },
  // ]


  const {userEmail , userRole, userPermissions} = useLoggedInUserStore();
  // console.log("khdhwjh "  + userEmail);
  
// console.log(templates)
  useEffect(() => {
    loadTemplates();
    setUserName(() => getFirstNameFromEmail(userEmail));
  }, [])

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory])


  function getFirstNameFromEmail(email : string | null): string {
  if (!email || !email.includes("@")) return "";

  const localPart = email.split("@")[0];

  const firstName = localPart
    .split(/[._-]/)[0]
    .replace(/[^a-zA-Z]/g, "");

  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const loadedTemplates = await firebaseService.getAllTemplates()
      setTemplates(loadedTemplates)
    } catch (error) {
      console.error("Failed to load templates:", error)
    } finally {
      setLoading(false)
    }
  }

  
  

  const filterTemplates = () => {
    let filtered = templates

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((template) => template.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTemplates(filtered)
  }

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === "all") return templates.length
    return templates.filter((template) => template.category === categoryId).length
  }

  const handleCreateBlank = () => {
    router.push("/builder")
  }

  const handleUseTemplate = async (template: EmailTemplate) => {
    // Navigate to builder with copy flag - template will be loaded but not saved until user saves
    router.push(`/builder?template=${template.id}&copy=true&name=${encodeURIComponent(template.name)}`)
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

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <LoadingSpinner message="Loading your email templates..." />
  //     </div>
  //   )
  // }
   const handleCreate = () => {
    setCreate(true)
  };
  const handleFolderView = () => {
    router.push('/dashboard/folders');
  }
  const handlestandardTemps = () => {
    router.push('/dashboard/standard-templates');
  }
  const handleTaskview = () => {
    router.push('/dashboard/tasks');
  }
  return (
    <div className="max-h-screen bg-gray-50 grid grid-rows-[auto 1fr]">
      {/* Header */}
      <div className="sticky top-0 right-0 z-10 py-4 bg-white border-b border-gray-200 text-gray-800 shadow-sm">
        <h5 className="text-end px-3 font-mono">Hi {userName} </h5>
      </div>
      {/* <div className="sticky top-4 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border rounded-lg bg-[linear-gradient(168deg,rgba(255,160,162,1)_0%,rgba(255,239,239,1)_100%)]" >
          <div className="flex flex-col items-start">
            <div className="mb-5">
             
              <p className="text-lg text-[#101828] font-semibold">Create and manage your email templates</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 w-full">
              <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by client name, category, type etc"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-2/3 rounded-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter by category</span>
            </div>
           
           {(userRole === "superadmin" || userRole === "admin") && <Button onClick={handleCreate}  className="flex items-center gap-2 rounded-full px-6">
              <Plus className="w-4 h-4" />
              Create Project
            </Button>}
          </div>
            
          </div>
        </div>
      </div> */}
    <div className="overflow-y-auto">
      <div className="max-w-7xl h-full mx-auto py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* <div className="tasksList">
            <div className="header flex justify-between">
              <h1 className="font-bold mb-4">My Tasks</h1>
              <span role="button" className="text-sm text-[#155DFC]" onClick={handleTaskview}>view all</span>
            </div>
            <div className="tasks">
              <Tasktable tasks={dummyTasks.tasks.slice(0,2)}/>
            </div>
          </div> */}
          {/* <div className="projectFolders">
            <div className="header flex justify-between">
              <h1 className="font-bold mb-4">Project Folders</h1>
              <span role="button" className="text-sm text-[#155DFC]" onClick={handleFolderView}>view all</span>
            </div>
             <div className="projects grid grid-cols-3 gap-4">
              {displayedFolders.map(client =>
                  <Link key={client.id} className="inline-block rounded-2xl" href={`/dashboard/folders/${client.id}`}>
                  <Card className="relative">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="logo w-12 h-12 rounded-full shadow-md"><img className="w-full h-auto" src={client.clientlogo} alt="" /></div>
                    <div className="title font-bold">{client.label}</div>
                  </CardContent>
                  <CardFooter className="text-[#717182] text-xs flex gap-2 items-center py-3">
                   <Calendar className="w-3" /> Created {client.createddate}
                  </CardFooter>
                  <ChevronRight className="absolute h-[20px] top-[calc(50%-10px)] right-2 text-[#717182]" />
                </Card>
                </Link> )}  
             </div>

             
          </div> */}
          <div className="recentTemps">
          <h1 className="font-bold mb-4">Recent Emailes</h1>
          <div className="templates">
          <Suspense fallback={<LoadingSpinner message="Loading your email templates..." />}>
           <RecentTemplates temps={templates} handleUseTemplate={handleUseTemplate} handleEditTemplate={handleEditTemplate} 
                                  setDeleteDialog={setDeleteDialog} 
                                  handleDuplicateTemplate={handleDuplicateTemplate}
                                  handleCreateBlank={handleCreateBlank}
                                  loading={loading}/>
           </Suspense>
            </div> 
          </div>
          <div className="StandardTemps">
          <div className="header flex justify-between">
              <h1 className="font-bold mb-4">Standard Templates</h1>
              <span role="button" className="text-sm text-[#155DFC]" onClick={handlestandardTemps}>view all</span>
            </div>
          <div className="templates">
            <Suspense fallback={<LoadingSpinner message="Loading your email templates..." />}>
              <StandardTemplates temps={templates} 
                                  handleUseTemplate={handleUseTemplate} 
                                  handleEditTemplate={handleEditTemplate} 
                                  setDeleteDialog={setDeleteDialog} 
                                  handleDuplicateTemplate={handleDuplicateTemplate}
                                  handleCreateBlank={handleCreateBlank}
                                  loading={loading}
                                  />
          </Suspense>
            </div> 
          </div>
        </div>

        
      </div>
    </div>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        template={deleteDialog.template}
        onConfirm={() => deleteDialog.template && handleDeleteTemplate(deleteDialog.template)}
        onCancel={() => setDeleteDialog({ open: false, template: null })}
      />
     <CreateProjectDialog onOpen={openCreate} onClose={() => setCreate(false)}/>
    </div>
  )
}
