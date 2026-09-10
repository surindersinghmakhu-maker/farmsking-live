"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueCropId = generateUniqueCropId;
const crypto_1 = require("crypto");
function generateCropIdCandidate() {
    const digits = (0, crypto_1.randomBytes)(4).readUInt32BE(0) % 1_000_000;
    return `CR-${digits.toString().padStart(6, '0')}`;
}
async function generateUniqueCropId(prisma) {
    let candidate = generateCropIdCandidate();
    while (await prisma.cropCycle.findUnique({ where: { cropId: candidate } })) {
        candidate = generateCropIdCandidate();
    }
    return candidate;
}
//# sourceMappingURL=crop-id.util.js.map