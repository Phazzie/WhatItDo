import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'What It Do? - Vote on Dubious Suggestions',
  description: 'Vote yes, no, or maybe on entertainingly questionable suggestions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
