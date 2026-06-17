import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import AuthGuard from '@/components/auth-guard'

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
      <body suppressHydrationWarning>
        <AuthGuard>{children}</AuthGuard>
        <Toaster richColors={true} position='top-center' />
      </body>
    </html>
  )
}
