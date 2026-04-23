import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Badminton Club',
  description: 'ELO rankings and handicap calculator',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <Providers>
          <main className="flex-1 pb-20 max-w-lg mx-auto w-full px-4">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
