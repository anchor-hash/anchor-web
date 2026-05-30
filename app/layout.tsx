import type { Metadata } from 'next'
import { Lora, DM_Sans } from 'next/font/google'
import './globals.css'

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Anchor — Your mind is racing. Let\'s slow it down.',
  description: 'The calm, evidence-based companion for health anxiety. Track symptoms, challenge spirals, and build resilience — free on iPhone.',
  keywords: ['health anxiety', 'anxiety app', 'mental health', 'CBT', 'symptom checker', 'mindfulness'],
  icons: {
    icon: '/logo.svg',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Anchor — Health Anxiety Companion',
    description: 'The calm, evidence-based companion for health anxiety.',
    type: 'website',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'Anchor' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${lora.variable} ${dmSans.variable}`}>
      <body className="bg-navy font-sans antialiased">{children}</body>
    </html>
  )
}
