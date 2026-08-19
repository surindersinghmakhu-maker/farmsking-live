import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

/** A short, human-shareable public identifier for a user (e.g. "73829145") — used for wallet lookups and support. */
function generateKingIdCandidate(): string {
  const digits = randomBytes(4).readUInt32BE(0) % 100_000_000;
  return digits.toString().padStart(8, '0');
}

/** Generates a King ID guaranteed not to collide with an existing one. Accepts PrismaService or a plain PrismaClient (e.g. from seed scripts). */
export async function generateUniqueKingId(prisma: Pick<PrismaClient, 'user'>): Promise<string> {
  let candidate = generateKingIdCandidate();
  while (await prisma.user.findUnique({ where: { kingId: candidate } })) {
    candidate = generateKingIdCandidate();
  }
  return candidate;
}
