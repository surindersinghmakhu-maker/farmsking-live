import { BadRequestException, Body, Controller, Get, Header, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './modules/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { DYNAMIC_SYSTEM_MODULES, generateDynamicPrivacyPolicyHtml, generateAccountDeletionHtml } from './privacy-policy-generator';


@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('dose')
  @Get('doses')
  @Header('Content-Type', 'text/html')
  getDosePage(): string {
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

  @Post('sync-users')
  async syncUsers(@Body() body: { users: any[] }) {
    if (!Array.isArray(body.users)) {
      throw new BadRequestException('users must be an array');
    }
    const results: any[] = [];
    for (const u of body.users) {
      if (!u.mobile || !u.passwordHash) continue;
      const cleanMobile = u.mobile.trim();
      const existing = await this.prisma.user.findFirst({ where: { mobile: cleanMobile } });

      const userData = {
        kingId: u.kingId ?? '00000000',
        mobile: cleanMobile,
        passwordHash: u.passwordHash,
        role: u.role ?? Role.CUSTOMER,
        roles: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role ?? Role.CUSTOMER],
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
      } else {
        const created = await this.prisma.user.create({
          data: userData,
        });
        results.push({ mobile: cleanMobile, action: 'created', id: created.id });
      }
    }
    return { success: true, count: results.length, details: results };
  }

  @Get('setup-admin')
  async setupAdmin() {
    const mobile = '9872066901';
    const passwordHash = await argon2.hash('12345678');
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ mobile }, { role: Role.SUPER_ADMIN }] },
    });

    if (existing) {
      const currentRoles = existing.roles ?? [];
      const hasSuper = currentRoles.includes(Role.SUPER_ADMIN);
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          mobile,
          passwordHash,
          role: Role.SUPER_ADMIN,
          roles: hasSuper ? currentRoles : [...currentRoles, Role.SUPER_ADMIN],
          deletedAt: null,
        },
      });
      return { success: true, action: 'updated', userId: updated.id, mobile: updated.mobile };
    }

    const created = await this.prisma.user.create({
      data: {
        kingId: '02101982',
        mobile,
        passwordHash,
        role: Role.SUPER_ADMIN,
        roles: [Role.SUPER_ADMIN, Role.CUSTOMER],
        name: 'FarmsKing Super Admin',
      },
    });
    return { success: true, action: 'created', userId: created.id, mobile: created.mobile };
  }

  @Get('privacy-policy')
  @Get('privacy-policy.html')
  @Get('privacy')
  @Header('Content-Type', 'text/html')
  getPrivacyPolicyPage(): string {
    return generateDynamicPrivacyPolicyHtml('https://farmsking.in');
  }

  @Get('account-deletion')
  @Get('account-deletion.html')
  @Header('Content-Type', 'text/html')
  getAccountDeletionPage(): string {
    return generateAccountDeletionHtml('https://farmsking.in');
  }

  @Get('api/privacy-policy')
  getPrivacyPolicyJson() {
    return {
      success: true,
      appName: 'FarmsKing (ਫਾਰਮਜ਼ਕਿੰਗ)',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      modules: DYNAMIC_SYSTEM_MODULES,
      deletionUrl: 'https://farmsking.in/account-deletion',
      supportEmail: 'support@farmsking.in',
      helpline: '+91 9872066901',
    };
  }

  @Post('api/request-account-deletion')
  async requestAccountDeletion(@Body() body: { mobile?: string; password?: string; reason?: string }) {
    if (!body.mobile || body.mobile.trim().length !== 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number.');
    }
    const cleanMobile = body.mobile.trim();
    const user = await this.prisma.user.findFirst({
      where: { mobile: cleanMobile },
    });

    if (!user) {
      throw new BadRequestException('No registered FarmsKing account found for this mobile number.');
    }

    // Verify password if provided
    if (body.password && user.passwordHash) {
      const isValid = await argon2.verify(user.passwordHash, body.password);
      if (!isValid && body.password !== user.kingId) {
        throw new BadRequestException('Invalid password or King ID.');
      }
    }

    // Soft delete / anonymize user data
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
}

