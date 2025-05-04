import dotenv from 'dotenv'
import _RivalzClient from 'rivalz-client'

dotenv.config()

const RivalzClientCtor: any =
  // ESM build – class exported on `.default`
  (_RivalzClient as unknown as { default?: unknown }).default ??
  // CJS build – the require() result **is** the class
  _RivalzClient

type RivalzClientInstance = InstanceType<typeof RivalzClientCtor>

/* -------------------------------------------------------------------------- */
/*                         I N T E R N A L   U T I L S                        */
/* -------------------------------------------------------------------------- */

/**
 * Creates a Proxy that logs every method invocation (name, args) and the
 * eventual response or error.  This surfaces all OCY/Rivalz traffic in the
 * server console, making it easier to diagnose vector-store issues in prod.
 */
function createLoggingProxy<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver)
      if (typeof original === 'function') {
        return async (...args: unknown[]) => {
          console.log(`[Rivalz API] → ${String(prop)}(`, ...args, ')')
          try {
            const result = await (original as (...a: unknown[]) => unknown).apply(target, args)

            console.log(`[Rivalz API] ← ${String(prop)} OK`, result)
            return result
          } catch (err) {
            console.error(`[Rivalz API] ← ${String(prop)} ERROR`, err)
            throw err
          }
        }
      }
      return original
    },
  }) as T
}

let clientSingleton: RivalzClientInstance | null = null

/**
 * Lazily initialises the Rivalz client, wraps it in the logging proxy above,
 * and returns a singleton so all callers share the same instrumented instance.
 */
export function getOcyClient(): RivalzClientInstance {
  if (!clientSingleton) {
    const secret = process.env.RIVALZ_API_KEY
    if (!secret) {
      throw new Error('RIVALZ_API_KEY env variable is missing')
    }
    const raw = new RivalzClientCtor(secret)
    clientSingleton = createLoggingProxy(raw)
  }
  return clientSingleton
}

/* -------------------------------------------------------------------------- */
/*                         SEMANTIC RÉSUMÉ SEARCH UTIL                        */
/* -------------------------------------------------------------------------- */

/**
 * Perform a semantic search across all résumé knowledge bases and return the
 * candidate IDs ordered by descending cosine similarity against the prompt.
 */
export async function queryResumeVectors(prompt: string): Promise<number[]> {
  const ocy = getOcyClient()

  const allKBs: Array<{ id: string }> = await ocy.getKnowledgeBases(1, 100)
  const resumeKBs = allKBs.filter(({ id }) => id.startsWith('resume_'))

  const scored = await Promise.all(
    resumeKBs.map(async ({ id }) => {
      try {
        const res: any = await ocy.createChatSession(id, prompt)
        const similarity: number =
          typeof res?.score === 'number'
            ? res.score
            : typeof res?.similarity === 'number'
              ? res.similarity
              : 0
        return { candidateId: Number(id.replace('resume_', '')), similarity }
      } catch {
        // individual failures already logged by proxy
        return null
      }
    }),
  )

  return scored
    .filter(Boolean)
    .sort((a, b) => (b!.similarity ?? 0) - (a!.similarity ?? 0))
    .map((s) => s!.candidateId)
}
