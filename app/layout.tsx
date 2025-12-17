import type { Metadata } from "next"
import { AuthProvider } from "../components/providers"
import Header from '../components/Header'
import { getSessionFromCookie } from '@/lib/session'
import Sidebar from '../components/Sidebar'
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
  return (
    <html lang="es">
      <body className="antialiased">
        <AuthProvider>
          {session ? (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
              <Header name={session?.role} />
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
      </body>
    </html>
  )
}
