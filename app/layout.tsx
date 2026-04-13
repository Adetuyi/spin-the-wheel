import type { Metadata } from 'next'
import { Syne, Instrument_Sans } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Spin & Win | Pharma West Africa × Chekkit',
  description: 'Spin the wheel and win exclusive rewards at Pharma West Africa!',
  openGraph: {
    title: 'Spin & Win | Pharma West Africa × Chekkit',
    description: 'Spin the wheel and win exclusive rewards at Pharma West Africa!',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${instrumentSans.variable}`}
      style={{ fontFamily: 'var(--font-instrument), sans-serif' }}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
