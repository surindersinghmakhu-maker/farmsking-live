import { CreateCropDto } from './create-crop.dto';
declare const UpdateCropDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateCropDto, "plotId">>>;
export declare class UpdateCropDto extends UpdateCropDto_base {
}
export {};
