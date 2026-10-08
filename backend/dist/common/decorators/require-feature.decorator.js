"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireFeature = exports.FEATURE_FLAG_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.FEATURE_FLAG_KEY = 'feature_flag_requirement';
const RequireFeature = (category, subCategory) => (0, common_1.SetMetadata)(exports.FEATURE_FLAG_KEY, { category, subCategory });
exports.RequireFeature = RequireFeature;
//# sourceMappingURL=require-feature.decorator.js.map