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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const compliance_service_1 = require("./compliance.service");
const compliance_record_dto_1 = require("./dto/compliance-record.dto");
let ComplianceController = class ComplianceController {
    constructor(complianceService) {
        this.complianceService = complianceService;
    }
    getCaSummary() {
        return this.complianceService.getCaSummary();
    }
    exportGstr8Csv(month, year) {
        const now = new Date();
        const m = Math.min(12, Math.max(1, parseInt(month || String(now.getMonth() + 1), 10) || 1));
        const y = Math.min(2100, Math.max(2020, parseInt(year || String(now.getFullYear()), 10) || now.getFullYear()));
        return this.complianceService.exportGstr8Csv(m, y);
    }
    exportTdsCsv(section) {
        return this.complianceService.exportTdsCsv(section);
    }
    listRecords() {
        return this.complianceService.listRecords();
    }
    createRecord(user, dto) {
        return this.complianceService.createRecord(user, dto);
    }
    updateRecord(user, id, dto) {
        return this.complianceService.updateRecord(user, id, dto);
    }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, common_1.Get)('ca-summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "getCaSummary", null);
__decorate([
    (0, common_1.Get)('gstr8-csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="farmsking-gstr8.csv"'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "exportGstr8Csv", null);
__decorate([
    (0, common_1.Get)('tds-csv'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="farmsking-tds-register.csv"'),
    __param(0, (0, common_1.Query)('section')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "exportTdsCsv", null);
__decorate([
    (0, common_1.Get)('records'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "listRecords", null);
__decorate([
    (0, common_1.Post)('records'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, compliance_record_dto_1.CreateComplianceRecordDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "createRecord", null);
__decorate([
    (0, common_1.Patch)('records/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, compliance_record_dto_1.UpdateComplianceRecordDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "updateRecord", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT),
    (0, common_1.Controller)('compliance'),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map