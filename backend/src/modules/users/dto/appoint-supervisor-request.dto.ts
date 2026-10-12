import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class FeaturePermissionDto {
  view: boolean;
  entry: boolean;
}

export class SupervisorFeaturesConfigDto {
  sales?: FeaturePermissionDto;
  labour?: FeaturePermissionDto;
  spray?: FeaturePermissionDto;
  purchases?: FeaturePermissionDto;
  crops?: FeaturePermissionDto;
  advisory?: FeaturePermissionDto;
}

export class AppointSupervisorRequestDto {
  @IsNotEmpty()
  @IsString()
  supervisorKingId: string;

  @IsObject()
  featuresConfig: SupervisorFeaturesConfigDto;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RespondSupervisorRequestDto {
  @IsNotEmpty()
  @IsString()
  action: 'ACCEPT' | 'REJECT';
}
