'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion'
import { ArrowRight, Building2, ShieldCheck, Sparkles, ArrowDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                    DATA                                    */
/* -------------------------------------------------------------------------- */

const BULLETS = [
  { icon: Building2, label: 'Issuer-signed credentials' },
  { icon: ShieldCheck, label: 'On-chain provenance' },
  { icon: Sparkles, label: 'AI hiring copilots' },
] as const

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */

type Blob = { x: number; y: number; s: number; d: number }

export default function HeroSection() {
  /* ---------------------------------------------------------------------- */
  /*                           Mouse-parallax logic                         */
  /* ---------------------------------------------------------------------- */
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [0, 1], [6, -6])
  const rotateY = useTransform(mouseX, [0, 1], [-6, 6])
  const springX = useSpring(rotateX, { stiffness: 120, damping: 20 })
  const springY = useSpring(rotateY, { stiffness: 120, damping: 20 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { width, height, left, top } = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - left) / width)
    mouseY.set((e.clientY - top) / height)
  }

  /* ---------------------------------------------------------------------- */
  /*                    Background blobs – client-side only                 */
  /* ---------------------------------------------------------------------- */
  const [blobs, setBlobs] = useState<Blob[]>([]) // empty on server for deterministic SSR

  useEffect(() => {
    /* Generate the random blob set once after the component mounts */
    setBlobs(
      Array.from({ length: 24 }, () => ({
        x: Math.random() * 120 - 10, // -10 % → 110 %
        y: Math.random() * 120 - 10,
        s: Math.random() * 5 + 3, // 3 px – 8 px
        d: Math.random() * 18 + 14, // 14 s – 32 s
      })),
    )
  }, [])

  /* ---------------------------------------------------------------------- */
  /*                                 Render                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <section
      id='hero'
      onMouseMove={handleMouseMove}
      className='relative isolate overflow-hidden pt-32 pb-24 sm:pb-32'
    >
      <GradientBackdrop />
      <Blobs points={blobs} />

      <div className='mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 sm:px-6 xl:grid-cols-2 xl:gap-24'>
        {/* ----------------------------- Copy ----------------------------- */}
        <motion.div
          style={{ rotateX: springX, rotateY: springY }}
          className='text-center xl:text-left'
        >
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className='mx-auto max-w-3xl bg-gradient-to-r from-white via-neutral-200 to-white bg-clip-text text-5xl leading-tight font-extrabold text-balance break-words text-transparent sm:text-6xl lg:text-6xl xl:mx-0 xl:text-7xl'
          >
            Proof-First&nbsp;Hiring
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: 'easeOut' }}
            className='mx-auto mt-6 max-w-xl text-lg/relaxed text-white/90 xl:mx-0'
          >
            Credentials backed by employers, sealed on-chain, and surfaced by AI for instant trust
            and precision matching.
          </motion.p>

          {/* Bullets */}
          <ul className='mt-10 flex flex-wrap items-center justify-center gap-4 font-medium xl:justify-start'>
            {BULLETS.map(({ icon: Icon, label }, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 + 0.1 }}
                className='inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm text-white backdrop-blur-md'
              >
                <Icon className='h-5 w-5 text-amber-300' />
                {label}
              </motion.li>
            ))}
          </ul>

          {/* CTAs */}
          <div className='mt-12 flex flex-wrap justify-center gap-4 xl:justify-start'>
            <GradientButton href='/connect-wallet'>
              Launch&nbsp;App <ArrowRight className='h-4 w-4' />
            </GradientButton>
            <GradientButton href='/#demo' tone='outline'>
              Watch&nbsp;Demo
            </GradientButton>
          </div>
        </motion.div>

        {/* ------------------------- Illustration -------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='relative mx-auto flex max-w-md justify-center xl:max-w-none'
        >
          <div className='relative h-80 w-full max-w-sm rounded-[2.5rem] bg-gradient-to-br from-[#00d2ff] to-[#3a47d5] p-1 shadow-2xl xl:h-[26rem] xl:rounded-[3rem]'>
            <div className='bg-background flex h-full w-full flex-col items-center justify-center gap-6 rounded-[inherit] p-10 text-center'>
              <Sparkles className='text-primary h-10 w-10' />
              <p className='text-foreground text-xl leading-snug font-semibold'>
                Your experience,
                <br /> tokenized
              </p>
              <p className='text-muted-foreground text-sm'>
                Skills, credentials and achievements minted as verifiable NFTs.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className='absolute bottom-10 left-1/2 -translate-x-1/2'
      >
        <ArrowDown className='h-8 w-8 animate-bounce text-white' />
      </motion.div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Helper components                              */
/* -------------------------------------------------------------------------- */

function GradientBackdrop() {
  return (
    <div className='pointer-events-none absolute inset-0 -z-20'>
      <div className='absolute inset-0 -rotate-6 bg-[#0f0c29] opacity-70 blur-3xl' />
      <div className='absolute inset-0 bg-black/60 mix-blend-multiply' />
    </div>
  )
}

function Blobs({ points }: { points: Blob[] }) {
  /* Render nothing on the server; client will populate after mount */
  if (points.length === 0) return null
  return (
    <div className='pointer-events-none absolute inset-0 -z-10'>
      {points.map((b, i) => (
        <span
          key={i}
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.s,
            height: b.s,
            animationDelay: `${i * 0.14}s`,
            animationDuration: `${b.d}s`,
          }}
          className='absolute animate-[blob_6s_linear_infinite] rounded-full bg-white/70 opacity-0'
        />
      ))}

      <style jsx global>{`
        @keyframes blob {
          0%,
          100% {
            transform: scale(0);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          50% {
            transform: scale(1);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  )
}

/* GradientButton ----------------------------------------------------------- */

type GradientButtonProps = {
  href: string
  children: ReactNode
  tone?: 'solid' | 'outline'
  className?: string
}

function GradientButton({
  href,
  children,
  tone = 'solid',
  className,
  ...props
}: GradientButtonProps) {
  const solid = tone === 'solid'
  return (
    <Button
      asChild
      size='lg'
      className={cn(
        'relative isolate overflow-hidden rounded-full px-8 py-3 font-semibold shadow-xl transition-transform duration-200 focus-visible:outline-none',
        solid
          ? 'bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-2xl'
          : 'ring-border bg-white/10 text-white/90 ring-1 backdrop-blur hover:bg-white/20 hover:text-white',
        className,
      )}
      {...props}
    >
      <Link href={href}>
        <span className='relative z-10 flex items-center gap-2'>{children}</span>
        {solid && (
          <span
            aria-hidden='true'
            className='absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#14b8a6_0%,#3b82f6_33%,#a855f7_66%,#ec4899_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100'
          />
        )}
      </Link>
    </Button>
  )
}
