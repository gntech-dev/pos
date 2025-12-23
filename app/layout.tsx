import type { Metadata } from "next"
import { AuthProvider } from "../components/providers"
import { ToastProvider } from "../components/Toast"
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import { getSessionFromCookie } from '@/lib/session'
import Sidebar from '../components/Sidebar'
import { prisma } from '@/lib/prisma'
import "./globals.css"

export const metadata: Metadata = {
  title: "Sistema POS - República Dominicana",
  description: "Sistema de Punto de Venta con cumplimiento DGII",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionFromCookie()

  // Get business settings for header
  let businessSettings: { name: string, logo: string | null } | null = null
  if (session) {
    try {
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: ['business_name', 'business_logo']
          }
        }
      })

      businessSettings = {
        name: 'GNTech POS',
        logo: null
      }

      settings.forEach(setting => {
        if (setting.key === 'business_name') {
          businessSettings!.name = setting.value
        } else if (setting.key === 'business_logo') {
          businessSettings!.logo = setting.value
        }
      })
    } catch (error) {
      console.error('Error loading business settings:', error)
    }
  }

  return (
    <html lang="es">
      <body className="antialiased">
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              {session ? (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
                  <Header name={session?.role} businessSettings={businessSettings} />
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 p-0">{children}</main>
                  </div>
                </div>
              ) : (
                <div className="min-h-screen">
                  {children}
                </div>
              )}
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
