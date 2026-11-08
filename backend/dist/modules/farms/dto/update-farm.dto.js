"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFarmDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_farm_dto_1 = require("./create-farm.dto");
class UpdateFarmDto extends (0, mapped_types_1.PartialType)(create_farm_dto_1.CreateFarmDto) {
}
exports.UpdateFarmDto = UpdateFarmDto;
//# sourceMappingURL=update-farm.dto.js.map