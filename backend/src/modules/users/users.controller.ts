import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OperatorPermission, Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OperatorPermissionGuard } from '../../common/guards/operator-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireOperatorPermission } from '../../common/decorators/operator-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { UsersService } from './users.service';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateActiveRolesDto } from './dto/update-active-roles.dto';
import { UpdateFarmerProfileDto } from './dto/update-farmer-profile.dto';
import { UpdateAdvisorProfileDto } from './dto/update-advisor-profile.dto';
import { UpdatePartnerProfileDto } from './dto/update-partner-profile.dto';
import { UpdateMyAddressDto } from './dto/update-my-address.dto';
import { UpdateOperatorPermissionsDto } from './dto/update-operator-permissions.dto';
import { SetReferrerDto } from './dto/set-referrer.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
    Role.LABOUR,
  )
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user);
  }

  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
    Role.LABOUR,
  )
  @Delete('me')
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteMe(user);
  }

  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
    Role.LABOUR,
  )
  @Post('me/delete')
  deleteMePost(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteMe(user);
  }

  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
    Role.LABOUR,
  )
  @Get('me/invite-link')
  getMyInviteLink(@CurrentUser() user: AuthUser) {
    return this.usersService.getMyInviteLink(user);
  }

  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
    Role.LABOUR,
  )
  @Get('me/referrals')
  getMyReferrals(@CurrentUser() user: AuthUser) {
    return this.usersService.getMyReferrals(user);
  }

  @Roles(Role.CUSTOMER)
  @Post('me/become-farmer')
  becomeFarmer(@CurrentUser() user: AuthUser, @Body() dto?: UpdateFarmerProfileDto) {
    return this.usersService.becomeFarmer(user, dto);
  }

  @Roles(Role.CUSTOMER)
  @Post('me/become-gardener')
  becomeGardener(@CurrentUser() user: AuthUser) {
    return this.usersService.becomeGardener(user);
  }

  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
    Role.LABOUR,
  )
  @Patch('me/address')
  updateMyAddress(@CurrentUser() user: AuthUser, @Body() dto: UpdateMyAddressDto) {
    return this.usersService.updateMyAddress(user, dto);
  }

  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
    Role.LABOUR,
  )
  @Get('me/profile-status')
  getMyProfileStatus(@CurrentUser() user: AuthUser) {
    return this.usersService.getFarmerProfileStatus(user);
  }

  @Roles(
    Role.CUSTOMER,
    Role.FARMER,
    Role.GARDENER,
    Role.ADVISOR,
    Role.BUSINESS_PARTNER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.OPERATOR,
    Role.LABOUR,
  )
  @Patch('me/profile')
  updateMyProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateFarmerProfileDto) {
    return this.usersService.updateFarmerProfile(user, dto);
  }

  @Roles(Role.ADVISOR)
  @Patch('me/advisor-profile')
  updateMyAdvisorProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateAdvisorProfileDto) {
    return this.usersService.updateAdvisorProfile(user, dto);
  }

  @Roles(Role.ADVISOR)
  @Get('me/advisor-profile-status')
  getMyAdvisorProfileStatus(@CurrentUser() user: AuthUser) {
    return this.usersService.getAdvisorProfileStatus(user);
  }

  @Roles(Role.BUSINESS_PARTNER)
  @Patch('me/partner-profile')
  updateMyPartnerProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdatePartnerProfileDto) {
    return this.usersService.updatePartnerProfile(user, dto);
  }

  @Roles(Role.BUSINESS_PARTNER)
  @Get('me/partner-profile-status')
  getMyPartnerProfileStatus(@CurrentUser() user: AuthUser) {
    return this.usersService.getPartnerProfileStatus(user);
  }

  @UseGuards(OperatorPermissionGuard)
  @RequireOperatorPermission(OperatorPermission.VIEW_USERS)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  /** Advisor/Admin/Business Partner: resolve a farmer's FarmsKing ID to their account, e.g. to apply a coupon on their behalf. */
  @Roles(Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN, Role.BUSINESS_PARTNER)
  @Get('lookup/:kingId')
  lookupByKingId(@Param('kingId') kingId: string) {
    return this.usersService.lookupByKingId(kingId);
  }

  /** Advisor: type-search active Business Partners by name or king id, e.g. to share a self-generated coupon with one. */
  @Roles(Role.ADVISOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('search/business-partners')
  searchBusinessPartners(@Query('q') q?: string) {
    return this.usersService.searchBusinessPartners(q);
  }

  /** Admin/Super Admin: grant an Operator account read-only access to specific areas (users, coupons, wallets, ...). */
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/referrer')
  setReferrer(@Param('id') id: string, @Body() dto: SetReferrerDto) {
    return this.usersService.setReferrer(id, dto.referredByKingId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/admin-edit')
  adminUpdateUser(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdateUser(user, id, dto);
  }

  /** Sets a new password directly — never returns or stores the old one, since it's a one-way hash. */
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/reset-password')
  resetPassword(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ResetUserPasswordDto) {
    return this.usersService.resetPassword(user, id, dto.newPassword);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/operator-permissions')
  updateOperatorPermissions(@Param('id') id: string, @Body() dto: UpdateOperatorPermissionsDto) {
    return this.usersService.updateOperatorPermissions(id, dto.permissions);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('advisors')
  createAdvisor(@Body() dto: CreateAdvisorDto) {
    return this.usersService.createAdvisor(dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('operators')
  createOperator(@Body() dto: CreateStaffDto) {
    return this.usersService.createOperator(dto);
  }

  /** Only the Super Admin (the "owner") hires other Admins ("managers") — an Admin cannot create peers. */
  @Roles(Role.SUPER_ADMIN)
  @Post('admins')
  createAdmin(@Body() dto: CreateStaffDto) {
    return this.usersService.createAdmin(dto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id/detail')
  getDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.usersService.getDetail(user, id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/role')
  updateRole(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(user, id, dto.role);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/active-roles')
  updateActiveRoles(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateActiveRolesDto) {
    return this.usersService.updateActiveRoles(user, id, dto.activeRoles);
  }

  @Patch(':id/deactivate')
  deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.usersService.deactivate(user, id);
  }

  @Patch(':id/reactivate')
  reactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.usersService.reactivate(user, id);
  }
}
