import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

/** A short, human-shareable public identifier for a crop cycle (e.g. "CR-482910") — used for support/reference. */
function generateCropIdCandidate(): string {
  const digits = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return `CR-${digits.toString().padStart(6, '0')}`;
}

/** Generates a Crop ID guaranteed not to collide with an existing one. */
export async function generateUniqueCropId(prisma: Pick<PrismaClient, 'cropCycle'>): Promise<string> {
  let candidate = generateCropIdCandidate();
  while (await prisma.cropCycle.findUnique({ where: { cropId: candidate } })) {
    candidate = generateCropIdCandidate();
  }
  return candidate;
}
