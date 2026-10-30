"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        let retries = 5;
        while (retries > 0) {
            try {
                await this.$connect();
                this.logger.log('Successfully connected to database.');
                try {
                    await this.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" TEXT;`);
                    await this.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'users_googleId_key') THEN CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId"); END IF; END $$;`);
                    await this.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "supervisorFeaturesConfig" JSONB DEFAULT '{}'::jsonb;`);
                    await this.$executeRawUnsafe(`ALTER TABLE "seller_stores" ADD COLUMN IF NOT EXISTS "categoryCommissions" JSONB DEFAULT '{}'::jsonb;`);
                    await this.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "supervisor_requests" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "farmerId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
              "supervisorId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
              "status" TEXT NOT NULL DEFAULT 'PENDING',
              "featuresConfig" JSONB NOT NULL DEFAULT '{}'::jsonb,
              "note" TEXT,
              "respondedAt" TIMESTAMP WITH TIME ZONE,
              "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
          `);
                    await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "supervisor_requests_farmerId_idx" ON "supervisor_requests"("farmerId");`);
                    await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "supervisor_requests_supervisorId_idx" ON "supervisor_requests"("supervisorId");`);
                    await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "supervisor_requests_status_idx" ON "supervisor_requests"("status");`);
                    await this.$executeRawUnsafe(`
            UPDATE "users"
            SET "roles" = array_append("roles", 'CUSTOMER'::"Role")
            WHERE "kingId" IS NOT NULL
              AND "role" NOT IN ('ADMIN', 'SUPER_ADMIN')
              AND NOT ('CUSTOMER'::"Role" = ANY("roles"));
          `);
                    this.logger.log('Auto-migration checked for users.googleId, supervisorFeaturesConfig, supervisor_requests, and kingId CUSTOMER role baseline.');
                }
                catch (migErr) {
                    this.logger.warn(`Auto-migration check notice: ${migErr.message}`);
                }
                break;
            }
            catch (err) {
                this.logger.warn(`Failed to connect to database. Retries left: ${retries - 1}`);
                retries -= 1;
                if (retries === 0) {
                    this.logger.error('Could not connect to database after retries. Proceeding with lazy connect...');
                    break;
                }
                await new Promise((res) => setTimeout(res, 3000));
            }
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map