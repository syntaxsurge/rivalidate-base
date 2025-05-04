'use server'

import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { candidates } from '@/lib/db/schema/candidate'
import { vectorizeResume } from '@/lib/ocy/vectorize-resume'
import { requireAuth } from '@/lib/auth/guards'

/**
 * POST /api/candidates/[candidateId]/resume/vectorize
 *
 * Regenerates the candidate résumé PDF and (re)vectorises it in OCY.
 * Always responds quickly with a processing status so the UI can poll.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  /* --------------------------- Auth & identity -------------------------- */
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { candidateId } = await params
  const idNum = Number(candidateId)
  if (Number.isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 })
  }

  /* ----------------------- Ownership / existence ------------------------ */
  const [cand] = await db
    .select({ id: candidates.id, userId: candidates.userId })
    .from(candidates)
    .where(and(eq(candidates.id, idNum), eq(candidates.userId, user.id)))
    .limit(1)

  if (!cand) {
    return NextResponse.json({ error: 'Candidate not found or access denied.' }, { status: 404 })
  }

  /* ---------------------------- Vectorize ------------------------------- */
  let kbId = ''
  try {
    kbId = await vectorizeResume(cand.id)
  } catch (err) {
    console.error('vectorizeResume error:', err)
  }

  return NextResponse.json({ kbId, status: 'processing' }, { status: 202 })
}