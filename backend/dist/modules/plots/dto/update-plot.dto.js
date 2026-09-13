"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePlotDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_plot_dto_1 = require("./create-plot.dto");
class UpdatePlotDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_plot_dto_1.CreatePlotDto, ['farmId'])) {
}
exports.UpdatePlotDto = UpdatePlotDto;
//# sourceMappingURL=update-plot.dto.js.map