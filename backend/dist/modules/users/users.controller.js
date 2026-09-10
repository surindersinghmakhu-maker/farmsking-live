"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const operator_permission_guard_1 = require("../../common/guards/operator-permission.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const operator_permission_decorator_1 = require("../../common/decorators/operator-permission.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const users_service_1 = require("./users.service");
const create_advisor_dto_1 = require("./dto/create-advisor.dto");
const create_staff_dto_1 = require("./dto/create-staff.dto");
const list_users_query_dto_1 = require("./dto/list-users-query.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const update_active_roles_dto_1 = require("./dto/update-active-roles.dto");
const update_farmer_profile_dto_1 = require("./dto/update-farmer-profile.dto");
const update_advisor_profile_dto_1 = require("./dto/update-advisor-profile.dto");
const update_partner_profile_dto_1 = require("./dto/update-partner-profile.dto");
const update_my_address_dto_1 = require("./dto/update-my-address.dto");
const update_operator_permissions_dto_1 = require("./dto/update-operator-permissions.dto");
const set_referrer_dto_1 = require("./dto/set-referrer.dto");
const admin_update_user_dto_1 = require("./dto/admin-update-user.dto");
const reset_user_password_dto_1 = require("./dto/reset-user-password.dto");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    getMe(user) {
        return this.usersService.getMe(user);
    }
    deleteMe(user) {
        return this.usersService.deleteMe(user);
    }
    deleteMePost(user) {
        return this.usersService.deleteMe(user);
    }
    getMyInviteLink(user) {
        return this.usersService.getMyInviteLink(user);
    }
    getMyReferrals(user) {
        return this.usersService.getMyReferrals(user);
    }
    becomeFarmer(user, dto) {
        return this.usersService.becomeFarmer(user, dto);
    }
    becomeGardener(user) {
        return this.usersService.becomeGardener(user);
    }
    updateMyAddress(user, dto) {
        return this.usersService.updateMyAddress(user, dto);
    }
    getMyProfileStatus(user) {
        return this.usersService.getFarmerProfileStatus(user);
    }
    updateMyProfile(user, dto) {
        return this.usersService.updateFarmerProfile(user, dto);
    }
    updateMyAdvisorProfile(user, dto) {
        return this.usersService.updateAdvisorProfile(user, dto);
    }
    getMyAdvisorProfileStatus(user) {
        return this.usersService.getAdvisorProfileStatus(user);
    }
    updateMyPartnerProfile(user, dto) {
        return this.usersService.updatePartnerProfile(user, dto);
    }
    getMyPartnerProfileStatus(user) {
        return this.usersService.getPartnerProfileStatus(user);
    }
    list(query) {
        return this.usersService.list(query);
    }
    lookupByKingId(kingId) {
        return this.usersService.lookupByKingId(kingId);
    }
    searchBusinessPartners(q) {
        return this.usersService.searchBusinessPartners(q);
    }
    setReferrer(id, dto) {
        return this.usersService.setReferrer(id, dto.referredByKingId);
    }
    adminUpdateUser(user, id, dto) {
        return this.usersService.adminUpdateUser(user, id, dto);
    }
    resetPassword(user, id, dto) {
        return this.usersService.resetPassword(user, id, dto.newPassword);
    }
    updateOperatorPermissions(id, dto) {
        return this.usersService.updateOperatorPermissions(id, dto.permissions);
    }
    createAdvisor(dto) {
        return this.usersService.createAdvisor(dto);
    }
    createOperator(dto) {
        return this.usersService.createOperator(dto);
    }
    createAdmin(dto) {
        return this.usersService.createAdmin(dto);
    }
    getDetail(user, id) {
        return this.usersService.getDetail(user, id);
    }
    updateRole(user, id, dto) {
        return this.usersService.updateRole(user, id, dto.role);
    }
    updateActiveRoles(user, id, dto) {
        return this.usersService.updateActiveRoles(user, id, dto.activeRoles);
    }
    deactivate(user, id) {
        return this.usersService.deactivate(user, id);
    }
    reactivate(user, id) {
        return this.usersService.reactivate(user, id);
    }
    deleteUserByAdmin(user, id) {
        return this.usersService.deleteUserByAdmin(user, id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR, client_1.Role.LABOUR),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR, client_1.Role.LABOUR),
    (0, common_1.Delete)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteMe", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR, client_1.Role.LABOUR),
    (0, common_1.Post)('me/delete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteMePost", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR, client_1.Role.LABOUR),
    (0, common_1.Get)('me/invite-link'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyInviteLink", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR, client_1.Role.LABOUR),
    (0, common_1.Get)('me/referrals'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyReferrals", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER),
    (0, common_1.Post)('me/become-farmer'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_farmer_profile_dto_1.UpdateFarmerProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "becomeFarmer", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER),
    (0, common_1.Post)('me/become-gardener'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "becomeGardener", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR, client_1.Role.LABOUR),
    (0, common_1.Patch)('me/address'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_my_address_dto_1.UpdateMyAddressDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMyAddress", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR, client_1.Role.LABOUR),
    (0, common_1.Get)('me/profile-status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyProfileStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CUSTOMER, client_1.Role.FARMER, client_1.Role.GARDENER, client_1.Role.ADVISOR, client_1.Role.BUSINESS_PARTNER, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR, client_1.Role.LABOUR),
    (0, common_1.Patch)('me/profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_farmer_profile_dto_1.UpdateFarmerProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMyProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Patch)('me/advisor-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_advisor_profile_dto_1.UpdateAdvisorProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMyAdvisorProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR),
    (0, common_1.Get)('me/advisor-profile-status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyAdvisorProfileStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Patch)('me/partner-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_partner_profile_dto_1.UpdatePartnerProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMyPartnerProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Get)('me/partner-profile-status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyPartnerProfileStatus", null);
__decorate([
    (0, common_1.UseGuards)(operator_permission_guard_1.OperatorPermissionGuard),
    (0, operator_permission_decorator_1.RequireOperatorPermission)(client_1.OperatorPermission.VIEW_USERS),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.OPERATOR),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_users_query_dto_1.ListUsersQueryDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "list", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.BUSINESS_PARTNER),
    (0, common_1.Get)('lookup/:kingId'),
    __param(0, (0, common_1.Param)('kingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "lookupByKingId", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('search/business-partners'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "searchBusinessPartners", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id/referrer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_referrer_dto_1.SetReferrerDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setReferrer", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id/admin-edit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_update_user_dto_1.AdminUpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "adminUpdateUser", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id/reset-password'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reset_user_password_dto_1.ResetUserPasswordDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "resetPassword", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id/operator-permissions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_operator_permissions_dto_1.UpdateOperatorPermissionsDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateOperatorPermissions", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('advisors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_advisor_dto_1.CreateAdvisorDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('operators'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createOperator", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('admins'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)(':id/detail'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getDetail", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id/role'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id/active-roles'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_active_roles_dto_1.UpdateActiveRolesDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateActiveRoles", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/reactivate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "reactivate", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteUserByAdmin", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map