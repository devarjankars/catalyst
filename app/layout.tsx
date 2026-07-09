import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import AppShell from '@/components/app-shell'

export const metadata: Metadata = {
  title: 'Email Builder',
  description: 'Build responsive email templates with ease using our intuitive drag-and-drop interface.',
  icons: {
    icon: '/favicon.svg',
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
