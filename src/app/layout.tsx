import type { Metadata, Viewport } from 'next'
import '@fontsource/libre-caslon-text/latin-400.css'
import '@fontsource/libre-caslon-text/latin-400-italic.css'
import '@fontsource/libre-caslon-text/latin-700.css'
import '@fontsource/oswald/latin-500.css'
import '@fontsource/oswald/latin-700.css'
import '@fontsource/vt323/latin-400.css'
import './globals.css'
import LegacyStorageCleanup from './legacy-storage-cleanup'

export const metadata: Metadata = {
  title: 'What It Do? — The group chat is now in session',
  description: 'Introduce the plan as a bill. Make every member of the group chat go on the record: yea, nay, present, or HELL YEA.',
  referrer: 'no-referrer',
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B1730',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LegacyStorageCleanup />
        {children}
      </body>
    </html>
  )
}
