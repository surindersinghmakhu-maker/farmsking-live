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
const throttler_1 = require("@nestjs/throttler");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const operator_permission_guard_1 = require("../../common/guards/operator-permission.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const operator_permission_decorator_1 = require("../../common/decorators/operator-permission.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const users_service_1 = require("./users.service");
const create_advisor_dto_1 = require("./dto/create-advisor.dto");
const create_assistant_doctor_dto_1 = require("./dto/create-assistant-doctor.dto");
const create_staff_dto_1 = require("./dto/create-staff.dto");
const list_users_query_dto_1 = require("./dto/list-users-query.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const update_active_roles_dto_1 = require("./dto/update-active-roles.dto");
const update_farmer_profile_dto_1 = require("./dto/update-farmer-profile.dto");
const update_advisor_profile_dto_1 = require("./dto/update-advisor-profile.dto");
const update_partner_profile_dto_1 = require("./dto/update-partner-profile.dto");
const update_my_address_dto_1 = require("./dto/update-my-address.dto");
const update_operator_permissions_dto_1 = require("./dto/update-operator-permissions.dto");
const create_supervisor_dto_1 = require("./dto/create-supervisor.dto");
const appoint_supervisor_request_dto_1 = require("./dto/appoint-supervisor-request.dto");
const update_supervisor_permissions_dto_1 = require("./dto/update-supervisor-permissions.dto");
const update_admin_staff_permissions_dto_1 = require("./dto/update-admin-staff-permissions.dto");
const set_referrer_dto_1 = require("./dto/set-referrer.dto");
const admin_update_user_dto_1 = require("./dto/admin-update-user.dto");
const reset_user_password_dto_1 = require("./dto/reset-user-password.dto");
const assign_staff_role_dto_1 = require("./dto/assign-staff-role.dto");
const convert_verified_lead_dto_1 = require("./dto/convert-verified-lead.dto");
const admin_create_user_dto_1 = require("./dto/admin-create-user.dto");
const ALL_AUTHENTICATED_ROLES = [
    client_1.Role.CUSTOMER,
    client_1.Role.FARMER,
    client_1.Role.GARDENER,
    client_1.Role.ADVISOR,
    client_1.Role.AGENT,
    client_1.Role.SELLER,
    client_1.Role.TRADER,
    client_1.Role.SUPERVISOR,
    client_1.Role.LABOUR,
    client_1.Role.OPERATOR,
    client_1.Role.MANAGER,
    client_1.Role.TECHNICAL_TRAINER,
    client_1.Role.ACCOUNTANT,
    client_1.Role.ADMIN,
    client_1.Role.SUPER_ADMIN,
];
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    getMe(user) {
        return this.usersService.getMe(user);
    }
    requestDeleteMeOtp(user, body) {
        return this.usersService.requestDeleteMeOtp(user, body?.mobile);
    }
    deleteMe(user, body, queryOtp, headerOtp) {
        return this.usersService.deleteMe(user, {
            otp: body?.otp || queryOtp || headerOtp,
            firebaseIdToken: body?.firebaseIdToken,
        });
    }
    deleteMePost(user, body, queryOtp, headerOtp) {
        return this.usersService.deleteMe(user, {
            otp: body?.otp || queryOtp || headerOtp,
            firebaseIdToken: body?.firebaseIdToken,
        });
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
    sendAdminCreateOtp(user, dto) {
        return this.usersService.sendAdminCreateOtp(user, dto.mobile);
    }
    verifyAdminCreateOtp(user, dto) {
        return this.usersService.verifyAdminCreateOtp(user, dto.mobile, dto.otp);
    }
    adminCreateUser(user, dto) {
        return this.usersService.adminCreateUser(user, dto);
    }
    createAdvisor(dto) {
        return this.usersService.createAdvisor(dto);
    }
    createAssistantDoctor(user, dto) {
        return this.usersService.createAssistantDoctorBySenior(user, dto);
    }
    getMyAssistantDoctors(user) {
        return this.usersService.getMyAssistantDoctors(user);
    }
    createTrainer(dto) {
        return this.usersService.createTrainer(dto);
    }
    createOperator(dto) {
        return this.usersService.createOperator(dto);
    }
    createAdmin(dto) {
        return this.usersService.createAdmin(dto);
    }
    createManager(dto) {
        return this.usersService.createManager(dto);
    }
    createAccountant(dto) {
        return this.usersService.createAccountant(dto);
    }
    updateAdminStaffPermissions(id, dto) {
        return this.usersService.updateAdminStaffPermissions(id, dto.permissions);
    }
    createSupervisor(user, dto) {
        return this.usersService.createSupervisorByFarmer(user, dto);
    }
    appointSupervisorRequest(user, dto) {
        return this.usersService.appointSupervisorRequest(user, dto);
    }
    getSupervisorRequests(user) {
        return this.usersService.getSupervisorRequests(user);
    }
    respondToSupervisorRequest(user, requestId, dto) {
        return this.usersService.respondToSupervisorRequest(user, requestId, dto);
    }
    getActiveSupervisorAssignment(user) {
        return this.usersService.getActiveSupervisorAssignment(user);
    }
    getMySupervisors(user) {
        return this.usersService.getMySupervisors(user);
    }
    updateSupervisorFeatures(user, id, featuresConfig) {
        return this.usersService.updateSupervisorFeaturesConfig(user, id, featuresConfig);
    }
    updateSupervisorPermissions(user, id, dto) {
        return this.usersService.updateSupervisorPermissions(user, id, dto.permissions);
    }
    resignSupervisor(user, id) {
        return this.usersService.resignSupervisor(user, id);
    }
    assignSupervisorEmployer(user, id, employerFarmerId) {
        return this.usersService.assignSupervisorEmployer(user, id, employerFarmerId);
    }
    deleteSupervisor(user, id) {
        return this.usersService.deleteSupervisor(user, id);
    }
    listPartnerApplications(status) {
        return this.usersService.listPartnerApplications(status);
    }
    approvePartnerApplication(user, id, body, queryOtp, headerOtp) {
        return this.usersService.approvePartnerApplication(user, id, body?.adminConfirmationOtp || queryOtp || headerOtp);
    }
    rejectPartnerApplication(user, id, reason) {
        return this.usersService.rejectPartnerApplication(user, id, reason);
    }
    listVerifiedSignupLeads(status, search) {
        return this.usersService.listVerifiedSignupLeads(status, search);
    }
    updateVerifiedSignupLeadNotes(user, id, dto) {
        return this.usersService.updateVerifiedSignupLeadNotes(user, id, dto);
    }
    convertVerifiedLeadToUser(user, id, dto) {
        return this.usersService.convertVerifiedLeadToUser(user, id, dto);
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
    deleteUserByAdmin(user, id, body, queryOtp, headerOtp) {
        return this.usersService.deleteUserByAdmin(user, id, body?.adminConfirmationOtp || queryOtp || headerOtp);
    }
    assignStaffRole(user, dto) {
        return this.usersService.assignStaffRole(user, dto);
    }
    submitProfileCompletion(user, body) {
        return this.usersService.submitProfileCompletion(user, body);
    }
    getPendingApprovals() {
        return this.usersService.getPendingApprovals();
    }
    approveProfile(user, id) {
        return this.usersService.approveProfile(user, id);
    }
    rejectProfile(user, id, reason) {
        return this.usersService.rejectProfile(user, id, reason || 'Profile details incomplete or unverified');
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60_000 } }),
    (0, common_1.Post)('me/delete-otp'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "requestDeleteMeOtp", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
    (0, common_1.Delete)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('otp')),
    __param(3, (0, common_1.Headers)('x-delete-otp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteMe", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
    (0, common_1.Post)('me/delete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('otp')),
    __param(3, (0, common_1.Headers)('x-delete-otp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteMePost", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
    (0, common_1.Get)('me/invite-link'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyInviteLink", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
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
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
    (0, common_1.Patch)('me/address'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_my_address_dto_1.UpdateMyAddressDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMyAddress", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
    (0, common_1.Get)('me/profile-status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyProfileStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
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
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT),
    (0, common_1.Patch)('me/partner-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_partner_profile_dto_1.UpdatePartnerProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMyPartnerProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT),
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
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.AGENT),
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
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.Post)('admin-create/send-otp'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_create_user_dto_1.AdminCreateSendOtpDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "sendAdminCreateOtp", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, throttler_1.Throttle)({ default: { limit: 15, ttl: 60_000 } }),
    (0, common_1.Post)('admin-create/verify-otp'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_create_user_dto_1.AdminCreateVerifyOtpDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "verifyAdminCreateOtp", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('admin-create'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_create_user_dto_1.AdminCreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "adminCreateUser", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('advisors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_advisor_dto_1.CreateAdvisorDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createAdvisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('my-assistant-doctors'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_assistant_doctor_dto_1.CreateAssistantDoctorDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createAssistantDoctor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('my-assistant-doctors'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyAssistantDoctors", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('trainers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createTrainer", null);
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
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('managers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createManager", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN),
    (0, common_1.Post)('accountants'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createAccountant", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)(':id/admin-staff-permissions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_staff_permissions_dto_1.UpdateAdminStaffPermissionsDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateAdminStaffPermissions", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('my-supervisors'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_supervisor_dto_1.CreateSupervisorDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createSupervisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('my-supervisors/appoint-request'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, appoint_supervisor_request_dto_1.AppointSupervisorRequestDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "appointSupervisorRequest", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPERVISOR, client_1.Role.CUSTOMER, client_1.Role.GARDENER, client_1.Role.LABOUR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('my-supervisors/requests'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getSupervisorRequests", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPERVISOR, client_1.Role.CUSTOMER, client_1.Role.GARDENER, client_1.Role.LABOUR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('my-supervisors/requests/:requestId/respond'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, appoint_supervisor_request_dto_1.RespondSupervisorRequestDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "respondToSupervisorRequest", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPERVISOR, client_1.Role.CUSTOMER, client_1.Role.GARDENER, client_1.Role.LABOUR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('my-supervisors/active-assignment'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getActiveSupervisorAssignment", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPERVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('my-supervisors'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMySupervisors", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('my-supervisors/:id/features'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('featuresConfig')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateSupervisorFeatures", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('my-supervisors/:id/permissions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_supervisor_permissions_dto_1.UpdateSupervisorPermissionsDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateSupervisorPermissions", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPERVISOR, client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('my-supervisors/:id/resign'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "resignSupervisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Patch)('supervisors/:id/assign-employer'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('employerFarmerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "assignSupervisorEmployer", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.FARMER, client_1.Role.SUPER_ADMIN),
    (0, common_1.Delete)('my-supervisors/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteSupervisor", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('partner-applications'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listPartnerApplications", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('partner-applications/:id/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Query)('adminConfirmationOtp')),
    __param(4, (0, common_1.Headers)('x-admin-otp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "approvePartnerApplication", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('partner-applications/:id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "rejectPartnerApplication", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.MANAGER, client_1.Role.ACCOUNTANT),
    (0, common_1.Get)('verified-leads'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listVerifiedSignupLeads", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN, client_1.Role.MANAGER),
    (0, common_1.Patch)('verified-leads/:id/notes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, convert_verified_lead_dto_1.UpdateVerifiedLeadNotesDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateVerifiedSignupLeadNotes", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('verified-leads/:id/convert'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, convert_verified_lead_dto_1.ConvertVerifiedLeadDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "convertVerifiedLeadToUser", null);
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
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Query)('adminConfirmationOtp')),
    __param(4, (0, common_1.Headers)('x-admin-otp')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteUserByAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)('assign-staff-role'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, assign_staff_role_dto_1.AssignStaffRoleDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "assignStaffRole", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ALL_AUTHENTICATED_ROLES),
    (0, common_1.Post)('submit-profile-completion'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "submitProfileCompletion", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Get)('pending-approvals'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getPendingApprovals", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/approve-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "approveProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/reject-profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "rejectProfile", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map