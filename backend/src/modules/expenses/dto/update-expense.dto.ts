import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';

export class UpdateExpenseDto extends PartialType(OmitType(CreateExpenseDto, ['farmId'] as const)) {}
