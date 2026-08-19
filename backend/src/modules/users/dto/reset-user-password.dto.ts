import { IsOptional, IsString, MinLength } from 'class-validator';

/** Admin/Super Admin: set a new password for a user directly — the old password is never shown (it's a one-way hash). */
export class ResetUserPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
