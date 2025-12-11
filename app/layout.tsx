import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from 'sonner'
import { useLoggedInUserStore } from '@/store/logged-in-user'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth-guard'


export const metadata: Metadata = {
  title: 'Email Builder',
  description: 'Build responsive email templates with ease using our intuitive drag-and-drop interface.',
 
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="en">
      <head>
        <style></style>
      </head>
      <body>
        <AuthGuard>{children}</AuthGuard>
        <Toaster richColors={true} position='top-center'/>
      </body>
    </html>
  )
}
