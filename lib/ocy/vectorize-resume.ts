import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import { buildResumeData, generateResumePdf } from '@/lib/resume/resume-builder'
import { getOcyClient } from '@/lib/ocy/client'

/**
 * Generates (or updates) an OCY knowledge base for the candidate’s résumé.
 *
 * @param candidateId Unique numeric identifier of the candidate
 * @returns The OCY knowledge-base ID (empty string if vectorisation was skipped or failed)
 */
export async function vectorizeResume(candidateId: number): Promise<string> {
  /* ---------------------------------------------------------------------- */
  /*                     S K I P   I N   N O N - P R O D                    */
  /* ---------------------------------------------------------------------- */
  if (process.env.NODE_ENV !== 'production') {
    // In dev / test we don’t spend credits – just pretend the KB exists.
    return `resume_${candidateId}`
  }

  /* ---------------------------------------------------------------------- */
  /*                   B U I L D   P D F   I N   T E M P                    */
  /* ---------------------------------------------------------------------- */
  const data = await buildResumeData(candidateId)
  if (!data) {
    throw new Error(`Candidate ${candidateId} not found`)
  }

  const pdfBytes = await generateResumePdf(data)
  const safeName = (data.name || 'resume').replace(/\s+/g, '_').toLowerCase()
  const fileName = `${safeName}.pdf`

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rivalidate-resume-'))
  const tmpPath = path.join(tmpDir, fileName)

  try {
    await fs.writeFile(tmpPath, Buffer.from(pdfBytes))

    /* ------------------------------------------------------------------ */
    /*                      O C Y   K N O W L E D G E   B A S E           */
    /* ------------------------------------------------------------------ */
    const client = getOcyClient()
    const existingBases = await client.getKnowledgeBases()
    const kbName = `resume_${candidateId}`
    const existing = Array.isArray(existingBases)
      ? existingBases.find((kb: { name?: string }) => kb?.name === kbName)
      : undefined

    let kbId: string
    if (existing?.id) {
      await client.addDocumentToKnowledgeBase(tmpPath, existing.id)
      kbId = existing.id
    } else {
      const created = await client.createRagKnowledgeBase(tmpPath, kbName)
      kbId = created.id
    }

    return kbId
  } catch (err) {
    // Do not break calling flows – just surface the error in logs.
    console.error('vectorizeResume error:', err)
    return ''
  } finally {
    /* ------------------------------------------------------------------ */
    /*                             C L E A N - U P                        */
    /* ------------------------------------------------------------------ */
    try {
      await fs.unlink(tmpPath)
      await fs.rmdir(tmpDir)
    } catch {
      /* ignore */
    }
  }
}

export default vectorizeResume