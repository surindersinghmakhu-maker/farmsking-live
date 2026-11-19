import { FARMSKING_CORPORATE_IDENTITY } from '@/src/constants/corporateIdentity';

export interface A4DocumentOptions {
  title: string;
  documentNumber?: string;
  issueDate?: string;
  bodyHtml: string;
  badgeText?: string;
  extraStyles?: string;
  footerNote?: string;
  showCorporateHeader?: boolean;
}

export function generateStandardA4Html(opts: A4DocumentOptions): string {
  const {
    title,
    documentNumber,
    issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    bodyHtml,
    badgeText,
    extraStyles = '',
    footerNote,
    showCorporateHeader = true,
  } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
    }
    body {
      margin: 0;
      padding: 0;
      font-size: 10.5pt;
      line-height: 1.45;
      background: #ffffff;
    }
    .a4-container {
      width: 100%;
      max-width: 180mm;
      margin: 0 auto;
    }
    .corporate-header {
      border-bottom: 2px solid #16a34a;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .co-legal-name {
      font-size: 13pt;
      font-weight: 800;
      color: #14532d;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .co-cin-tan {
      font-size: 8.5pt;
      color: #475569;
      margin-top: 3px;
      font-weight: 600;
    }
    .co-address {
      font-size: 8pt;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.3;
    }
    .doc-meta-box {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      background: #ecfdf5;
      border: 1px solid #16a34a;
      color: #15803d;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .doc-title {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .doc-meta-text {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 2px;
    }
    .page-break-avoid {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 14px;
    }
    th {
      background: #f8fafc;
      border-bottom: 1.5px solid #cbd5e1;
      font-size: 8.5pt;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      color: #334155;
    }
    td {
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 8px;
      font-size: 8.5pt;
    }
    .statutory-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 16px;
      font-size: 7.5pt;
      color: #64748b;
      text-align: center;
      line-height: 1.4;
      page-break-inside: avoid;
    }
    ${extraStyles}
  </style>
</head>
<body>
  <div class="a4-container">
    ${
      showCorporateHeader
        ? `
    <div class="corporate-header">
      <div>
        <h1 class="co-legal-name">${FARMSKING_CORPORATE_IDENTITY.legalName}</h1>
        <div class="co-cin-tan">CIN: ${FARMSKING_CORPORATE_IDENTITY.cin} | PAN: ${FARMSKING_CORPORATE_IDENTITY.pan} | TAN: ${FARMSKING_CORPORATE_IDENTITY.tan}</div>
        <div class="co-address">${FARMSKING_CORPORATE_IDENTITY.registeredOffice}</div>
      </div>
      <div class="doc-meta-box">
        ${badgeText ? `<div class="doc-badge">${badgeText}</div>` : ''}
        <h2 class="doc-title">${title}</h2>
        ${documentNumber ? `<div class="doc-meta-text">Ref / Doc #: <strong>${documentNumber}</strong></div>` : ''}
        <div class="doc-meta-text">Date: ${issueDate}</div>
      </div>
    </div>`
        : ''
    }

    <div class="doc-body">
      ${bodyHtml}
    </div>

    <div class="statutory-footer">
      ${footerNote ? `<div>${footerNote}</div>` : ''}
      <div>${FARMSKING_CORPORATE_IDENTITY.statutoryFooterText}</div>
      <div>Helpline: ${FARMSKING_CORPORATE_IDENTITY.helplinePhone} | Email: ${FARMSKING_CORPORATE_IDENTITY.supportEmail} | Web: ${FARMSKING_CORPORATE_IDENTITY.officialDomain}</div>
    </div>
  </div>
</body>
</html>`;
}
