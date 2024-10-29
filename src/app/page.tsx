import { Hero } from "@/src/components/hero"
import { HowItWorks } from "@/src/components/how-it-works"
import { Features } from "@/src/components/features"
import { Footer } from "@/src/components/footer"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Hero />
      <HowItWorks />
      <Features />
      <Footer />
    </main>
  )
}
