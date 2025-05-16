import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/db/queries/queries'
import type { Role } from '@/lib/types'

/* Routes that guests may access without an authenticated wallet */
const PUBLIC_ROUTES = ['/tools/agent']

/**
 * Server-side page guard.
 * Ensures a wallet-authenticated user exists and, when {@link allowedRoles}
 * is non-empty, that the user’s role is included – otherwise redirects.
 *
 * @param allowedRoles  Whitelisted roles (empty = any authenticated user)
 * @returns             The authenticated user record
 */
export async function requireAuth(allowedRoles: readonly Role[] = []) {
  const user = await getUser()
  if (!user) {
    const path = headers().get('next-url') || ''
    if (PUBLIC_ROUTES.some((p) => path.startsWith(p))) {
      /* Permit guests on public pages such as the AI Agent chat */
      return null as any
    }
    redirect('/connect-wallet')
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as Role)) {
    redirect('/dashboard')
  }
  return user
}
