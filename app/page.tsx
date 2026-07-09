"use client"


import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useEffect } from "react"
import {
  Mail,
  RectangleHorizontal,
  BarChart2,
  FileText,
  Settings2,
} from "lucide-react";

export default  function LandingPage() {
  const router = useRouter()


  const tools = [
  {
    label: "Emailer",
    icon: Mail,
    href: "/dashboard",
  },
  {
    label: "Banner",
    icon: RectangleHorizontal,
    href: "/banners",
  },
  {
    label: "Infographic",
    icon: BarChart2,
    href: "/infographics",
  },
  {
    label: "Brochure",
    icon: FileText,
    href: "/brochures",
  },
  {
    label: "Custom",
    icon: Settings2,
    href: "/custom",
  },
];


  return (
     <div className="w-full min-h-screen flex items-start justify-center bg-neutral-100 pt-10">
      <div className="w-[80%] max-w-4xl grid grid-cols-3 gap-5 p-4">
        {tools.map(({ label, icon: Icon, href }) => (
          <Card
            key={label}
           
            className="
              group relative bg-[#111111] border border-[#2a2a2a] rounded-2xl
              overflow-hidden transition-all duration-300
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

             <span className=" text-[20px]  tracking-widest uppercase text-white group-hover:text-[#E12A29] transition-colors duration-300">
              {label}
            </span>
            </CardContent>

           
            
          </Card>
        ))}
      </div>
    </div>
  )
}
