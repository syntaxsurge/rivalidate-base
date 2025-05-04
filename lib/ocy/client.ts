/* -------------------------------------------------------------------------- */
/*                              OCY CLIENT HELPER                             */
/* -------------------------------------------------------------------------- */

import dotenv from 'dotenv'
dotenv.config()

/**
 * Rivalz SDK is published as an ESM-only package whose compiled output
 * occasionally ships either a default export *or* a named class depending on
 * the bundler that consumed it. The dynamic resolution below guarantees we
 * always retrieve the actual constructor, eliminating the "is not a constructor”
 * runtime failure observed when the default import is an ES module namespace
 * object instead of the expected class.
 */
import _RivalzClient from 'rivalz-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RivalzClientCtor: any =
  // ESM transpilation – class lives under `.default`
  (_RivalzClient as unknown as { default?: unknown }).default ??
  // CommonJS transpilation – the require() result **is** the class
  _RivalzClient

type RivalzClientInstance = InstanceType<typeof RivalzClientCtor>

let clientSingleton: RivalzClientInstance | null = null

/**
 * Lazily initialise and return the singleton OCY client.
 * Reads the secret key from the environment on first demand.
 */
export function getOcyClient(): RivalzClientInstance {
  if (!clientSingleton) {
    const secret = process.env.RIVALZ_API_KEY
    if (!secret) {
      throw new Error('RIVALZ_API_KEY env variable is missing')
    }
    clientSingleton = new RivalzClientCtor(secret)
  }
  return clientSingleton
}

/* -------------------------------------------------------------------------- */
/*                         SEMANTIC RÉSUMÉ SEARCH UTIL                        */
/* -------------------------------------------------------------------------- */

/**
 * Perform a one-shot semantic search across all résumé knowledge bases and
 * return a list of candidate IDs ordered by descending cosine similarity.
 *
 * @param prompt free-text query entered by a recruiter
 */
export async function queryResumeVectors(prompt: string): Promise<number[]> {
  const ocy = getOcyClient()

  // 1. Fetch all knowledge bases and filter down to résumé KBs
  const allKBs: Array<{ id: string }> = await ocy.getKnowledgeBases()
  const resumeKBs = allKBs.filter(({ id }) => id.startsWith('resume_'))

  // 2. Fan-out chat sessions in parallel to obtain similarity scores
  const scored = await Promise.all(
    resumeKBs.map(async ({ id }) => {
      try {
        // createChatSession returns `{ answer, score }` (score ∈ [0,1])
        // The exact field name may vary; handle both `score` and `similarity`.
        const res: any = await ocy.createChatSession(id, prompt)
        const similarity: number =
          typeof res.score === 'number'
            ? res.score
            : typeof res.similarity === 'number'
              ? res.similarity
              : 0

        const candidateId = Number(id.replace('resume_', ''))
        return { candidateId, similarity }
      } catch {
        // Network / model failure ⇒ treat as zero relevance
        return null
      }
    }),
  )

  // 3. Sort by similarity and emit the ordered candidate IDs
  return scored
    .filter(Boolean)
    .sort((a, b) => (b!.similarity ?? 0) - (a!.similarity ?? 0))
    .map((s) => s!.candidateId)
}