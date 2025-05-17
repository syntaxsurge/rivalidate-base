import { z } from 'zod'

/* -------------------------------------------------------------------------- */
/*                         U N I S W A P   V 2   S W A P                      */
/* -------------------------------------------------------------------------- */

export const SwapEthToUsdcSchema = z.object({
  ethAmount: z.number().positive().describe('Amount of ETH to swap'),
  slippagePercent: z
    .number()
    .min(0)
    .max(50)
    .nullable()
    .default(1)
    .describe('Slippage percentage (default 1 %)'),
  deadlineMinutes: z.number().min(1).max(60).nullable().default(20),
})

/* -------------------------------------------------------------------------- */
/*                             D I D   R E G I S T R Y                        */
/* -------------------------------------------------------------------------- */

export const CreateDidSchema = z.object({
  docHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'Must be a 32-byte hex string')
    .default('0x0000000000000000000000000000000000000000000000000000000000000000')
    .describe('Keccak-256 hash of the DID document (optional)'),
})

export const UpdateDidDocumentSchema = z.object({
  uri: z.string().min(1).max(2048).describe('New URI for the DID document'),
  docHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'Must be a 32-byte hex string')
    .describe('Keccak-256 hash of the DID document'),
})

/* -------------------------------------------------------------------------- */
/*                         A D M I N   D I D   M I N T                        */
/* -------------------------------------------------------------------------- */

export const AdminCreateDidSchema = z.object({
  owner: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Must be a 20-byte wallet address')
    .describe('Wallet address to assign the DID to'),
  docHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, 'Must be a 32-byte hex string')
    .default('0x0000000000000000000000000000000000000000000000000000000000000000')
    .describe('Keccak-256 hash of the DID document (optional)'),
})
