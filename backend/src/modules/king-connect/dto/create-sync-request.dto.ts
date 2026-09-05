import { IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartyLedgerEntryType } from '@prisma/client';

export class CreateSyncRequestDto {
  @IsNotEmpty()
  @IsString()
  receiverKingId: string; // King ID or Mobile of the other party

  @IsEnum(PartyLedgerEntryType)
  transactionType: PartyLedgerEntryType;

  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  refBillNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
