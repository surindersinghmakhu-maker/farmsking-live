import { IsOptional, IsUUID } from 'class-validator';

export class IssuePartnerCouponDto {
  /** Omit to issue one to every active Agent instead of a single partner. */
  @IsOptional()
  @IsUUID()
  businessPartnerId?: string;
}
