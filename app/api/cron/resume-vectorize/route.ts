import { NextResponse } from 'next/server'

import { db } from '@/lib/db/drizzle'
import { candidates } from '@/lib/db/schema/candidate'
import { vectorizeResume } from '@/lib/ocy/vectorize-resume'

/**
 * GET /api/cron/resume-vectorize
 *
 * Secured endpoint hit by the Vercel cron job (see vercel.json) to refresh
 * all résumé embeddings each night so recruiter semantic search stays current.
 * The caller must include the header:  X-CRON-KEY: $CRON_SECRET
 */
export const runtime = 'nodejs'

export async function GET(req: Request) {
  /* -------------------------- Simple auth guard ------------------------- */
  const cronKey = req.headers.get('x-cron-key')
  if (!cronKey || cronKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  /* ------------------------- Fetch all candidates ----------------------- */
  const rows = await db.select({ id: candidates.id }).from(candidates)
  let success = 0

  /* ------------------- Vectorise each résumé sequentially -------------- */
  for (const row of rows) {
    try {
      await vectorizeResume(row.id)
      success += 1
    } catch (err) {
      console.error(`Nightly vectorize failed for candidate ${row.id}:`, err)
    }
  }

  /* ------------------------------- Done --------------------------------- */
  return NextResponse.json({ processed: rows.length, success })
}
