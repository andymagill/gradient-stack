import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { LayoutWrapper } from "@/components/layout-wrapper"
import "./globals.css"

// next/font renames the actual font-family to a hashed value at build time
// (e.g. "__Geist_36bd41"), so app/globals.css can't reference "Geist"
// literally — it has to consume the runtime CSS variable these expose,
// applied to <html> below.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Gradient Stack - Animate CSS Gradients",
  description:
    "Create, animate, and export beautiful CSS gradients with precision layer management and keyframe controls.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', (e) => {
                if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              });
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}
