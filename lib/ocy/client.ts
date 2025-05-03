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