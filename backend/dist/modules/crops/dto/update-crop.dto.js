"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCropDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_crop_dto_1 = require("./create-crop.dto");
class UpdateCropDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_crop_dto_1.CreateCropDto, ['plotId'])) {
}
exports.UpdateCropDto = UpdateCropDto;
//# sourceMappingURL=update-crop.dto.js.map