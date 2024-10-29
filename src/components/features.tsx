"use client"

import { motion } from "framer-motion"
import { LightningBoltIcon, StarIcon, RocketIcon } from "@radix-ui/react-icons"

const features = [
  {
    icon: <LightningBoltIcon className="h-10 w-10" />,
    title: "Lightning Fast",
    description: "Get your blog post in seconds, not hours. Our AI processes videos instantly.",
  },
  {
    icon: <StarIcon className="h-10 w-10" />,
    title: "SEO Optimized",
    description: "Generated content is structured for maximum search engine visibility.",
  },
  {
    icon: <RocketIcon className="h-10 w-10" />,
    title: "Smart Formatting",
    description: "AI automatically structures content with headers, lists, and proper formatting.",
  },
]

export function Features() {
  return (
    <section className="w-full py-20 bg-gradient-to-b from-background to-primary/5">
      <div className="container px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Powerful Features
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Everything you need to create amazing blog posts from videos
          </p>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl -z-10 group-hover:from-primary/20 transition-colors" />
              <div className="relative p-8 space-y-4">
                <div className="inline-block p-4 rounded-2xl bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 