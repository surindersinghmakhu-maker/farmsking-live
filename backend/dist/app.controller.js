"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./modules/prisma/prisma.service");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const privacy_policy_generator_1 = require("./common/utils/privacy-policy-generator");
let AppController = class AppController {
    constructor(appService, prisma) {
        this.appService = appService;
        this.prisma = prisma;
    }
    getHello() {
        return this.appService.getHello();
    }
    getHealth() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
    getDosePage() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MARIGOLD PRODUCTION - DRENCHING SCHEDULE | FarmsKing</title>
  <link rel="icon" href="/favicon.ico" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #0B0F17; color: #F9FAFB; padding: 16px; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; }
    .header-banner { background: linear-gradient(135deg, #064E3B 0%, #047857 100%); padding: 18px; border-radius: 12px; text-align: center; border: 1.5px solid #10B981; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(16,185,129,0.2); }
    .header-banner h1 { color: #FBBF24; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; }
    .header-banner h2 { color: #A7F3D0; font-size: 14px; font-weight: 800; margin-top: 4px; }
    
    .meta-card { background: #111827; border-radius: 12px; padding: 14px; margin-bottom: 16px; border: 1px solid #374151; }
    .card-title { color: #10B981; font-size: 14px; font-weight: 800; margin-bottom: 12px; }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .input-group { display: flex; flex-direction: column; gap: 4px; }
    .input-group label { color: #D1D5DB; font-size: 11px; font-weight: 700; }
    .input-group input { background: #1F2937; border: 1px solid #374151; border-radius: 8px; padding: 9px 12px; color: #FFF; font-size: 13px; font-weight: 600; outline: none; }
    .input-group input:focus { border-color: #10B981; }

    .table-container { background: #111827; border-radius: 12px; border: 1px solid #10B981; overflow: hidden; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #065F46; color: #FFF; font-size: 13px; font-weight: 800; padding: 12px; text-transform: uppercase; }
    td { padding: 10px 12px; border-bottom: 1px solid #1F2937; font-size: 13px; color: #F3F4F6; }
    tr:nth-child(even) { background: #111827; }
    tr:nth-child(odd) { background: #1F2937; }
    .sr-col { width: 10%; text-align: center; font-weight: 800; color: #F9FAFB; }
    .prod-col { width: 60%; font-weight: 600; }
    .qty-col { width: 30%; text-align: center; }
    .qty-input { background: #0F172A; border: 1px solid #374151; border-radius: 6px; padding: 6px 10px; color: #34D399; font-size: 13px; font-weight: 700; text-align: center; width: 100%; outline: none; }
    .qty-input:focus { border-color: #10B981; }

    .pdf-btn { background: #059669; color: white; width: 100%; padding: 14px; border-radius: 10px; border: none; font-size: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(16,185,129,0.3); transition: background 0.2s; }
    .pdf-btn:hover { background: #047857; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-banner">
      <h1>🌼 MARIGOLD PRODUCTION 🌼</h1>
      <h2>(DRENCHING SCHEDULE)</h2>
    </div>

    <div class="meta-card">
      <div class="card-title">📌 Farmer & Field Information</div>
      <div class="grid-3">
        <div class="input-group">
          <label>👤 Farmer / Customer Name</label>
          <input type="text" id="farmerName" placeholder="Enter Farmer Name">
        </div>
        <div class="input-group">
          <label>📏 Area (Acres/Bigha)</label>
          <input type="text" id="area" value="1 Acre">
        </div>
        <div class="input-group">
          <label>🌱 Total Plants Heading</label>
          <input type="text" id="plantsCount" value="10,000 Plants">
        </div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="text-align: center;">Sr. No.</th>
            <th>Product</th>
            <th style="text-align: center;">Quantity</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>

    <button class="pdf-btn" onclick="generatePDF()">📄 MAKE PDF REPORT</button>
  </div>

  <script>
    const scheduleItems = [
      { srNo: 1, product: 'Jaggery (Gud)', quantity: '3 kg' },
      { srNo: 2, product: 'Fulvic Acid', quantity: '500 g' },
      { srNo: 3, product: 'DAP', quantity: '10 kg' },
      { srNo: 4, product: 'MOP', quantity: '15 kg' },
      { srNo: 5, product: 'Urea* (Apply only where growth is less)', quantity: '5 kg' },
      { srNo: 6, product: 'Mustard Cake', quantity: '10 kg' },
      { srNo: 7, product: 'Neem Cake', quantity: '5 kg' },
      { srNo: 8, product: 'Sulphur', quantity: '2 kg' },
      { srNo: 9, product: 'Magnesium Sulphate', quantity: '2 kg' },
      { srNo: 10, product: 'Roko Fungicide', quantity: '250 g' },
      { srNo: 11, product: 'Humic Acid', quantity: '2 kg' },
      { srNo: 12, product: 'Boron 20%', quantity: '500 g' },
      { srNo: 13, product: 'Biovita', quantity: '500 g' },
      { srNo: 14, product: 'Amino Acid (Liquid 20%/50%)', quantity: '500 ml' },
      { srNo: 15, product: 'Chelated Iron (Fe 12%)', quantity: '250 g' },
      { srNo: 16, product: 'Chelated Zinc (Zn EDTA 12%)', quantity: '500 g' },
      { srNo: 17, product: 'Chelated Calcium (10–12%)', quantity: '500 g' },
      { srNo: 18, product: 'Sai power plus/multiplex kranti', quantity: '500 ml' }
    ];

    function renderTable() {
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = scheduleItems.map((item, idx) => \`
        <tr>
          <td class="sr-col">\${item.srNo}</td>
          <td class="prod-col">\${item.product}</td>
          <td class="qty-col">
            <input type="text" class="qty-input" value="\${item.quantity}" onchange="scheduleItems[\${idx}].quantity = this.value">
          </td>
        </tr>
      \`).join('');
    }

    function generatePDF() {
      const farmerName = document.getElementById('farmerName').value || 'FarmsKing Partner Farmer';
      const area = document.getElementById('area').value || '1 Acre';
      const plantsCount = document.getElementById('plantsCount').value || '10,000 Plants';

      const printWindow = window.open('', '_blank');
      const rowsHtml = scheduleItems.map(item => \`
        <tr>
          <td style="border: 1px solid #10b981; padding: 10px; text-align: center; font-weight: bold; width: 12%;">\${item.srNo}</td>
          <td style="border: 1px solid #10b981; padding: 10px; font-weight: 600; width: 58%;">\${item.product}</td>
          <td style="border: 1px solid #10b981; padding: 10px; text-align: center; color: #15803d; font-weight: bold; width: 30%;">\${item.quantity}</td>
        </tr>
      \`).join('');

      const printHtml = \`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MARIGOLD PRODUCTION DRENCHING SCHEDULE - FarmsKing</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 25px; color: #111827; }
            .header-banner { background: #14532d; color: white; padding: 18px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
            .header-banner h1 { margin: 0; color: #facc15; font-size: 24px; }
            .header-banner h2 { margin: 4px 0 0 0; color: #fef08a; font-size: 16px; }
            .farmer-meta { display: flex; justify-content: space-between; background: #f0fdf4; border: 2px solid #16a34a; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #15803d; color: white; padding: 10px; border: 1px solid #15803d; text-transform: uppercase; font-size: 13px; }
            td { font-size: 13px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1>🌼 MARIGOLD PRODUCTION 🌼</h1>
            <h2>(DRENCHING SCHEDULE)</h2>
          </div>
          <div class="farmer-meta">
            <div>👤 Farmer Name: \${farmerName}</div>
            <div>📏 Area: \${area}</div>
            <div>🌱 Total Plants: \${plantsCount}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Sr. No.</th>
                <th style="width: 58%;">Product</th>
                <th style="width: 30%;">Quantity</th>
              </tr>
            </thead>
            <tbody>\${rowsHtml}</tbody>
          </table>
          <div class="footer">
            <p>Generated via FarmsKing National Portal • www.farmsking.in</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      \`;

      printWindow.document.write(printHtml);
      printWindow.document.close();
    }

    renderTable();
  </script>
</body>
</html>`;
    }
    async syncUsers(body) {
        if (!Array.isArray(body.users)) {
            throw new common_1.BadRequestException('users must be an array');
        }
        const results = [];
        for (const u of body.users) {
            if (!u.mobile || !u.passwordHash)
                continue;
            const cleanMobile = u.mobile.trim();
            const existing = await this.prisma.user.findFirst({ where: { mobile: cleanMobile } });
            const userData = {
                kingId: u.kingId ?? '00000000',
                mobile: cleanMobile,
                passwordHash: u.passwordHash,
                role: u.role ?? client_1.Role.CUSTOMER,
                roles: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role ?? client_1.Role.CUSTOMER],
                deactivatedRoles: Array.isArray(u.deactivatedRoles) ? u.deactivatedRoles : [],
                name: u.name ?? 'User',
                email: u.email ?? null,
                village: u.village ?? null,
                district: u.district ?? null,
                state: u.state ?? null,
                pincode: u.pincode ?? null,
                postOffice: u.postOffice ?? null,
                sprayTankSizeL: u.sprayTankSizeL ?? null,
                soilType: u.soilType ?? null,
                waterType: u.waterType ?? null,
                preferredLanguage: u.preferredLanguage ?? 'en',
                advisorType: u.advisorType ?? null,
                operatorPermissions: Array.isArray(u.operatorPermissions) ? u.operatorPermissions : [],
                upiId: u.upiId ?? null,
                deletedAt: u.deletedAt ? new Date(u.deletedAt) : null,
            };
            if (existing) {
                const updated = await this.prisma.user.update({
                    where: { id: existing.id },
                    data: userData,
                });
                results.push({ mobile: cleanMobile, action: 'updated', id: updated.id });
            }
            else {
                const created = await this.prisma.user.create({
                    data: userData,
                });
                results.push({ mobile: cleanMobile, action: 'created', id: created.id });
            }
        }
        return { success: true, count: results.length, details: results };
    }
    getPrivacyPolicyPage() {
        return (0, privacy_policy_generator_1.generateDynamicPrivacyPolicyHtml)('https://farmsking.in');
    }
    getAccountDeletionPage() {
        return (0, privacy_policy_generator_1.generateAccountDeletionHtml)('https://farmsking.in');
    }
    getPrivacyPolicyJson() {
        return {
            success: true,
            appName: 'FarmsKing (ਫਾਰਮਜ਼ਕਿੰਗ)',
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            modules: privacy_policy_generator_1.DYNAMIC_SYSTEM_MODULES,
            deletionUrl: 'https://farmsking.in/account-deletion',
            supportEmail: 'support@farmsking.in',
            helpline: '+91 9872066901',
        };
    }
    async requestAccountDeletion(body) {
        if (!body.mobile || body.mobile.trim().length !== 10) {
            throw new common_1.BadRequestException('Please provide a valid 10-digit mobile number.');
        }
        const cleanMobile = body.mobile.trim();
        const user = await this.prisma.user.findFirst({
            where: { mobile: cleanMobile },
        });
        if (!user) {
            throw new common_1.BadRequestException('No registered FarmsKing account found for this mobile number.');
        }
        if (body.password && user.passwordHash) {
            const isValid = await argon2.verify(user.passwordHash, body.password);
            if (!isValid && body.password !== user.kingId) {
                throw new common_1.BadRequestException('Invalid password or King ID.');
            }
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                deletedAt: new Date(),
                name: 'Deleted User',
                email: null,
                upiId: null,
            },
        });
        return {
            success: true,
            message: `Account for mobile ${cleanMobile} has been successfully deleted and unlinked from FarmsKing.`,
            deletedAt: new Date().toISOString(),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('dose'),
    (0, common_1.Get)('doses'),
    (0, common_1.Header)('Content-Type', 'text/html'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getDosePage", null);
__decorate([
    (0, common_1.Post)('sync-users'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "syncUsers", null);
__decorate([
    (0, common_1.Get)('privacy-policy'),
    (0, common_1.Get)('privacy-policy.html'),
    (0, common_1.Get)('privacy'),
    (0, common_1.Header)('Content-Type', 'text/html'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getPrivacyPolicyPage", null);
__decorate([
    (0, common_1.Get)('account-deletion'),
    (0, common_1.Get)('account-deletion.html'),
    (0, common_1.Header)('Content-Type', 'text/html'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getAccountDeletionPage", null);
__decorate([
    (0, common_1.Get)('api/privacy-policy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getPrivacyPolicyJson", null);
__decorate([
    (0, common_1.Post)('api/request-account-deletion'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "requestAccountDeletion", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService,
        prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map