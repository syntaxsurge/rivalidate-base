import { CheckCircle2, Loader2, RefreshCcw } from 'lucide-react'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/drizzle'
import { candidates } from '@/lib/db/schema/candidate'
import { getUser } from '@/lib/db/queries/queries'
import { getOcyClient } from '@/lib/ocy/client'

export default async function ResumePage() {
  /* -------------------------------------------------------------------- */
  /*                           A U T H  &  D A T A                        */
  /* -------------------------------------------------------------------- */
  const user = await getUser()
  if (!user) redirect('/')

  const [cand] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.userId, user.id))
    .limit(1)

  if (!cand) {
    return (
      <div className='prose mx-auto max-w-2xl p-6'>
        <h1 className='mb-2 text-xl font-semibold'>Résumé</h1>
        <p>You need to create your candidate profile before generating a résumé.</p>
      </div>
    )
  }

  const candidateId = cand.id

  /* -------------------------------------------------------------------- */
  /*                     O C Y   K N O W L E D G E   B A S E              */
  /* -------------------------------------------------------------------- */
  let status: string | null = null
  try {
    const kb = await getOcyClient().getKnowledgeBase(`resume_${candidateId}`)
    status = kb?.status ?? null
  } catch {
    /* OCY unavailable or KB missing */
  }

  /* -------------------------------------------------------------------- */
  /*                          S T A T U S   B A D G E                     */
  /* -------------------------------------------------------------------- */
  function Status() {
    switch (status) {
      case 'ready':
        return (
          <span className='inline-flex items-center gap-1 rounded-md bg-emerald-600/15 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200'>
            <CheckCircle2 className='size-3 shrink-0' /> Ready
          </span>
        )
      case 'processing':
        return (
          <span className='inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-400/20 dark:text-amber-200'>
            <Loader2 className='size-3 shrink-0 animate-spin' /> Processing
          </span>
        )
      default:
        return (
          <span className='inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
            Not generated
          </span>
        )
    }
  }

  /* -------------------------------------------------------------------- */
  /*                               M A R K U P                            */
  /* -------------------------------------------------------------------- */
  return (
    <div className='mx-auto max-w-xl space-y-6 p-6'>
      <header>
        <h1 className='text-2xl font-bold'>Résumé</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Download your automatically generated résumé PDF, check its vectorization status, or
          regenerate the document.
        </p>
      </header>

      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Vectorization status:</span>
          <Status />
        </div>

        {status === 'processing' && (
          <span className='text-muted-foreground text-xs'>(This may take a few minutes)</span>
        )}
      </div>

      <div className='flex gap-3'>
        <Button asChild>
          <a href={`/api/candidates/${candidateId}/resume`} target='_blank' rel='noopener'>
            Download PDF
          </a>
        </Button>

        <form
          action={`/api/candidates/${candidateId}/resume/vectorize`}
          method='post'
          className='inline'
        >
          <Button variant='secondary' type='submit'>
            <RefreshCcw className='mr-2 size-4' />
            Regenerate & Vectorize
          </Button>
        </form>
      </div>
    </div>
  )
}