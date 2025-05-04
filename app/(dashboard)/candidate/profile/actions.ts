'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { candidates } from '@/lib/db/schema/candidate'
import { users } from '@/lib/db/schema/core'
import { vectorizeResume } from '@/lib/ocy/vectorize-resume'

/* -------------------------------------------------------------------------- */
/*                              V A L I D A T I O N                           */
/* -------------------------------------------------------------------------- */

const urlField = z
  .string()
  .url('Invalid URL')
  .max(255)
  .or(z.literal('').transform(() => undefined))

/* -------------------------------------------------------------------------- */
/*                      U P D A T E   P R O F I L E                           */
/* -------------------------------------------------------------------------- */

export const updateCandidateProfile = validatedActionWithUser(
  z.object({
    name: z.string().min(1, 'Name is required').max(100),
    bio: z.string().max(2000).optional().default(''),

    twitterUrl: urlField.optional(),
    githubUrl: urlField.optional(),
    linkedinUrl: urlField.optional(),
    websiteUrl: urlField.optional(),
  }),
  async (data, _, user) => {
    const { name, bio, twitterUrl, githubUrl, linkedinUrl, websiteUrl } = data

    /* ----------------------- update core user row ------------------------ */
    await db.update(users).set({ name }).where(eq(users.id, user.id))

    /* --------------------------- upsert candidate ------------------------ */
    let [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1)

    if (!candidate) {
      const [created] = await db
        .insert(candidates)
        .values({
          userId: user.id,
          bio: bio ?? '',
          twitterUrl,
          githubUrl,
          linkedinUrl,
          websiteUrl,
        })
        .returning()
      candidate = created
    } else {
      await db
        .update(candidates)
        .set({
          bio: bio ?? '',
          twitterUrl,
          githubUrl,
          linkedinUrl,
          websiteUrl,
        })
        .where(eq(candidates.id, candidate.id))
    }

    /* -------------------- synchronous résumé vectorise ------------------- */
    try {
      await vectorizeResume(candidate.id)
    } catch (err) {
      console.error('vectorizeResume error:', err)
    }

    return { success: 'Profile updated successfully.', vectorizing: true }
  },
)
