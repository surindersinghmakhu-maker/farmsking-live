import { IsDecimal, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum GardenExpenseCategory {
  SEEDS = 'SEEDS',
  SOIL = 'SOIL',
  FERTILIZER = 'FERTILIZER',
  TOOLS = 'TOOLS',
  WATER = 'WATER',
  POTS = 'POTS',
  PESTICIDE = 'PESTICIDE',
  PLANTS = 'PLANTS',
  OTHER = 'OTHER',
}

export class CreateGardenExpenseDto {
  @IsString()
  title: string;

  @IsDecimal()
  amount: number;

  @IsEnum(GardenExpenseCategory)
  category: GardenExpenseCategory;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  gardenId?: string;

  @IsOptional()
  @IsUUID()
  plantId?: string;
}
