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
exports.FeatureFlagGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const require_feature_decorator_1 = require("../decorators/require-feature.decorator");
const app_settings_service_1 = require("../../modules/app-settings/app-settings.service");
let FeatureFlagGuard = class FeatureFlagGuard {
    reflector;
    appSettingsService;
    constructor(reflector, appSettingsService) {
        this.reflector = reflector;
        this.appSettingsService = appSettingsService;
    }
    async canActivate(context) {
        const requirement = this.reflector.getAllAndOverride(require_feature_decorator_1.FEATURE_FLAG_KEY, [context.getHandler(), context.getClass()]);
        if (!requirement) {
            return true;
        }
        const { category, subCategory } = requirement;
        const featureFlags = await this.appSettingsService.getFeatureFlags();
        const catObj = featureFlags[category];
        if (!catObj || catObj.enabled === false) {
            throw new common_1.ForbiddenException(`ਇਹ Category (${category}) ਐਡਮਿਨ ਦੁਆਰਾ ਫਿਲਹਾਲ ਬੰਦ ਕੀਤੀ ਗਈ ਹੈ।`);
        }
        if (subCategory && catObj.subCategories) {
            const subObj = catObj.subCategories[subCategory];
            if (subObj && subObj.enabled === false) {
                throw new common_1.ForbiddenException(`ਇਹ ਸੁਵਿਧਾ (${subCategory}) ਐਡਮਿਨ ਦੁਆਰਾ ਫਿਲਹਾਲ ਬੰਦ ਕੀਤੀ ਗਈ ਹੈ।`);
            }
        }
        return true;
    }
};
exports.FeatureFlagGuard = FeatureFlagGuard;
exports.FeatureFlagGuard = FeatureFlagGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        app_settings_service_1.AppSettingsService])
], FeatureFlagGuard);
//# sourceMappingURL=feature-flag.guard.js.map