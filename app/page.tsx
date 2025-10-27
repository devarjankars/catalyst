"use client"


import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useEffect } from "react"

export default  function LandingPage() {
  const router = useRouter()

  // const handleStatClick = ()=>{
  //   router.push("/dashboard")
  // }

  useEffect(() => {
    // Redirect to /dashboard on page load
    router.push("/dashboard")
  }, [])

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Hero Section
      <section className="w-full flex flex-col md:flex-row items-center justify-between px-8 py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">Build<br/> Stunning Emails<br/> in Minutes</h1>
          <p className="text-lg md:text-xl opacity-90">
            Drag & drop editor, ready-to-use templates, and instant compatibility across all email clients.
          </p>
          <div className="flex space-x-4">
            <Button onClick={handleStatClick} size="lg" variant="secondary" className="rounded-full">Start Free Trial</Button>
          </div>
          <p className="text-sm mt-2">No credit card required</p>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0 relative flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 30 }} transition={{duration : 0.5}} animate={{ opacity: 1, y: 0 }} className="absolute left-[-10px] w-[50%]">
            <img src="/editor.png" alt="Editor Mockup" className="rounded-2xl shadow-2xl w-[100%]" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} transition={{duration : 0.8}} animate={{ opacity: 1, y: 0 }} className="absolute top-2 w-[50%]">
            <img src="/dashboard.png" alt="Editor Mockup" className="rounded-2xl shadow-2xl w-[100%] " />
          </motion.div>
        </div>
      </section> */}

      {/* Social Proof */}
      {/* <section className="py-12 bg-white text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Trusted by 500+ brands</h2>
        <div className="flex justify-center space-x-8 opacity-70">
          <img src="/logo1.png" alt="logo" className="h-8" />
          <img src="/logo2.png" alt="logo" className="h-8" />
          <img src="/logo3.png" alt="logo" className="h-8" />
        </div>
      </section> */}

      {/* Features */}
      {/* <section className="py-20 bg-gray-50 px-8">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { title: "Drag & Drop Editor", desc: "No coding required." },
            { title: "Responsive Templates", desc: "Works everywhere." },
            { title: "Collaboration Tools", desc: "Build with your team." },
            { title: "Analytics & Insights", desc: "Track opens & clicks." }
          ].map((f, i) => (
            <Card key={i} className="p-6">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section> */}

      {/* Demo Section */}
      {/* <section className="py-20 px-8 flex flex-col md:flex-row items-center gap-10">
        <div className="md:w-1/2 space-y-6">
          <h2 className="text-3xl font-bold">Your workflow, simplified</h2>
          <p className="text-gray-600">Select a template → Customize → Send → Track performance</p>
          <Button size="lg">Watch Demo</Button>
        </div>
        <div className="md:w-1/2">
          <img src="/dashboard.png" alt="Workflow Demo" className="rounded-xl shadow-lg" />
        </div>
      </section> */}

      {/* Pricing */}
      {/* <section className="py-20 bg-gray-50 px-8 text-center">
        <h2 className="text-3xl font-bold mb-10">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { plan: "Starter", price: "$0", features: ["Basic Editor", "5 Templates"] },
            { plan: "Pro", price: "$29", features: ["All Features", "Unlimited Templates", "Analytics"], popular: true },
            { plan: "Enterprise", price: "Custom", features: ["Dedicated Support", "Team Collaboration"] }
          ].map((p, i) => (
            <Card key={i} className={`p-8 ${p.popular ? "border-2 border-indigo-500" : ""}`}>
              <CardContent className="space-y-4">
                <h3 className="text-2xl font-bold">{p.plan}</h3>
                <p className="text-3xl font-semibold">{p.price}</p>
                <ul className="text-gray-600 space-y-1">
                  {p.features.map((f, j) => (
                    <li key={j}>✔ {f}</li>
                  ))}
                </ul>
                <Button className="w-full">Get Started</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section> */}

      {/* FAQ */}
      {/* <section className="py-20 px-8 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="q1">
            <AccordionTrigger>Do I need coding skills?</AccordionTrigger>
            <AccordionContent>No, our drag-and-drop editor makes it easy for anyone.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>Is there a free trial?</AccordionTrigger>
            <AccordionContent>Yes, you can try all features free for 14 days.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Can I export my templates?</AccordionTrigger>
            <AccordionContent>Absolutely, export to HTML or integrate directly.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section> */}

      {/* Final CTA */}
      {/* <section className="py-20 bg-indigo-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to build your first email?</h2>
        <Button size="lg" variant="secondary">Start Free Trial</Button>
      </section> */}

      {/* Footer */}
      {/* <footer className="py-12 bg-gray-900 text-gray-400 text-center">
        <div className="space-x-6 mb-4">
          <a href="#">Product</a>
          <a href="#">Pricing</a>
          <a href="#">Docs</a>
          <a href="#">Blog</a>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} EmailBuilder Inc. All rights reserved.</p>
      </footer> */}
    </div>
  )
}
