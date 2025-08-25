"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { EmailCanvas } from "@/components/email-canvas"
import { ComponentPalette } from "@/components/component-palette"
import { PropertiesPanel } from "@/components/properties-panel"
import { ExportPanel } from "@/components/export-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Code } from "lucide-react"
import type { EmailComponent } from "@/types/email-builder"

export default function EmailBuilder() {
  const router = useRouter()
 

  useEffect(() => {
    // Redirect to dashboard on app load
    // router.push("/dashboard")
  }, [router])

  

  return (
    <div>
      
    </div>
  )
}
