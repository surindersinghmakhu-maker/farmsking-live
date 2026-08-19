import { IsIn, IsOptional } from 'class-validator';

export class ListFarmersQueryDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'PENDING', 'ALL'])
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ALL';
}
