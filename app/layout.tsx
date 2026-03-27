import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nidra WF11 Tracker',
  description: 'Track your daily work sessions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}