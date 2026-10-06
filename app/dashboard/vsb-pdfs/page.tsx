"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from "react"
import { useVSBStore } from "@/store/vsb-store"
import { firebaseService } from "@/services/firebase-service"
import { EmailTemplate } from "@/types/template"
import { 
  FileText, 
  Search, 
  Eye, 
  Download, 
  Calendar, 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShimmerTable } from "@/components/shimmer"
import { format } from "date-fns"

interface VSBPDFItem {
  id: string;
  templateId: string;
  templateName: string;
  currentVersionUrl: string;
  updatedAt: string;
}

export default function VSBPDFsPage() {
  const { vsbs, fetchAllVSBs, loading: vsbLoading } = useVSBStore()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState("")

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await fetchAllVSBs()
        const loadedTemplates = await firebaseService.getAllTemplates()
        setTemplates(loadedTemplates)
      } catch (error) {
        console.error("Failed to load VSB PDF data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [fetchAllVSBs])

  const templateMap = useMemo(() => {
    return templates.reduce((acc, t) => {
      acc[t.id] = t.name
      return acc
    }, {} as Record<string, string>)
  }, [templates])

  const pdfItems = useMemo(() => {
    return vsbs
      .filter(vsb => Boolean(vsb.currentVersion))
      .map(vsb => ({
        id: vsb.id,
        templateId: vsb.templateId,
        templateName: templateMap[vsb.templateId] || "Unknown Template",
        currentVersionUrl: vsb.currentVersion || "",
        updatedAt: vsb.updatedAt || "",
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [vsbs, templateMap])

  const filteredItems = useMemo(() => {
    return pdfItems.filter(item => 
      item.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [pdfItems, searchQuery])

  const handlePreview = (url: string, title: string) => {
    setPreviewUrl(url)
    setPreviewTitle(title)
  }

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VSB-PDF.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading || vsbLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-72" />
          </div>
          <div className="h-10 bg-gray-200 rounded-full w-80" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="animate-pulse">
                {[40, 200, 160, 120, 100].map((w, i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-3.5 bg-gray-200 rounded" style={{ width: w }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ShimmerTable rows={6} />
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black  uppercase tracking-tighter">VSB PDF Repository</h1>
          <p className="text-gray-500 font-medium italic mt-1">View or download the latest generated PDF for each VSB</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by template name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full bg-white border-gray-200"
          />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold text-gray-700">Template / Email Name</TableHead>
                <TableHead className="font-bold text-gray-700">Latest PDF Date</TableHead>
                <TableHead className="font-bold text-gray-700">PDF</TableHead>
                <TableHead className="text-right font-bold text-gray-700 px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 opacity-20" />
                      <p>No VSB PDFs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <FileText className="h-5 w-5 text-[#006937]" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{item.templateName}</p>
                            <p className="text-xs text-gray-400 font-mono">ID: {item.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 opacity-40" />
                          {item.updatedAt ? format(new Date(item.updatedAt), "PPp") : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-[#006937] border-none font-bold">
                          Available
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          {item.currentVersionUrl && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handlePreview(item.currentVersionUrl, item.templateName)}
                                className="border-gray-200 text-gray-600 hover:bg-[#FFE7E7] hover:text-[#4A5565] transition-colors"
                              >
                                <Eye className="h-4 w-4 " />
                                
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-[#006937] hover:bg-[#00522b] text-white transition-all shadow-sm"
                                onClick={() => handleDownload(item.currentVersionUrl)}
                              >
                                <Download className="h-4 w-4 " />
                               
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] flex flex-col p-0 overflow-hidden bg-white border-green-100">
          <DialogHeader className="p-4 border-b bg-gray-50/50">
            <DialogTitle className="flex items-center gap-2 text-[#006937]">
              <FileText className="h-5 w-5" />
              {previewTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-gray-100 relative">
            {previewUrl && (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
