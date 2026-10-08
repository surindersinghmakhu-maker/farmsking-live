import { SprayScheduleStatus } from '@prisma/client';
import { CreateSprayScheduleDto } from './create-spray-schedule.dto';
declare const UpdateSprayScheduleDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateSprayScheduleDto, "cropCycleId">>>;
export declare class UpdateSprayScheduleDto extends UpdateSprayScheduleDto_base {
    status?: SprayScheduleStatus;
}
export {};
