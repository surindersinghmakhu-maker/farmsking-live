"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
    listStatutoryDocuments() {
        return this.complianceService.getStatutoryDocumentsCatalog();
    }
    downloadStatutoryDocument(downloadKey, forceDownload, res) {
        const filePath = this.complianceService.getStatutoryDocumentFilePath(downloadKey);
        if (!filePath || !fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Statutory document file not found.');
        }
        const filename = path.basename(filePath);
        const disposition = forceDownload === '1' ? 'attachment' : 'inline';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
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
__decorate([
    (0, common_1.Get)('documents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "listStatutoryDocuments", null);
__decorate([
    (0, common_1.Get)('documents/:downloadKey/download'),
    __param(0, (0, common_1.Param)('downloadKey')),
    __param(1, (0, common_1.Query)('download')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "downloadStatutoryDocument", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT),
    (0, common_1.Controller)('compliance'),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map