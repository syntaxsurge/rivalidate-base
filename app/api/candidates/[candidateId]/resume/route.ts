import { NextResponse } from 'next/server'

import { buildResumeData, generateResumePdf } from '@/lib/resume/resume-builder'
import { getOcyClient } from '@/lib/ocy/client'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

/**
 * GET /api/candidates/[candidateId]/resume
 *
 * Generates a résumé PDF for the specified candidate.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  /* Await dynamic segment */
  const { candidateId: idStr } = await params
  const candidateId = Number(idStr)
  if (Number.isNaN(candidateId)) {
    return NextResponse.json({ error: 'Invalid candidate id.' }, { status: 400 })
  }

  /* Build résumé data */
  const data = await buildResumeData(candidateId)
  if (!data) {
    return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })
  }

  /* Generate PDF */
  const pdfBytes = await generateResumePdf(data)
  const fileName = `${(data.name || 'resume').replace(/\s+/g, '_').toLowerCase()}.pdf`

  /* --------------------------- OCY Vectorisation -------------------------- */
  try {
    const client = getOcyClient()
    const tmpPath = path.join(os.tmpdir(), `${Date.now()}_${fileName}`)
    await fs.writeFile(tmpPath, Buffer.from(pdfBytes))
    await client.createRagKnowledgeBase(tmpPath, `resume_${candidateId}`)
    await fs.unlink(tmpPath).catch(() => {})
  } catch (err) {
    // Do not block the user if OCY is temporarily unavailable
    console.error('OCY vectorisation failed:', err)
  }

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}