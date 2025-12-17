import Header from '@/components/Header'
import { getSessionFromCookie } from '@/lib/session'

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionFromCookie()
  
  return (
    <div className="min-h-screen">
      <Header name={session?.role} />
      {children}
    </div>
  )
}
