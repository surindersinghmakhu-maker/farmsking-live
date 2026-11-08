import { CreateExpenseDto } from './create-expense.dto';
declare const UpdateExpenseDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateExpenseDto, "farmId">>>;
export declare class UpdateExpenseDto extends UpdateExpenseDto_base {
}
export {};
