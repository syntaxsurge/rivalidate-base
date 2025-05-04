'use client'

import { motion } from 'framer-motion'
import { Layers3, ShieldCheck, Sparkles, Globe } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Layers3,
    title: 'Vectorized Proof Layers',
    desc: 'Generate résumé embeddings with OCY and anchor them to immutable on-chain proofs.',
  },
  {
    icon: ShieldCheck,
    title: 'Issuer-Gated Verification',
    desc: 'Employers and universities attest once—trust propagates everywhere without manual checks.',
  },
  {
    icon: Sparkles,
    title: 'AI Matchmaking',
    desc: 'GPT copilots grade skills and surface the best-fit roles or candidates in seconds.',
  },
  {
    icon: Globe,
    title: 'Borderless Trust',
    desc: 'did:rlz identifiers resolve instantly across any wallet, marketplace or chain.',
  },
] as const

export default function OverviewSection() {
  return (
    <section
      id='overview'
      className='bg-muted/40 relative isolate overflow-hidden py-28'
      aria-label='Platform pillars'
    >
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(0,255,190,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_top,rgba(0,255,190,0.07)_0%,transparent_70%)]' />

      <div className='mx-auto max-w-6xl px-4'>
        <header className='mb-20 text-center'>
          <h2 className='text-foreground text-3xl font-extrabold tracking-tight text-balance sm:text-4xl'>
            Why&nbsp;Rivalidate?
          </h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-lg/relaxed'>
            Everything you need to graduate from hopeful claims to bullet-proof proofs.
          </p>
        </header>

        <ul className='grid gap-10 md:grid-cols-2'>
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
              className='group'
            >
              <Card className='bg-background/70 border-border/60 rounded-3xl border backdrop-blur transition-shadow hover:shadow-2xl'>
                <CardHeader className='flex flex-row items-center gap-4 p-8'>
                  <div className='bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-inner'>
                    <Icon className='h-7 w-7' />
                  </div>
                  <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
                </CardHeader>
                <CardContent className='-mt-4 pr-8 pb-8 pl-[4.5rem]'>
                  <p className='text-muted-foreground text-sm leading-relaxed'>{desc}</p>
                </CardContent>
              </Card>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
