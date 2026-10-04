const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const billingsDir = 'd:\\FarmsKing\\billings';
if (!fs.existsSync(billingsDir)) {
  fs.mkdirSync(billingsDir, { recursive: true });
}

const commonStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
    body {
      font-family: 'Inter', 'Noto Sans Gurmukhi', 'Noto Sans Devanagari', sans-serif;
      margin: 40px;
      color: #1e293b;
      line-height: 1.6;
      background-color: #ffffff;
    }
    h1 {
      color: #15803d;
      border-bottom: 3px solid #22c55e;
      padding-bottom: 10px;
      font-size: 26px;
    }
    h2 {
      color: #0f766e;
      margin-top: 25px;
      font-size: 20px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 5px;
    }
    h3 {
      color: #334155;
      font-size: 16px;
      margin-top: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      text-align: left;
      font-size: 14px;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .box {
      background-color: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .highlight {
      font-weight: bold;
      color: #166534;
    }
    .step-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 12px;
      background: #fafafa;
    }
    .step-title {
      font-weight: bold;
      color: #0f766e;
      font-size: 15px;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      text-align: center;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
  </style>
`;

// 1. ENGLISH HTML
const htmlEN = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — GST & Billing Architecture Document</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — Complete GST & Billing Architecture</h1>
  <p><strong>Document Date:</strong> September 30, 2026 | <strong>Platform:</strong> FarmsKing Agriculture Marketplace</p>

  <div class="box">
    <strong>Regulatory Position:</strong> FarmsKing operates as an <strong>Electronic Commerce Operator (ECO)</strong> under <strong>Section 52 of the CGST Act, 2017</strong>.
  </div>

  <h2>1. Invoice Numbering Architecture (GST Rule 46 Compliance)</h2>
  <p>As per GST Rule 46, invoice serial numbers must be consecutive, maximum 16 characters, unique per financial year, resetting on April 1st.</p>
  <table>
    <thead>
      <tr>
        <th>Invoice Type</th>
        <th>Code Format</th>
        <th>Example</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Customer Sales Invoice</td>
        <td>FK-INV-{FY}-{SeqNo}</td>
        <td>FK-INV-2627-000001</td>
        <td>Issued to Buyer on behalf of Seller with Seller's GSTIN.</td>
      </tr>
      <tr>
        <td>Platform Commission Invoice</td>
        <td>FK-COM-{FY}-{SeqNo}</td>
        <td>FK-COM-2627-000001</td>
        <td>Issued by FarmsKing to Seller for Platform Fee + 18% GST.</td>
      </tr>
      <tr>
        <td>Seller Payout Voucher</td>
        <td>FK-PAY-{FY}-{SeqNo}</td>
        <td>FK-PAY-2627-000001</td>
        <td>Payout settlement voucher detailing net earnings transfer.</td>
      </tr>
    </tbody>
  </table>

  <h2>2. Seller's Own Invoice Serial Number Handling</h2>
  <p>Under GST Rule 46, taxpayers are permitted to maintain <strong>Multiple Invoice Series</strong> for different sales channels:</p>
  <ul>
    <li><strong>Option A (Standard Marketplace Series - Recommended):</strong> Sellers maintain <code>OFF-2627-0001</code> for offline shop sales and <code>FK-S101-2627-000001</code> for FarmsKing online sales. This avoids invoice number collision between physical store and online sales.</li>
    <li><strong>Option B (Custom Seller Prefix):</strong> Sellers can configure their own custom invoice prefix in the FarmsKing Seller Dashboard (e.g., <code>GUPTA-2627-</code>) and FarmsKing auto-increments using that series.</li>
  </ul>

  <h2>3. End-to-End Money & Transaction Flow (Step 1 to Step 6)</h2>
  <div class="step-card">
    <div class="step-title">Step 1: Order Placement & Escrow Payment</div>
    <p>Customer orders on FarmsKing App (e.g. ₹10,000 product inclusive of GST). Customer pays ₹10,000 via online payment gateway into FarmsKing's Escrow/Nodal Bank Account.</p>
  </div>
  <div class="step-card">
    <div class="step-title">Step 2: Order Delivery & Document Generation</div>
    <p>Seller ships item. Upon delivery, FarmsKing automatically generates Customer Invoice, Commission Invoice, and Payout Voucher.</p>
  </div>
  <div class="step-card">
    <div class="step-title">Step 3: 7-Day Return Lock Period</div>
    <p>Funds remain held in FarmsKing Escrow during the 7-day customer return/exchange window.</p>
  </div>
  <div class="step-card">
    <div class="step-title">Step 4: Automated Split Settlement & Payout</div>
    <p>FarmsKing retains Platform Commission + 18% GST on commission + 1% TCS. The net payout is transferred directly to the seller's bank account/wallet via Auto-Payout API.</p>
  </div>
  <div class="step-card">
    <div class="step-title">Step 5: Monthly Government Return Filing</div>
    <p>FarmsKing files monthly GSTR-8 return by 10th of every month to deposit 1% TCS with the Govt. FarmsKing files GSTR-3B by 20th to deposit GST collected on commission.</p>
  </div>
  <div class="step-card">
    <div class="step-title">Step 6: Seller Accounting & Tax Credit Claim</div>
    <p>Seller files GSTR-1 & GSTR-3B. Seller claims ₹100 TCS credit (in Electronic Cash Ledger) and 18% Input Tax Credit (ITC) on FarmsKing's commission invoice.</p>
  </div>

  <h2>4. Detailed Transaction Calculation Models</h2>
  <h3>Model A: Exclusive of GST (Base Price ₹10,000 + 5% GST = ₹10,500)</h3>
  <ul>
    <li><strong>Customer Pays:</strong> ₹10,500</li>
    <li><strong>Net Taxable Base Price:</strong> ₹10,000</li>
    <li><strong>Product GST (5%):</strong> ₹500</li>
    <li><strong>TCS (1% of ₹10,000 Base):</strong> ₹100</li>
    <li><strong>Platform Commission (5% of ₹10,000 Base):</strong> ₹500</li>
    <li><strong>GST on Commission (18% of ₹500):</strong> ₹90</li>
    <li><strong>Total Deductions:</strong> ₹100 + ₹500 + ₹90 = ₹690</li>
    <li><strong>Net Seller Payout:</strong> ₹10,500 - ₹690 = <strong>₹9,810</strong></li>
  </ul>

  <h3>Model B: Inclusive of GST (Total Price ₹10,000 including 5% GST)</h3>
  <ul>
    <li><strong>Customer Pays:</strong> ₹10,000</li>
    <li><strong>Base Price (₹10,000 / 1.05):</strong> ₹9,523.81</li>
    <li><strong>Product GST (5%):</strong> ₹476.19</li>
    <li><strong>TCS (1% of ₹9,523.81 Base):</strong> ₹95.24</li>
    <li><strong>Platform Commission (5% of ₹9,523.81 Base):</strong> ₹476.19</li>
    <li><strong>GST on Commission (18% of ₹476.19):</strong> ₹85.71</li>
    <li><strong>Total Deductions:</strong> ₹657.14</li>
    <li><strong>Net Seller Payout:</strong> ₹10,000 - ₹657.14 = <strong>₹9,342.86</strong></li>
  </ul>

  <h3>Model C: Farmers Selling Raw Produce (Exempt under GST Notification 2/2017)</h3>
  <ul>
    <li>Raw agricultural produce (wheat, paddy, fresh vegetables) is 0% GST exempt.</li>
    <li>Unregistered farmers have <strong>0% TCS</strong>. FarmsKing only charges platform commission + 18% GST on commission.</li>
  </ul>

  <h2>5. Key Takeaways & Additional Technical Details</h2>
  <div class="box">
    <ul>
      <li><strong>Commission Rule:</strong> FarmsKing charges commission <em>only on the net base item price</em>, NEVER on the government tax portion.</li>
      <li><strong>TCS Benefit to Seller:</strong> The 1% TCS deposited by FarmsKing is not a loss to the seller; it is deposited into their Govt GST Cash Ledger to pay their monthly tax.</li>
      <li><strong>Input Tax Credit (ITC):</strong> The 18% GST charged on FarmsKing commission can be claimed back by GST-registered sellers as ITC.</li>
      <li><strong>Credit Notes:</strong> In case of product returns, FarmsKing automatically issues Credit Notes (<code>FK-CDN-2627-000001</code>) and reverses TCS/Commission accordingly.</li>
    </ul>
  </div>

  <div class="footer">
    FarmsKing Agriculture Ecosystem — Billing & GST Specifications Document | Confidential
  </div>
</body>
</html>
`;

// 2. PUNJABI HTML
const htmlPB = `
<!DOCTYPE html>
<html lang="pa">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — GST ਅਤੇ ਬਿਲਿੰਗ ਪ੍ਰਣਾਲੀ ਦਸਤਾਵੇਜ਼</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — ਪੂਰਾ GST ਅਤੇ ਬਿਲਿੰਗ ਸਿਸਟਮ ਢਾਂਚਾ</h1>
  <p><strong>ਦਸਤਾਵੇਜ਼ ਮਿਤੀ:</strong> 30 ਸਤੰਬਰ 2026 | <strong>ਪਲੇਟਫਾਰਮ:</strong> ਫਾਰਮਸਕਿੰਗ ਐਗਰੀਕਲਚਰ ਮਾਰਕੀਟਪਲੇਸ</p>

  <div class="box">
    <strong>ਕਾਨੂੰਨੀ ਸਥਿਤੀ:</strong> FarmsKing GST ਕਾਨੂੰਨ ਦੀ <strong>Section 52</strong> ਦੇ ਤਹਿਤ **Electronic Commerce Operator (ECO)** ਵਜੋਂ ਕੰਮ ਕਰਦਾ ਹੈ।
  </div>

  <h2>1. ਬਿਲ ਨੰਬਰ ਪ੍ਰਣਾਲੀ (GST Rule 46 ਅਨੁਸਾਰ)</h2>
  <p>GST ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਬਿਲ ਨੰਬਰ ਲਗਾਤਾਰ ਸੀਰੀਅਲ ਵਿੱਚ, ਵੱਧ ਤੋਂ ਵੱਧ 16 ਅੱਖਰਾਂ ਦਾ, ਅਤੇ ਹਰ ਵਿੱਤੀ ਸਾਲ (1 ਅਪ੍ਰੈਲ) ਵਿੱਚ ਰੀਸੈਟ ਹੋਣ ਵਾਲਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।</p>
  <table>
    <thead>
      <tr>
        <th>ਬਿਲ ਦੀ ਕਿਸਮ</th>
        <th>ਕੋਡ ਫਾਰਮੈਟ</th>
        <th>ਉਦਾਹਰਨ</th>
        <th>ਵੇਰਵਾ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Customer Sales Invoice (ਗਾਹਕ ਬਿਲ)</td>
        <td>FK-INV-{FY}-{SeqNo}</td>
        <td>FK-INV-2627-000001</td>
        <td>ਖਰੀਦਦਾਰ ਨੂੰ ਸੇਲਰ ਦੇ GSTIN ਨਾਲ ਦਿੱਤਾ ਜਾਣ ਵਾਲਾ ਬਿਲ।</td>
      </tr>
      <tr>
        <td>Commission Tax Invoice (ਕਮੀਸ਼ਨ ਬਿਲ)</td>
        <td>FK-COM-{FY}-{SeqNo}</td>
        <td>FK-COM-2627-000001</td>
        <td>FarmsKing ਵੱਲੋਂ ਸੇਲਰ ਲਈ (5% ਕਮੀਸ਼ਨ + 18% GST)।</td>
      </tr>
      <tr>
        <td>Seller Payout Voucher (ਪੇਆਉਟ ਬਿਲ)</td>
        <td>FK-PAY-{FY}-{SeqNo}</td>
        <td>FK-PAY-2627-000001</td>
        <td>ਸੇਲਰ ਦੇ ਖਾਤੇ 'ਚ ਪੈਸੇ ਟ੍ਰਾਂਸਫਰ ਕਰਨ ਦਾ ਹਿਸਾਬ-ਕਿਤਾਬ।</td>
      </tr>
    </tbody>
  </table>

  <h2>2. ਸੇਲਰ ਦੇ ਆਪਣੇ ਬਿਲ ਨੰਬਰ (Invoice Series) ਦਾ ਕੀ ਬਣੇਗਾ?</h2>
  <p>GST Rule 46 ਅਨੁਸਾਰ ਹਰੇਕ ਵਪਾਰੀ ਇੱਕ ਤੋਂ ਵੱਧ ਬਿਲ ਸੀਰੀਜ਼ (Multiple Invoice Series) ਰੱਖ ਸਕਦਾ ਹੈ:</p>
  <ul>
    <li><strong>ਤਰੀਕਾ A (ਸਿਫ਼ਾਰਸ਼ੀ / Automatic Series):</strong> ਸੇਲਰ ਦੁਕਾਨ ਦੀ ਆਫ਼ਲਾਈਨ ਵਿਕਰੀ ਲਈ ਆਪਣੀ ਸੀਰੀਜ਼ (ਜਿਵੇਂ <code>OFF-2627-0001</code>) ਚਲਾਏਗਾ ਅਤੇ FarmsKing ਆਨਲਾਈਨ ਵਿਕਰੀ ਲਈ ਵੱਖਰੀ ਸੀਰੀਜ਼ (ਜਿਵੇਂ <code>FK-S101-2627-000001</code>) ਚਲਾਏਗਾ। ਇਸ ਨਾਲ ਦੁਕਾਨ ਅਤੇ ਆਨਲਾਈਨ ਬਿਲ ਮਿਕਸ ਨਹੀਂ ਹੁੰਦੇ।</li>
    <li><strong>ਤਰੀਕਾ B (Custom Seller Prefix):</strong> ਸੇਲਰ FarmsKing Seller Dashboard 'ਚ ਆਪਣਾ ਪ੍ਰੀਫ਼ਿਕਸ (ਜਿਵੇਂ <code>GUPTA-2627-</code>) ਸੈੱਟ ਕਰ ਸਕਦਾ ਹੈ, ਅਤੇ FarmsKing ਉਸੇ ਸੀਰੀਜ਼ ਨੂੰ ਅੱਗੇ ਚਲਾਏਗਾ।</li>
  </ul>

  <h2>3. ਪਹਿਲੇ ਸਟੈੱਪ ਤੋਂ ਲੈ ਕੇ ਆਖਰੀ ਸਟੈੱਪ ਤੱਕ ਪੈਸਿਆਂ ਦਾ ਲੈਣ-ਦੇਣ (End-to-End Money Flow)</h2>
  <div class="step-card">
    <div class="step-title">ਸਟੈੱਪ 1: ਆਰਡਰ ਅਤੇ ਗਾਹਕ ਭੁਗਤਾਨ (Order Placement)</div>
    <p>ਗਾਹਕ ਐਪ 'ਤੇ ₹10,000 ਦਾ ਆਰਡਰ ਕਰਦਾ ਹੈ ਅਤੇ ਪੇਮੈਂਟ ਗੇਟਵੇ ਰਾਹੀਂ FarmsKing ਦੇ Escrow/Nodal ਬੈਂਕ ਖਾਤੇ 'ਚ ਪੈਸੇ ਜਮ੍ਹਾਂ ਹੁੰਦੇ ਹਨ।</p>
  </div>
  <div class="step-card">
    <div class="step-title">ਸਟੈੱਪ 2: ਡਿਲੀਵਰੀ ਅਤੇ ਬਿਲ ਜਨਰੇਸ਼ਨ (Delivery & Invoices)</div>
    <p>ਸਮਾਨ ਡਿਲੀਵਰ ਹੁੰਦੇ ਹੀ ਸਿਸਟਮ 3 ਇਨਵੌਇਸ (Customer Invoice, Commission Invoice, Payout Voucher) ਆਟੋਮੈਟਿਕ ਬਣਾਉਂਦਾ ਹੈ।</p>
  </div>
  <div class="step-card">
    <div class="step-title">ਸਟੈੱਪ 3: 7-ਦਿਨ ਰਿਟਰਨ ਹੋਲਡ ਪੀਰੀਅਡ (Return Lock)</div>
    <p>7 ਦਿਨਾਂ ਦੀ ਰਿਟਰਨ ਵਿੰਡੋ ਤੱਕ ਪੈਸੇ FarmsKing ਦੇ Escrow ਖਾਤੇ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦੇ ਹਨ।</p>
  </div>
  <div class="step-card">
    <div class="step-title">ਸਟੈੱਪ 4: ਪੈਸਿਆਂ ਦੀ ਵੰਡ ਅਤੇ ਪੇਆਉਟ (Automated Payout)</div>
    <p>FarmsKing ਆਪਣੀ ਕਮੀਸ਼ਨ (5%) + ਕਮੀਸ਼ਨ 'ਤੇ GST (18%) + TCS (1%) ਕੱਟ ਕੇ ਬਾਕੀ ਰਕਮ ਸੇਲਰ ਦੇ ਬੈਂਕ ਖਾਤੇ/ਵਾਲਿਟ 'ਚ ਆਟੋ-ਟ੍ਰਾਂਸਫਰ ਕਰਦਾ ਹੈ।</p>
  </div>
  <div class="step-card">
    <div class="step-title">ਸਟੈੱਪ 5: ਮਾਸਿਕ ਸਰਕਾਰੀ ਰਿਟਰਨਾਂ (Govt Returns)</div>
    <p>FarmsKing 10 ਤਾਰੀਖ ਤੱਕ GSTR-8 ਭਰ ਕੇ 1% TCS ਸਰਕਾਰ ਕੋਲ ਜਮ੍ਹਾਂ ਕਰਵਾਉਂਦਾ ਹੈ, ਅਤੇ 20 ਤਾਰੀਖ ਤੱਕ GSTR-3B ਰਾਹੀਂ ਕਮੀਸ਼ਨ 'ਤੇ ਇਕੱਠਾ ਹੋਇਆ 18% GST ਜਮ੍ਹਾਂ ਕਰਵਾਉਂਦਾ ਹੈ।</p>
  </div>
  <div class="step-card">
    <div class="step-title">ਸਟੈੱਪ 6: ਸੇਲਰ ਦਾ ਟੈਕਸ ਕਲੇਮ (Seller Accounting)</div>
    <p>ਸੇਲਰ ਆਪਣੀ GSTR-1 ਅਤੇ GSTR-3B ਭਰਦਾ ਹੈ। ਸੇਲਰ ਨੂੰ ₹100 TCS ਦਾ ਕੈਸ਼ ਕ੍ਰੈਡਿਟ ਅਤੇ FarmsKing ਕਮੀਸ਼ਨ ਦੇ ₹90 GST ਦਾ ITC ਕ੍ਰੈਡਿਟ ਮਿਲਦਾ ਹੈ।</p>
  </div>

  <h2>4. ਕੈਲਕੁਲੇਸ਼ਨ ਉਦਾਹਰਨਾਂ (Calculation Models)</h2>
  <h3>ਮਾਡਲ A: GST ਤੋਂ ਬਿਨਾਂ ਅਸਲ ਕੀਮਤ ₹10,000 (+ 5% GST = ₹10,500)</h3>
  <ul>
    <li><strong>ਗਾਹਕ ਨੇ ਦਿੱਤੇ:</strong> ₹10,500</li>
    <li><strong>ਅਸਲ ਕੀਮਤ (Base Price):</strong> ₹10,000 | <strong>GST (5%):</strong> ₹500</li>
    <li><strong>TCS (1% of Base):</strong> ₹100 | <strong>FarmsKing ਕਮੀਸ਼ਨ (5% of Base):</strong> ₹500</li>
    <li><strong>ਕਮੀਸ਼ਨ 'ਤੇ GST (18% of ₹500):</strong> ₹90</li>
    <li><strong>ਕੁੱਲ ਕਟੌਤੀ:</strong> ₹100 + ₹500 + ₹90 = ₹690</li>
    <li><strong>ਸੇਲਰ ਪੇਆਉਟ (Net Payout):</strong> ₹10,500 - ₹690 = <strong>₹9,810</strong></li>
  </ul>

  <h3>ਮਾਡਲ B: GST ਸਮੇਤ ਕੁੱਲ ਰੇਟ ₹10,000 (Inclusive of 5% GST)</h3>
  <ul>
    <li><strong>ਗਾਹਕ ਨੇ ਦਿੱਤੇ:</strong> ₹10,000</li>
    <li><strong>ਅਸਲ ਕੀਮਤ (Base Price = ₹10,000 / 1.05):</strong> ₹9,523.81</li>
    <li><strong>ਸਮਾਨ ਦਾ GST (5%):</strong> ₹476.19</li>
    <li><strong>TCS (1% of Base ₹9,523.81):</strong> ₹95.24</li>
    <li><strong>FarmsKing ਕਮੀਸ਼ਨ (5% of Base ₹9,523.81):</strong> ₹476.19</li>
    <li><strong>ਕਮੀਸ਼ਨ 'ਤੇ GST (18% of ₹476.19):</strong> ₹85.71</li>
    <li><strong>ਕੁੱਲ ਕਟੌਤੀ:</strong> ₹657.14</li>
    <li><strong>ਸੇਲਰ ਪੇਆਉਟ (Net Payout):</strong> ₹10,000 - ₹657.14 = <strong>₹9,342.86</strong></li>
  </ul>

  <h3>ਮਾਡਲ C: ਕਿਸਾਨਾਂ ਦੀ ਕੱਚੀ ਫ਼ਸਲ (Raw Produce - 0% GST Exempt)</h3>
  <ul>
    <li>ਕਣਕ, ਝੋਨਾ, ਹਰੀਆਂ ਸਬਜ਼ੀਆਂ GST ਤੋਂ 0% ਮੁਕਤ ਹਨ। ਅਣ-ਰਜਿਸਟਰਡ ਕਿਸਾਨਾਂ 'ਤੇ <strong>0% TCS</strong> ਲੱਗੇਗਾ। FarmsKing ਸਿਰਫ਼ ਆਪਣੀ ਕਮੀਸ਼ਨ + 18% GST ਚਾਰਜ ਕਰੇਗਾ।</li>
  </ul>

  <h2>5. ਹੋਰ ਜ਼ਰੂਰੀ ਗੱਲਾਂ (Key Takeaways)</h2>
  <div class="box">
    <ul>
      <li><strong>ਕਮੀਸ਼ਨ ਦਾ ਨਿਯਮ:</strong> FarmsKing ਆਪਣੀ ਕਮੀਸ਼ਨ <em>ਸਿਰਫ਼ ਅਸਲ ਕੀਮਤ (Base Price)</em> 'ਤੇ ਹੀ ਲਾਵੇਗਾ, ਸਰਕਾਰੀ GST ਵਾਲੀ ਰਕਮ 'ਤੇ ਨਹੀਂ।</li>
      <li><strong>TCS ਦਾ ਫਾਇਦਾ:</strong> FarmsKing ਵੱਲੋਂ ਕੱਟਿਆ 1% TCS ਸੇਲਰ ਦਾ ਨੁਕਸਾਨ ਨਹੀਂ ਹੈ, ਉਹ ਸੇਲਰ ਦੇ GST Cash Ledger ਵਿੱਚ ਜਮ੍ਹਾਂ ਹੁੰਦਾ ਹੈ।</li>
      <li><strong>ITC ਦਾ ਲਾਭ:</strong> FarmsKing ਦੀ ਕਮੀਸ਼ਨ ਉੱਤੇ ਲੱਗੇ 18% GST ਦਾ ਕਲੇਮ ਸੇਲਰ ਆਪਣੀ ਰਿਟਰਨ 'ਚ ਲੈ ਸਕਦਾ ਹੈ।</li>
      <li><strong>ਆਰਡਰ ਰਿਟਰਨ:</strong> ਆਰਡਰ ਰੱਦ/ਰਿਟਰਨ ਹੋਣ 'ਤੇ FarmsKing ਆਟੋਮੈਟਿਕ Credit Note (<code>FK-CDN-2627-000001</code>) ਜਾਰੀ ਕਰੇਗਾ।</li>
    </ul>
  </div>

  <div class="footer">
    FarmsKing Agriculture Ecosystem — Billing & GST Specifications Document | ਗੁਪਤ
  </div>
</body>
</html>
`;

// 3. HINDI HTML
const htmlHI = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing — GST एवं बिलिंग संरचना दस्तावेज</title>
  ${commonStyle}
</head>
<body>
  <h1>FarmsKing — संपूर्ण GST एवं बिलिंग सिस्टम संरचना</h1>
  <p><strong>दस्तावेज़ तिथि:</strong> 30 सितंबर 2026 | <strong>प्लेटफॉर्म:</strong> फार्मसकिंग एग्रीकल्चर मार्केटप्लेस</p>

  <div class="box">
    <strong>कानूनी स्थिति:</strong> FarmsKing GST कानून की <strong>Section 52</strong> के तहत <strong>Electronic Commerce Operator (ECO)</strong> के रूप में कार्य करता है।
  </div>

  <h2>1. बिल नंबर प्रणाली (GST Rule 46 के अनुसार)</h2>
  <p>GST नियमों के अनुसार बिल नंबर लगातार क्रमिक, अधिकतम 16 अक्षरों का, तथा प्रत्येक वित्तीय वर्ष (1 अप्रैल) को रीसेट होने वाला होना चाहिए।</p>
  <table>
    <thead>
      <tr>
        <th>बिल का प्रकार</th>
        <th>कोड फॉर्मेट</th>
        <th>उदाहरण</th>
        <th>विवरण</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Customer Sales Invoice (ग्राहक बिल)</td>
        <td>FK-INV-{FY}-{SeqNo}</td>
        <td>FK-INV-2627-000001</td>
        <td>ग्राहक को सेलर के GSTIN के साथ दिया जाने वाला बिल।</td>
      </tr>
      <tr>
        <td>Commission Tax Invoice (कमिशन बिल)</td>
        <td>FK-COM-{FY}-{SeqNo}</td>
        <td>FK-COM-2627-000001</td>
        <td>FarmsKing द्वारा सेलर के लिए (5% कमिशन + 18% GST)।</td>
      </tr>
      <tr>
        <td>Seller Payout Voucher (पेआउट बिल)</td>
        <td>FK-PAY-{FY}-{SeqNo}</td>
        <td>FK-PAY-2627-000001</td>
        <td>सेलर के खाते में राशि ट्रांसफर का हिसाब-किताब।</td>
      </tr>
    </tbody>
  </table>

  <h2>2. सेलर की अपनी बिल सीरीज (Invoice Series) का क्या होगा?</h2>
  <p>GST Rule 46 के तहत प्रत्येक व्यापारी को एक से अधिक बिल सीरीज (Multiple Invoice Series) रखने की अनुमति है:</p>
  <ul>
    <li><strong>विकल्प A (अनुशंसित / Automatic Series):</strong> सेलर दुकान की ऑफलाइन बिक्री के लिए अपनी सीरीज (जैसे <code>OFF-2627-0001</code>) चलाएगा और FarmsKing ऑनलाइन बिक्री के लिए अलग सीरीज (जैसे <code>FK-S101-2627-000001</code>) चलाएगा। इससे दुकान और ऑनलाइन बिल मिक्स नहीं होते।</li>
    <li><strong>विकल्प B (Custom Seller Prefix):</strong> सेलर FarmsKing Seller Dashboard में अपना प्रिफिक्स (जैसे <code>GUPTA-2627-</code>) सेट कर सकता है, और FarmsKing उसी सीरीज को आगे बढ़ाएगा।</li>
  </ul>

  <h2>3. पहले स्टेप से आखिरी स्टेप तक पैसों का लेनदेन (End-to-End Money Flow)</h2>
  <div class="step-card">
    <div class="step-title">स्टेप 1: ऑर्डर और ग्राहक भुगतान (Order Placement)</div>
    <p>ग्राहक ऐप पर ₹10,000 का ऑर्डर करता है और पेमेंट गेटवे के माध्यम से FarmsKing के Escrow/Nodal बैंक खाते में राशि जमा होती है।</p>
  </div>
  <div class="step-card">
    <div class="step-title">स्टेप 2: डिलीवरी और बिल जनरेशन (Delivery & Invoices)</div>
    <p>सामान डिलीवर होते ही सिस्टम 3 इनवॉइस (Customer Invoice, Commission Invoice, Payout Voucher) ऑटोमैटिक बनाता है।</p>
  </div>
  <div class="step-card">
    <div class="step-title">स्टेप 3: 7-दिवसीय रिटर्न होल्ड अवधि (Return Lock)</div>
    <p>7 दिनों की रिटर्न विंडो तक राशि FarmsKing के Escrow खाते में सुरक्षित रहती है।</p>
  </div>
  <div class="step-card">
    <div class="step-title">स्टेप 4: राशि का वितरण और पेआउट (Automated Payout)</div>
    <p>FarmsKing अपना कमिशन (5%) + कमिशन पर GST (18%) + TCS (1%) काटकर शेष राशि सेलर के बैंक खाते/वॉलेट में ऑटो-ट्रांसफर करता है।</p>
  </div>
  <div class="step-card">
    <div class="step-title">स्टेप 5: मासिक सरकारी रिटर्न (Govt Returns)</div>
    <p>FarmsKing 10 तारीख तक GSTR-8 भरकर 1% TCS सरकार के पास जमा कराता है, और 20 तारीख तक GSTR-3B के जरिए कमिशन पर एकत्रित 18% GST जमा कराता है।</p>
  </div>
  <div class="step-card">
    <div class="step-title">स्टेप 6: सेलर का टैक्स क्लेम (Seller Accounting)</div>
    <p>सेलर अपनी GSTR-1 और GSTR-3B भरता है। सेलर को ₹100 TCS का कैश क्रेडिट तथा FarmsKing कमिशन के ₹90 GST का ITC क्रेडिट प्राप्त होता है।</p>
  </div>

  <h2>4. गणना उदाहरण (Calculation Models)</h2>
  <h3>मॉडल A: GST के बिना मूल मूल्य ₹10,000 (+ 5% GST = ₹10,500)</h3>
  <ul>
    <li><strong>ग्राहक ने भुगतान किया:</strong> ₹10,500</li>
    <li><strong>मूल मूल्य (Base Price):</strong> ₹10,000 | <strong>GST (5%):</strong> ₹500</li>
    <li><strong>TCS (1% of Base):</strong> ₹100 | <strong>FarmsKing कमिशन (5% of Base):</strong> ₹500</li>
    <li><strong>कमिशन पर GST (18% of ₹500):</strong> ₹90</li>
    <li><strong>कुल कटौती:</strong> ₹100 + ₹500 + ₹90 = ₹690</li>
    <li><strong>सेलर पेआउट (Net Payout):</strong> ₹10,500 - ₹690 = <strong>₹9,810</strong></li>
  </ul>

  <h3>मॉडल B: GST सहित कुल दर ₹10,000 (Inclusive of 5% GST)</h3>
  <ul>
    <li><strong>ग्राहक ने भुगतान किया:</strong> ₹10,000</li>
    <li><strong>मूल मूल्य (Base Price = ₹10,000 / 1.05):</strong> ₹9,523.81</li>
    <li><strong>सामान का GST (5%):</strong> ₹476.19</li>
    <li><strong>TCS (1% of Base ₹9,523.81):</strong> ₹95.24</li>
    <li><strong>FarmsKing कमिशन (5% of Base ₹9,523.81):</strong> ₹476.19</li>
    <li><strong>कमिशन पर GST (18% of ₹476.19):</strong> ₹85.71</li>
    <li><strong>कुल कटौती:</strong> ₹657.14</li>
    <li><strong>सेलर पेआउट (Net Payout):</strong> ₹10,000 - ₹657.14 = <strong>₹9,342.86</strong></li>
  </ul>

  <h3>मॉडल C: किसानों की कच्ची फसल (Raw Produce - 0% GST Exempt)</h3>
  <ul>
    <li>गेहूँ, धान, ताज़ी सब्जियाँ GST से 0% मुक्त हैं। अनरजिस्टर्ड किसानों पर <strong>0% TCS</strong> लागू होगा। FarmsKing केवल अपना कमिशन + 18% GST चार्ज करेगा।</li>
  </ul>

  <h2>5. अन्य महत्वपूर्ण बिंदु (Key Takeaways)</h2>
  <div class="box">
    <ul>
      <li><strong>कमिशन नियम:</strong> FarmsKing अपना कमिशन <em>केवल मूल मूल्य (Base Price)</em> पर ही लगाएगा, सरकारी GST राशि पर नहीं।</li>
      <li><strong>TCS लाभ:</strong> FarmsKing द्वारा काटा गया 1% TCS सेलर का नुकसान नहीं है, वह सेलर के GST Cash Ledger में जमा होता है।</li>
      <li><strong>ITC लाभ:</strong> FarmsKing की कमिशन पर लगे 18% GST का क्लेम सेलर अपनी रिटर्न में ले सकता है।</li>
      <li><strong>ऑर्डर रिटर्न:</strong> ऑर्डर रद्द/रिटर्न होने पर FarmsKing ऑटोमैटिक Credit Note (<code>FK-CDN-2627-000001</code>) जारी करेगा।</li>
    </ul>
  </div>

  <div class="footer">
    FarmsKing Agriculture Ecosystem — Billing & GST Specifications Document | गोपनीय
  </div>
</body>
</html>
`;

// Save HTML files
fs.writeFileSync(path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_EN.html'), htmlEN, 'utf8');
fs.writeFileSync(path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_PB.html'), htmlPB, 'utf8');
fs.writeFileSync(path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_HI.html'), htmlHI, 'utf8');

console.log('HTML files created successfully.');

// Convert HTML to PDF via Edge Headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const convertToPdf = (htmlFile, pdfFile) => {
  const fullHtml = path.resolve(htmlFile);
  const fullPdf = path.resolve(pdfFile);
  const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${fullPdf}" "file:///${fullHtml.replace(/\\/g, '/')}"`;
  console.log(`Converting ${path.basename(htmlFile)} to PDF...`);
  execSync(cmd);
};

convertToPdf(path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_EN.html'), path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_EN.pdf'));
convertToPdf(path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_PB.html'), path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_PB.pdf'));
convertToPdf(path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_HI.html'), path.join(billingsDir, 'FarmsKing_GST_Billing_Structure_HI.pdf'));

console.log('All 3 PDFs generated successfully in d:\\FarmsKing\\billings\\');
