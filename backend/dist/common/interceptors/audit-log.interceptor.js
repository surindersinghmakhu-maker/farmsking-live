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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const REDACT_KEYS = new Set(['password', 'passwordHash', 'securityAnswer', 'securityAnswerHash', 'newPassword']);
const UUID_LIKE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
function redact(body) {
    if (!body || typeof body !== 'object')
        return body;
    const clone = { ...body };
    for (const key of Object.keys(clone)) {
        if (REDACT_KEYS.has(key))
            clone[key] = '[REDACTED]';
    }
    return clone;
}
function deriveAction(path) {
    const segments = path
        .replace(/^\/api\/v1\//, '')
        .split('/')
        .filter((segment) => segment && !UUID_LIKE.test(segment));
    return segments.join('.') || path;
}
let AuditLogInterceptor = class AuditLogInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        if (!MUTATING_METHODS.has(method)) {
            return next.handle();
        }
        const write = (statusCode) => {
            try {
                const path = request.originalUrl?.split('?')[0] ?? request.url;
                this.prisma.auditLog
                    .create({
                    data: {
                        actorId: request.user?.id,
                        actorRole: request.user?.role,
                        method,
                        path,
                        action: deriveAction(path),
                        targetId: request.params?.id,
                        statusCode,
                        metadata: { body: redact(request.body) },
                    },
                })
                    .catch((err) => console.error('AuditLogInterceptor write failed:', err));
            }
            catch (err) {
                console.error('AuditLogInterceptor failed:', err);
            }
        };
        return next.handle().pipe((0, rxjs_1.tap)(() => write(context.switchToHttp().getResponse().statusCode)), (0, rxjs_1.catchError)((err) => {
            write(err?.status ?? 500);
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map