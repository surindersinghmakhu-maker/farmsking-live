"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let PartnerAssignmentService = class PartnerAssignmentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findMyPartner(user) {
        return this.prisma.partnerAssignment.findFirst({
            where: { customerId: user.id, status: client_1.PartnerAssignmentStatus.ACTIVE },
            include: {
                businessPartner: { select: { id: true, name: true, mobile: true, photoUrl: true } },
            },
        });
    }
    findMyCustomers(user) {
        return this.prisma.partnerAssignment.findMany({
            where: { businessPartnerId: user.id, status: client_1.PartnerAssignmentStatus.ACTIVE },
            include: {
                customer: { select: { id: true, name: true, mobile: true, photoUrl: true } },
            },
            orderBy: { startDate: 'desc' },
        });
    }
};
exports.PartnerAssignmentService = PartnerAssignmentService;
exports.PartnerAssignmentService = PartnerAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PartnerAssignmentService);
//# sourceMappingURL=partner-assignment.service.js.map