"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Paste Podcast URL",
    description: "Simply copy and paste the Podcast Youtube URL into our converter.",
  },
  {
    number: "02",
    title: "AI Processing",
    description: "Our AI analyzes the video content and generates a structured blog post.",
  },
  {
    number: "03",
    title: "Get Your Blog Post",
    description: "Download your ready-to-publish blog post with proper formatting and structure.",
  },
]

export function HowItWorks() {
  return (
    <section className="w-full py-20">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Three simple steps to transform your video into a blog post
          </p>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="p-8 space-y-4">
                <span className="text-5xl font-bold text-primary/20">
                  {step.number}
                </span>
                <h3 className="text-2xl font-bold">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-0 w-1/4 h-0.5 bg-gradient-to-r from-primary/20 to-transparent transform translate-x-full" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 