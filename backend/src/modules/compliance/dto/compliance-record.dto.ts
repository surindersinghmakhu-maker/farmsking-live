import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const COMPLIANCE_CATEGORIES = [
  'MCA_ROC',
  'GST',
  'INCOME_TAX_TDS',
  'AGRI_LICENSE',
  'PAYMENT_GATEWAY',
  'LEGAL_NOTICE',
  'AGREEMENT',
] as const;

export const COMPLIANCE_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLIANT',
  'OVERDUE',
] as const;

export class CreateComplianceRecordDto {
  @IsIn(COMPLIANCE_CATEGORIES)
  category: (typeof COMPLIANCE_CATEGORIES)[number];

  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNo?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  filedDate?: string;

  @IsOptional()
  @IsIn(COMPLIANCE_STATUSES)
  status?: (typeof COMPLIANCE_STATUSES)[number];

  @IsOptional()
  @IsIn(['ADVOCATE', 'CA', 'ACCOUNTANT', 'DIRECTOR'])
  assignedTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateComplianceRecordDto {
  @IsOptional()
  @IsIn(COMPLIANCE_CATEGORIES)
  category?: (typeof COMPLIANCE_CATEGORIES)[number];

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNo?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  filedDate?: string;

  @IsOptional()
  @IsIn(COMPLIANCE_STATUSES)
  status?: (typeof COMPLIANCE_STATUSES)[number];

  @IsOptional()
  @IsIn(['ADVOCATE', 'CA', 'ACCOUNTANT', 'DIRECTOR'])
  assignedTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

