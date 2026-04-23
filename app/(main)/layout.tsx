import BottomNav from '@/components/BottomNav'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegistrar />
      <main className="pb-safe">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
