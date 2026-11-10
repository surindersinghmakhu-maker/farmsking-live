"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaStoreModule = void 0;
const common_1 = require("@nestjs/common");
const media_store_controller_1 = require("./media-store.controller");
const media_store_service_1 = require("./media-store.service");
const uploads_module_1 = require("../uploads/uploads.module");
let MediaStoreModule = class MediaStoreModule {
};
exports.MediaStoreModule = MediaStoreModule;
exports.MediaStoreModule = MediaStoreModule = __decorate([
    (0, common_1.Module)({
        imports: [uploads_module_1.UploadsModule],
        controllers: [media_store_controller_1.MediaStoreController],
        providers: [media_store_service_1.MediaStoreService],
        exports: [media_store_service_1.MediaStoreService],
    })
], MediaStoreModule);
//# sourceMappingURL=media-store.module.js.map