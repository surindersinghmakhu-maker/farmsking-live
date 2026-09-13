"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateExpenseDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_expense_dto_1 = require("./create-expense.dto");
class UpdateExpenseDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_expense_dto_1.CreateExpenseDto, ['farmId'])) {
}
exports.UpdateExpenseDto = UpdateExpenseDto;
//# sourceMappingURL=update-expense.dto.js.map