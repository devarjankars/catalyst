import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import AppShell from '@/components/app-shell'

export const metadata: Metadata = {
  title: 'Cipher | AI-Enabled Content Platform for Healthcare | MedTrix',
  description: 'Cipher is MedTrix’s AI-enabled platform for pharma and healthcare content creation, digital production, and review workflows.',
  icons: {
    icon: '/Medtrixlogo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning className="h-screen overflow-hidden">
        <AppShell>{children}</AppShell>
        <Toaster richColors={true} position='top-center' />
      </body>
    </html>
  )
}
