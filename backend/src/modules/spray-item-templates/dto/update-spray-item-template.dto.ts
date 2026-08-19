import { PartialType } from '@nestjs/mapped-types';
import { CreateSprayItemTemplateDto } from './create-spray-item-template.dto';

export class UpdateSprayItemTemplateDto extends PartialType(CreateSprayItemTemplateDto) {}
