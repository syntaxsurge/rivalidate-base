import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'
import { FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import PageCard from '@/components/ui/page-card'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { candidates } from '@/lib/db/schema/candidate'

export const revalidate = 0

/**
 * Candidate Résumé page.
 * Users can download their PDF while vectorisation support is under development.
 */
export default async function ResumePage() {
  /* --------------------------- Auth & candidate -------------------------- */
  const user = await getUser()
  if (!user) redirect('/')

  const [cand] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!cand) {
    return (
      <PageCard icon={FileText} title='Résumé'>
        <p className='text-muted-foreground'>
          You need to create your candidate profile before generating a résumé.
        </p>
      </PageCard>
    )
  }

  const candidateId = cand.id

  /* ----------------------------- View ------------------------------------ */
  return (
    <PageCard
      icon={FileText}
      title='Résumé'
      description='Download your automatically generated résumé PDF. Semantic vectorisation will be supported soon.'
    >
      <div className='space-y-6'>
        <p className='text-muted-foreground text-sm'>
          <strong className='font-semibold'>Vectorisation Coming Soon:</strong> We’re building
          semantic search capabilities, but résumé embeddings are not yet available. Check back in a
          future update!
        </p>

        <Button asChild>
          <a
            href={`/api/candidates/${candidateId}/resume`}
            target='_blank'
            rel='noopener noreferrer'
          >
            Download PDF
          </a>
        </Button>
      </div>
    </PageCard>
  )
}
