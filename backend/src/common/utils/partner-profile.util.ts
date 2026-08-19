/** Payout fields — required before any Business Partner or Advisor wallet can be withdrawn from. */
const PAYOUT_PROFILE_FIELDS = [
  'upiId',
  'panNumber',
  'alternativeMobile',
  'email',
  'bankAccountNumber',
  'bankIfsc',
  'bankAccountHolderName',
] as const;

/** Advisor-only display fields, required on top of the payout fields above. */
const ADVISOR_DISPLAY_PROFILE_FIELDS = ['photoUrl', 'qualification', 'profileTitle'] as const;

export const BUSINESS_PARTNER_PROFILE_FIELDS = PAYOUT_PROFILE_FIELDS;
export const ADVISOR_PROFILE_FIELDS = [...ADVISOR_DISPLAY_PROFILE_FIELDS, ...PAYOUT_PROFILE_FIELDS] as const;

export type ProfileField = (typeof ADVISOR_PROFILE_FIELDS)[number];

type ProfileFieldValues = Partial<Record<ProfileField, string | null>>;

function getProfileStatus<F extends readonly ProfileField[]>(
  user: ProfileFieldValues,
  requiredFields: F,
): { profileComplete: boolean; missingFields: F[number][] } {
  const missingFields = requiredFields.filter((field) => !user[field]);
  return { profileComplete: missingFields.length === 0, missingFields };
}

/** Whether a Business Partner has filled in every payout field required before their wallet can be withdrawn from. */
export function getPartnerProfileStatus(user: ProfileFieldValues) {
  return getProfileStatus(user, BUSINESS_PARTNER_PROFILE_FIELDS);
}

/** Whether an Advisor has filled in their display profile + every payout field required before their wallet can be withdrawn from. */
export function getAdvisorPayoutProfileStatus(user: ProfileFieldValues) {
  return getProfileStatus(user, ADVISOR_PROFILE_FIELDS);
}
