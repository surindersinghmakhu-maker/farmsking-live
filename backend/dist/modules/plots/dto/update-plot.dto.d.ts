import { CreatePlotDto } from './create-plot.dto';
declare const UpdatePlotDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreatePlotDto, "farmId">>>;
export declare class UpdatePlotDto extends UpdatePlotDto_base {
}
export {};
