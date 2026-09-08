"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const STATUS_BY_CODE = {
    P2002: common_1.HttpStatus.CONFLICT,
    P2025: common_1.HttpStatus.NOT_FOUND,
    P2003: common_1.HttpStatus.BAD_REQUEST,
};
const MESSAGE_BY_CODE = {
    P2002: 'A record with this value already exists.',
    P2025: 'The requested record was not found.',
    P2003: 'This operation references a record that does not exist.',
};
let PrismaExceptionFilter = PrismaExceptionFilter_1 = class PrismaExceptionFilter {
    logger = new common_1.Logger(PrismaExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = STATUS_BY_CODE[exception.code] ?? common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = MESSAGE_BY_CODE[exception.code] ?? 'An unexpected database error occurred.';
        this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
        response.status(status).json({
            statusCode: status,
            message,
        });
    }
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = PrismaExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError)
], PrismaExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map