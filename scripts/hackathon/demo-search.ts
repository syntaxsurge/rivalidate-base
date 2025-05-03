//!/usr/bin/env ts-node
/* -------------------------------------------------------------------------- */
/*                         H A C K A T H O N   D E M O                        */
/* -------------------------------------------------------------------------- */
/*  Usage:  pnpm ts-node scripts/hackathon/demo-search.ts "prompt text"       */
/*  Prints the top-10 candidate names with their OCY similarity scores.       */
/* -------------------------------------------------------------------------- */

import 'dotenv/config'
import { argv, exit } from 'node:process'
import { inArray } from 'drizzle-orm'

import { getOcyClient } from '@/lib/ocy/client'
import { db } from '@/lib/db/drizzle'
import { candidates } from '@/lib/db/schema/candidate'

async function main(): Promise<void> {
  /* ------------------------- CLI argument parsing ------------------------ */
  const prompt = (argv[2] ?? '').trim()
  if (!prompt) {
    console.error('Usage: pnpm ts-node scripts/hackathon/demo-search.ts "prompt text"')
    exit(1)
  }

  /* ------------------------ Rivalz OCY retrieval ------------------------- */
  const client = getOcyClient()
  const allKbs = (await client.getKnowledgeBases()) as any[]
  const resumeKbs = allKbs.filter(
    (kb) => typeof kb.name === 'string' && kb.name.startsWith('resume_'),
  )

  const scored = await Promise.all(
    resumeKbs.map(async (kb) => {
      try {
        const res: any = await client.createChatSession(kb.id, prompt)
        const score: number =
          res?.score ?? res?.similarity ?? res?.cosine ?? res?.metadata?.score ?? 0
        const id = Number(kb.name.replace('resume_', ''))
        return Number.isNaN(id) ? null : { id, score }
      } catch {
        return null
      }
    }),
  )

  const topMatches = scored
    .filter(Boolean)
    .sort((a, b) => (b!.score as number) - (a!.score as number))
    .slice(0, 10) as { id: number; score: number }[]

  if (topMatches.length === 0) {
    console.log('No matches found.')
    return
  }

  /* ----------------------------- DB lookup ------------------------------ */
  const rows = await db
    .select({ id: candidates.id, name: candidates.name })
    .from(candidates)
    .where(inArray(candidates.id, topMatches.map((t) => t.id)))

  const nameMap = new Map(rows.map((r) => [r.id, r.name || 'Unnamed']))

  /* ---------------------------- Pretty print ---------------------------- */
  console.log(`\nTop ${topMatches.length} matches for "${prompt}":\n`)
  topMatches.forEach((m, i) => {
    const name = nameMap.get(m.id) ?? '(Unknown)'
    const pct = (m.score * 100).toFixed(2)
    console.log(`${i + 1}. ${name} (ID ${m.id}) – ${pct}`)
  })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})