"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADVISOR_PROFILE_FIELDS = exports.BUSINESS_PARTNER_PROFILE_FIELDS = void 0;
exports.getPartnerProfileStatus = getPartnerProfileStatus;
exports.getAdvisorPayoutProfileStatus = getAdvisorPayoutProfileStatus;
const PAYOUT_PROFILE_FIELDS = [
    'upiId',
    'panNumber',
    'alternativeMobile',
    'email',
    'bankAccountNumber',
    'bankIfsc',
    'bankAccountHolderName',
];
const ADVISOR_DISPLAY_PROFILE_FIELDS = ['photoUrl', 'qualification', 'profileTitle'];
exports.BUSINESS_PARTNER_PROFILE_FIELDS = PAYOUT_PROFILE_FIELDS;
exports.ADVISOR_PROFILE_FIELDS = [...ADVISOR_DISPLAY_PROFILE_FIELDS, ...PAYOUT_PROFILE_FIELDS];
function getProfileStatus(user, requiredFields) {
    const missingFields = requiredFields.filter((field) => !user[field]);
    return { profileComplete: missingFields.length === 0, missingFields };
}
function getPartnerProfileStatus(user) {
    return getProfileStatus(user, exports.BUSINESS_PARTNER_PROFILE_FIELDS);
}
function getAdvisorPayoutProfileStatus(user) {
    return getProfileStatus(user, exports.ADVISOR_PROFILE_FIELDS);
}
//# sourceMappingURL=partner-profile.util.js.map