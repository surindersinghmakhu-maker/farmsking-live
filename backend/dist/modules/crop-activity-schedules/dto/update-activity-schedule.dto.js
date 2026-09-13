"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateActivityScheduleDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_activity_schedule_dto_1 = require("./create-activity-schedule.dto");
class UpdateActivityScheduleDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_activity_schedule_dto_1.CreateActivityScheduleDto, ['cropCycleId'])) {
}
exports.UpdateActivityScheduleDto = UpdateActivityScheduleDto;
//# sourceMappingURL=update-activity-schedule.dto.js.map