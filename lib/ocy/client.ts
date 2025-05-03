import RivalzClient from 'rivalz-client'

/**
 * Returns a ready-to-use RivalzClient instance.
 * Make sure the environment variable RIVALZ_SECRET_TOKEN is set in production.
 */
export function getOcyClient(): RivalzClient {
  const secret = process.env.RIVALZ_SECRET_TOKEN
  if (!secret) {
    throw new Error('RIVALZ_SECRET_TOKEN environment variable is not set')
  }
  return new RivalzClient(secret)
}

export async function queryResumeVectors(
  prompt: string,
  top: number = 100,
): Promise<number[]> {
  const client = getOcyClient()

  // Fetch all knowledge bases and keep only those created for résumés
  const allKbs = await client.getKnowledgeBases()
  const resumeKbs = (allKbs as any[]).filter(
    (kb) => typeof kb.name === 'string' && kb.name.startsWith('resume_'),
  )

  // Query each KB in parallel and collect similarity scores
  const scored = await Promise.all(
    resumeKbs.map(async (kb) => {
      try {
        // Rivalz returns a similarity / cosine score alongside the answer
        const res: any = await client.createChatSession(kb.id, prompt)
        const score: number =
          res?.score ?? res?.similarity ?? res?.cosine ?? 0

        const idStr = kb.name.replace('resume_', '')
        const id = Number(idStr)
        if (Number.isNaN(id)) return null

        return { id, score }
      } catch {
        return null
      }
    }),
  )

  // Order by descending similarity and return the candidate IDs
  return scored
    .filter(Boolean)
    .sort((a, b) => (b!.score as number) - (a!.score as number))
    .slice(0, top)
    .map((s) => (s as { id: number; score: number }).id)
}