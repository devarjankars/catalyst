"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import {
  Mail,
  RectangleHorizontal,
  BarChart2,
  FileText,
  Settings2,
} from "lucide-react"
import { BrandSelectionModal, type Brand } from "@/components/brand-selection-modal"

export default function LandingPage() {
  const router = useRouter()
  const [brandModalOpen, setBrandModalOpen] = useState(false)

  const tools = [
    {
      label: "Emailer",
      icon: Mail,
      // Emailer triggers brand selection; other tools navigate directly
      onClick: () => setBrandModalOpen(true),
    },
    {
      label: "Banner",
      icon: RectangleHorizontal,
      onClick: () => router.push("/banners"),
    },
    {
      label: "Infographic",
      icon: BarChart2,
      onClick: () => router.push("/infographics"),
    },
    {
      label: "Brochure",
      icon: FileText,
      onClick: () => router.push("/brochures"),
    },
    {
      label: "Custom",
      icon: Settings2,
      onClick: () => router.push("/custom"),
    },
  ]

  function handleBrandSelect(brand: Brand) {
    setBrandModalOpen(false)
    // Pass the selected brand as a query param into the dashboard/emailer flow
    router.push(`/dashboard?brand=${brand}`)
  }

  return (
    <>
      <div className="w-full min-h-screen flex items-start justify-center bg-neutral-100 pt-10">
        <div className="w-[80%] max-w-4xl grid grid-cols-3 gap-5 p-4">
          {tools.map(({ label, icon: Icon, onClick }) => (
            <Card
              key={label}
              onClick={onClick}
              className="
                group relative bg-[#111111] border border-[#2a2a2a] rounded-2xl
                overflow-hidden transition-all duration-300
                cursor-pointer
                hover:-translate-y-1 hover:border-[#E12A29]
                hover:shadow-[0_12px_32px_rgba(225,42,41,0.18)]
                [&:nth-child(4)]:col-start-1
                [&:nth-child(5)]:col-start-2
              "
            >
              {/* Red top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E12A29] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardContent className="flex items-center gap-4 p-7">
                {/* Icon container */}
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#E12A29]/10 border border-[#E12A29]/25 group-hover:bg-[#E12A29]/20 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-[#E12A29]" strokeWidth={1.8} />
                </div>

                <span className="text-[20px] tracking-widest uppercase text-white group-hover:text-[#E12A29] transition-colors duration-300">
                  {label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Brand selection modal — shown when the user clicks "Emailer" */}
      <BrandSelectionModal open={brandModalOpen} onSelect={handleBrandSelect} />
    </>
  )
}
