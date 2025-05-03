'use server'

import { eq, and } from 'drizzle-orm'
import { ethers } from 'ethers'
import { z } from 'zod'

import { validatedActionWithUser } from '@/lib/auth/middleware'
import { provider } from '@/lib/contracts'
import { issueCredential } from '@/lib/contracts/rivalidate'
import { db } from '@/lib/db/drizzle'
import { candidateCredentials, CredentialStatus, candidates } from '@/lib/db/schema/candidate'
import { users, teams, teamMembers } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import { extractAddressFromDid, toBytes32 } from '@/lib/utils/address'
import { signCredentialMint } from '@/lib/utils/signature'

/* -------------------------------------------------------------------------- */
/*                       A P P R O V E  /  S I G N  V C                       */
/* -------------------------------------------------------------------------- */

export const approveCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return { error: 'Issuer not found.' }
    if (!issuer.did) return { error: 'Link a DID before approving credentials.' }

    const [cred] = await db
      .select()
      .from(candidateCredentials)
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )
      .limit(1)
    if (!cred) return { error: 'Credential not found for this issuer.' }
    if (cred.status === CredentialStatus.VERIFIED) return { error: 'Credential already verified.' }

    /* ----------------------- candidate + subject DID ---------------------- */
    const [candRow] = await db
      .select({ cand: candidates, candUser: users })
      .from(candidates)
      .leftJoin(users, eq(candidates.userId, users.id))
      .where(eq(candidates.id, cred.candidateId))
      .limit(1)
    if (!candRow?.candUser) return { error: 'Candidate user not found.' }

    const [teamRow] = await db
      .select({ did: teams.did })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, candRow.candUser.id))
      .limit(1)
    const subjectDid = teamRow?.did
    if (!subjectDid)
      return { error: 'Candidate has no DID – ask them to create one before verification.' }

    /* ---------------------- VC creation & anchoring ----------------------- */
    const credentialSubject = {
      id: subjectDid,
      title: cred.title,
      type: cred.type,
      candidateName: candRow.candUser.name || candRow.candUser.email || 'Unknown',
    }

    const vcPayload = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'RivalidateCredential'],
      issuer: issuer.did,
      issuanceDate: new Date().toISOString(),
      credentialSubject,
    } as const

    const vcJsonText = JSON.stringify(vcPayload)
    const vcHash = toBytes32(vcJsonText)

    const to = extractAddressFromDid(subjectDid)
    if (!to) return { error: 'Malformed subject DID.' }

    const PK = process.env.PLATFORM_SIGNER_PRIVATE_KEY
    if (!PK) return { error: 'Platform signer private key not configured.' }
    const platformSigner = new ethers.Wallet(PK, provider)

    let sig: string
    try {
      sig = await signCredentialMint(to, vcHash, '')
    } catch (err: any) {
      return {
        error: `Failed to create platform signature: ${err?.message || String(err)}`,
      }
    }

    let tokenId: string
    let txHash: string
    try {
      const res = await issueCredential({
        to,
        vcHash,
        uri: '',
        signer: platformSigner,
        signature: sig,
      })
      tokenId = res.tokenId.toString()
      txHash = res.txHash
    } catch (err: any) {
      return { error: `Failed to anchor credential: ${err?.message || String(err)}` }
    }

    const newVcJson = JSON.stringify({ tokenId, txHash })

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.VERIFIED,
        verified: true,
        verifiedAt: new Date(),
        vcJson: newVcJson,
        txHash,
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential verified and NFT anchored on Base.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                              R E J E C T                                   */
/* -------------------------------------------------------------------------- */

export const rejectCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return { error: 'Issuer not found.' }

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.REJECTED,
        verified: false,
        verifiedAt: new Date(),
      })
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )

    return { success: 'Credential rejected.' }
  },
)

/* -------------------------------------------------------------------------- */
/*                            U N V E R I F Y                                 */
/* -------------------------------------------------------------------------- */

export const unverifyCredentialAction = validatedActionWithUser(
  z.object({ credentialId: z.coerce.number() }),
  async ({ credentialId }, _, user) => {
    const [issuer] = await db
      .select()
      .from(issuers)
      .where(eq(issuers.ownerUserId, user.id))
      .limit(1)
    if (!issuer) return { error: 'Issuer not found.' }

    const [cred] = await db
      .select()
      .from(candidateCredentials)
      .where(
        and(
          eq(candidateCredentials.id, credentialId),
          eq(candidateCredentials.issuerId, issuer.id),
        ),
      )
      .limit(1)
    if (!cred) return { error: 'Credential not found for this issuer.' }
    if (cred.status !== CredentialStatus.VERIFIED)
      return { error: 'Only verified credentials can be unverified.' }

    await db
      .update(candidateCredentials)
      .set({
        status: CredentialStatus.UNVERIFIED,
        verified: false,
        verifiedAt: null,
      })
      .where(eq(candidateCredentials.id, cred.id))

    return { success: 'Credential marked unverified.' }
  },
)