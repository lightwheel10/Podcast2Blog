import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import { ThemeProvider } from "@/src/components/theme-provider";
import { Navbar } from "@/src/components/navbar";
import { Toaster } from 'sonner'
import { Suspense } from "react"
import { LoadingSpinner } from "@/src/ui/loading-spinner"

export const metadata: Metadata = {
  title: "Podcast2Blog - Transform Podcasts into Engaging Blog Posts",
  description: "Convert any Podcast into a well-structured, SEO-optimized blog post using AI technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner className="h-8 w-8" />
            </div>
          }>
            {children}
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
