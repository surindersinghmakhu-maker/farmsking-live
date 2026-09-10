"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueKingId = generateUniqueKingId;
const crypto_1 = require("crypto");
function generateKingIdCandidate() {
    const digits = (0, crypto_1.randomBytes)(4).readUInt32BE(0) % 100_000_000;
    return digits.toString().padStart(8, '0');
}
async function generateUniqueKingId(prisma) {
    let candidate = generateKingIdCandidate();
    while (await prisma.user.findUnique({ where: { kingId: candidate } })) {
        candidate = generateKingIdCandidate();
    }
    return candidate;
}
//# sourceMappingURL=king-id.util.js.map