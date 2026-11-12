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
exports.SeoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const seo_service_1 = require("./seo.service");
let SeoController = class SeoController {
    constructor(seoService) {
        this.seoService = seoService;
    }
    getStatus() {
        return this.seoService.getStatus();
    }
    async triggerSubmission() {
        const report = await this.seoService.submitAllUrls();
        return {
            message: report.accepted
                ? 'SEO & AI Search Engine submission accepted successfully (HTTP 202)'
                : 'SEO submission dispatched with response recorded',
            report,
        };
    }
};
exports.SeoController = SeoController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live SEO indexing & automated search submission status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], SeoController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger instant SEO & AI Search IndexNow submission' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "triggerSubmission", null);
exports.SeoController = SeoController = __decorate([
    (0, swagger_1.ApiTags)('SEO & AI Search Engine Automation'),
    (0, common_1.Controller)('seo'),
    __metadata("design:paramtypes", [seo_service_1.SeoService])
], SeoController);
//# sourceMappingURL=seo.controller.js.map