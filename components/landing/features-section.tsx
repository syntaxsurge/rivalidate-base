'use client'

import { motion } from 'framer-motion'
import { Layers3, Stamp, Search, BadgeCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Layers3,
    title: 'Vectorized Résumés',
    description: 'OCY transforms every résumé into high-dimension embeddings for lightning-fast similarity search.',
  },
  {
    icon: Stamp,
    title: 'Issuer Signatures',
    description: 'Employers and schools verify once; signed credentials travel everywhere you apply.',
  },
  {
    icon: Search,
    title: 'Semantic Talent Search',
    description: 'Recruiters query skills in natural language and instantly surface proof-backed matches.',
  },
  {
    icon: BadgeCheck,
    title: 'Proof NFTs on Base',
    description: 'Each verified credential mints a non-fungible proof anchored to Base’s security and liquidity.',
  },
]

export default function FeaturesSection() {
  return (
    <section id='features' className='bg-background py-24'>
      <div className='mx-auto max-w-6xl px-4 text-center'>
        <h2 className='text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl'>
          Built&nbsp;for&nbsp;Proof
        </h2>

        <div className='mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              className='group border-border/60 bg-background/70 relative overflow-hidden rounded-2xl border p-8 backdrop-blur'
            >
              <div className='bg-rivalidate-gradient absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-15' />
              <div className='relative z-10 flex flex-col items-center'>
                <div className='bg-rivalidate-gradient mb-4 inline-flex size-12 items-center justify-center rounded-full text-white shadow-lg'>
                  <Icon className='h-6 w-6' />
                </div>
                <h3 className='text-foreground text-lg font-semibold text-balance'>{title}</h3>
                <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}