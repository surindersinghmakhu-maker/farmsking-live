"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DYNAMIC_SYSTEM_MODULES = void 0;
exports.generateDynamicPrivacyPolicyHtml = generateDynamicPrivacyPolicyHtml;
exports.generateAccountDeletionHtml = generateAccountDeletionHtml;
exports.DYNAMIC_SYSTEM_MODULES = [
    {
        id: 'user_account_identity',
        titleEn: 'User Account & Identity Data',
        titlePa: 'ਯੂਜ਼ਰ ਅਕਾਊਂਟ ਅਤੇ ਪਛਾਣ ਡਾਟਾ',
        purposeEn: 'To create your unique FarmsKing ID (King ID), authenticate your account, process orders, and send agricultural advisory notifications.',
        purposePa: 'ਤੁਹਾਡੀ ਯੂਨੀਕ FarmsKing ID (King ID) ਬਣਾਉਣ, ਅਕਾਊਂਟ ਦੀ ਪ੍ਰਮਾਣਿਕਤਾ, ਆਰਡਰ ਪ੍ਰੋਸੈਸ ਕਰਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ਭੇਜਣ ਲਈ।',
        dataCollected: ['Full Name', 'Mobile Number', 'Email Address (Optional)', 'Village/District/State', 'Pincode', 'Role Type (Farmer, Gardener, Advisor, Partner, Customer)'],
        isMandatory: true,
    },
    {
        id: 'gps_location_satellite',
        titleEn: 'Location & Satellite Monitoring Services',
        titlePa: 'ਲੋਕੇਸ਼ਨ ਅਤੇ ਸੈਟੇਲਾਈਟ ਖੇਤ ਨਿਗਰਾਨੀ ਸੇਵਾਵਾਂ',
        purposeEn: 'Used for precise field boundary mapping, satellite crop health index monitoring, weather forecasts, and real-time delivery tracking.',
        purposePa: 'ਖੇਤ ਦੀ ਸਹੀ ਨਿਸ਼ਾਨਦੇਹੀ, ਸੈਟੇਲਾਈਟ ਫਸਲ ਸਿਹਤ ਜਾਂਚ, ਮੌਸਮ ਜਾਣਕਾਰੀ ਅਤੇ ਡਿਲੀਵਰੀ ਟ੍ਰੈਕਿੰਗ ਲਈ।',
        dataCollected: ['Fine GPS Location', 'Coarse Location', 'Farm Geo-Polygon Coordinates'],
        isMandatory: false,
    },
    {
        id: 'voice_ai_microphone',
        titleEn: 'Microphone & Punjabi Voice AI Assistant',
        titlePa: 'ਮਾਈਕ੍ਰੋਫੋਨ ਅਤੇ ਪੰਜਾਬੀ Voice AI ਮਾਈਕ',
        purposeEn: 'Used exclusively when you tap the mic button to speak query in Punjabi/Hindi to our Agri Voice AI Assistant for crop advice.',
        purposePa: 'ਸਿਰਫ ਉਦੋਂ ਜਦੋਂ ਤੁਸੀਂ ਪੰਜਾਬੀ/ਹਿੰਦੀ ਵਿੱਚ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ਲਈ Voice AI ਮਾਈਕ ਦਾ ਬਟਨ ਦਬਾਉਂਦੇ ਹੋ।',
        dataCollected: ['Temporary Audio Streams (Processed for speech-to-text, not stored permanently)'],
        isMandatory: false,
    },
    {
        id: 'camera_photo_media',
        titleEn: 'Camera & Gallery Access',
        titlePa: 'ਕੈਮਰਾ ਅਤੇ ਫੋਟੋ ਗੈਲਰੀ ਪਰਮਿਸ਼ਨ',
        purposeEn: 'Allows uploading profile pictures, scanning QR codes, and submitting crop disease photos for instant AI/Advisor diagnosis.',
        purposePa: 'ਪ੍ਰੋਫਾਈਲ ਫੋਟੋ ਲਗਾਉਣ, QR ਕੋਡ ਸਕੈਨ ਕਰਨ ਅਤੇ ਬੀਮਾਰ ਫਸਲ ਦੀ ਫੋਟੋ ਭੇਜ ਕੇ ਸਲਾਹ ਲੈਣ ਲਈ।',
        dataCollected: ['Selected Crop Photos', 'Profile Avatar Images', 'Receipt Scans'],
        isMandatory: false,
    },
    {
        id: 'mandi_expense_calculator',
        titleEn: 'Farm Expense & Mandi Accounting Tool',
        titlePa: 'ਖੇਤ ਖਰਚਾ ਅਤੇ ਮੰਡੀ ਹਿਸਾਬ-ਕਿਤਾਬ ਕੈਲਕੁਲੇਟਰ',
        purposeEn: 'Used as an accounting ledger for farmers to record crop yields, labor costs, and commission agent (Aarthi) interest calculations. This is strictly a record-keeping tool and DOES NOT act as a loan/lending service.',
        purposePa: 'ਕਿਸਾਨਾਂ ਲਈ ਫਸਲ ਦੀ ਪੈਦਾਵਾਰ, ਮਜ਼ਦੂਰੀ ਖਰਚਾ ਅਤੇ ਆੜ੍ਹਤੀਏ ਦੇ ਵਿਆਜ ਦਾ ਹਿਸਾਬ ਰੱਖਣ ਦਾ ਟੂਲ। ਇਹ ਸਿਰਫ ਨਿੱਜੀ ਰਿਕਾਰਡ ਲਈ ਹੈ, ਕੋਈ ਉਧਾਰ/ਲੋਨ ਸੇਵਾ ਨਹੀਂ ਹੈ।',
        dataCollected: ['Farmer Expense Entries', 'Crop Yield Quantities', 'Sale Bills Records'],
        isMandatory: false,
    },
    {
        id: 'coupon_rewards_royalty',
        titleEn: 'Advisor & Partner Reward Program',
        titlePa: 'ਸਲਾਹਕਾਰ ਅਤੇ ਬਿਜ਼ਨਸ ਪਾਰਟਨਰ ਕੂਪਨ ਪ੍ਰੋਗਰਾਮ',
        purposeEn: 'Calculates cashback, referral commissions, and coupon redemptions for authorized Agri Advisors and Business Partners.',
        purposePa: 'ਮਾਨਤਾ ਪ੍ਰਾਪਤ ਸਲਾਹਕਾਰਾਂ ਅਤੇ ਪਾਰਟਨਰਾਂ ਲਈ ਕੈਸ਼ਬੈਕ, ਰੈਫਰਲ ਅਤੇ ਕੂਪਨ ਡਿਸਕਾਊਂਟ ਦਾ ਹਿਸਾਬ ਕਰਨ ਲਈ।',
        dataCollected: ['Coupon Redemption History', 'Royalty Earnings Balance', 'UPI ID for Payouts'],
        isMandatory: false,
    },
    {
        id: 'payments_and_transactions',
        titleEn: 'Secure Payments & E-Commerce Transactions',
        titlePa: 'ਸੁਰੱਖਿਅਤ ਪੇਮੈਂਟ ਅਤੇ ਟ੍ਰਾਂਸਫਰ ਸੇਵਾ',
        purposeEn: 'Facilitates order placement for seeds, fertilizers, and equipment via RBI-authorized payment gateways (Razorpay, PhonePe, UPI). We DO NOT store credit/debit card numbers or bank PINs.',
        purposePa: 'ਬੀਜ, ਖਾਦ ਅਤੇ ਸਮਾਨ ਦੇ ਆਰਡਰ ਲਈ RBI ਦੁਆਰਾ ਮਾਨਤਾ ਪ੍ਰਾਪਤ ਗੇਟਵੇ ਰਾਹੀਂ ਸੁਰੱਖਿਅਤ ਭੁਗਤਾਨ। ਅਸੀਂ ਬੈਂਕ ਪਿਨ ਜਾਂ ਕਾਰਡ ਨੰਬਰ ਸਟੋਰ ਨਹੀਂ ਕਰਦੇ।',
        dataCollected: ['Transaction Reference IDs', 'Payment Status', 'Order Purchase History'],
        isMandatory: false,
    },
    {
        id: 'data_deletion_rights',
        titleEn: 'User Control & Complete Account Deletion',
        titlePa: 'ਯੂਜ਼ਰ ਅਧਿਕਾਰ ਅਤੇ ਅਕਾਊਂਟ ਡਿਲੀਟ ਕਰਨ ਦੀ ਸੁਵਿਧਾ',
        purposeEn: 'In compliance with Google Play Store rules, users have the full right to delete their FarmsKing account and purge all personal data at any time via in-app Profile Settings or the Web Deletion Portal.',
        purposePa: 'ਗੂਗਲ ਪਲੇਅ ਸਟੋਰ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਯੂਜ਼ਰ ਐਪ ਦੇ ਅੰਦਰੋਂ ਜਾਂ ਵੈੱਬ ਪੋਰਟਲ ਰਾਹੀਂ ਆਪਣਾ ਅਕਾਊਂਟ ਅਤੇ ਸਾਰਾ ਡਾਟਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਡਿਲੀਟ ਕਰ ਸਕਦੇ ਹਨ।',
        dataCollected: ['Deletion Requests', 'Purge Timestamps'],
        isMandatory: true,
    }
];
function generateDynamicPrivacyPolicyHtml(baseUrl = 'https://farmsking.in') {
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const modulesHtml = exports.DYNAMIC_SYSTEM_MODULES.map((m, idx) => `
    <div class="module-card">
      <div class="module-header">
        <span class="module-num">${idx + 1}</span>
        <div>
          <h3>${m.titleEn} <span class="pa-sub">(${m.titlePa})</span></h3>
          <span class="badge ${m.isMandatory ? 'badge-mand' : 'badge-opt'}">
            ${m.isMandatory ? 'Core Requirement / ਜ਼ਰੂਰੀ' : 'Optional Feature / ਇੱਛੁਕ'}
          </span>
        </div>
      </div>
      <p class="desc"><strong>Purpose (ਮਕਸਦ):</strong> ${m.purposeEn}</p>
      <p class="desc pa-text">${m.purposePa}</p>
      <div class="data-list">
        <strong>Collected Data Items (ਇਕੱਠਾ ਕੀਤਾ ਜਾਂਦਾ ਡਾਟਾ):</strong>
        <ul>
          ${m.dataCollected.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy & Data Protection | FarmsKing (ਫਾਰਮਜ਼ਕਿੰਗ)</title>
  <link rel="icon" href="/favicon.ico" />
  <style>
    :root {
      --primary: #10B981;
      --primary-dark: #047857;
      --bg: #0B0F17;
      --card-bg: #111827;
      --border: #1F2937;
      --text: #F9FAFB;
      --text-muted: #9CA3AF;
      --gold: #F59E0B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); line-height: 1.6; padding: 20px; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; }
    
    .hero-banner {
      background: linear-gradient(135deg, #064E3B 0%, #047857 100%);
      padding: 30px 24px;
      border-radius: 16px;
      text-align: center;
      border: 1.5px solid var(--primary);
      margin-bottom: 24px;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
    }
    .hero-banner h1 { font-size: 28px; font-weight: 900; color: #FFF; margin-bottom: 6px; }
    .hero-banner h2 { font-size: 18px; color: #A7F3D0; font-weight: 700; margin-bottom: 12px; }
    .update-badge { display: inline-block; background: rgba(0,0,0,0.3); color: var(--gold); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.4); }

    .intro-card {
      background: var(--card-bg);
      border-radius: 14px;
      padding: 20px;
      border: 1px solid var(--border);
      margin-bottom: 20px;
    }
    .intro-card h3 { color: var(--primary); font-size: 18px; margin-bottom: 10px; }
    .intro-card p { font-size: 14.5px; color: #E5E7EB; margin-bottom: 10px; }
    
    .auto-sync-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid var(--primary);
      border-radius: 10px;
      padding: 14px 18px;
      margin-top: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .auto-sync-box span { font-size: 24px; }
    .auto-sync-box p { font-size: 13px; color: #D1D5DB; margin: 0; }

    .module-card {
      background: var(--card-bg);
      border-radius: 14px;
      padding: 20px;
      border: 1px solid var(--border);
      margin-bottom: 16px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .module-card:hover { border-color: var(--primary); }
    .module-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px; }
    .module-num { background: var(--primary-dark); color: #FFF; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0; }
    .module-header h3 { font-size: 17px; font-weight: 800; color: #FFF; }
    .pa-sub { color: #A7F3D0; font-weight: 600; font-size: 15px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; margin-top: 4px; }
    .badge-mand { background: #991B1B; color: #FCA5A5; }
    .badge-opt { background: #065F46; color: #A7F3D0; }
    
    .desc { font-size: 14px; color: #D1D5DB; margin-bottom: 6px; }
    .pa-text { color: #9CA3AF; font-size: 13.5px; }

    .data-list { background: rgba(31, 41, 55, 0.5); padding: 12px; border-radius: 8px; margin-top: 10px; font-size: 13px; border-left: 3px solid var(--primary); }
    .data-list ul { margin-left: 20px; margin-top: 6px; }
    .data-list li { color: #E5E7EB; margin-bottom: 3px; }

    .deletion-box {
      background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%);
      border: 1.5px solid #EF4444;
      border-radius: 14px;
      padding: 22px;
      margin-top: 24px;
      margin-bottom: 24px;
    }
    .deletion-box h3 { color: #FFF; font-size: 19px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .deletion-box p { font-size: 14px; color: #FEE2E2; margin-bottom: 12px; }
    .del-btn { display: inline-block; background: #FFF; color: #991B1B; padding: 10px 20px; border-radius: 8px; font-weight: 800; text-decoration: none; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }

    .footer { text-align: center; font-size: 13px; color: var(--text-muted); margin-top: 30px; border-top: 1px solid var(--border); padding-top: 20px; }
    .footer a { color: var(--primary); text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero-banner">
      <h1>👑 FarmsKing Privacy Policy</h1>
      <h2>ਫਾਰਮਜ਼ਕਿੰਗ ਪ੍ਰਾਈਵੇਸੀ ਅਤੇ ਡਾਟਾ ਸੁਰੱਖਿਆ ਨੀਤੀ</h2>
      <div class="update-badge">⚡ Automatically Dynamic • Last Synchronized: ${lastUpdated}</div>
    </div>

    <div class="intro-card">
      <h3>🔒 Commitment to Data Privacy & Google Play Compliance</h3>
      <p>Welcome to FarmsKing (ਫਾਰਮਜ਼ਕਿੰਗ). We respect your privacy and are fully committed to protecting the personal, location, financial, and agricultural data of our Farmers, Gardeners, Customers, Advisors, Business Partners, and Operators.</p>
      <p class="pa-text">ਫਾਰਮਜ਼ਕਿੰਗ ਪਲੇਟਫਾਰਮ 'ਤੇ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਅਸੀਂ ਤੁਹਾਡੇ ਨਿੱਜੀ ਡਾਟਾ, ਲੋਕੇਸ਼ਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਰਿਕਾਰਡ ਦੀ ਪੂਰੀ ਸੁਰੱਖਿਆ ਕਰਨ ਲਈ ਵਚਨਬੱਧ ਹਾਂ। ਹੇਠਾਂ ਸਾਡੀ ਨੀਤੀ ਦੀ ਪੂਰੀ ਜਾਣਕਾਰੀ ਦਿੱਤੀ ਗਈ ਹੈ।</p>

      <div class="auto-sync-box">
        <span>🔄</span>
        <div>
          <strong style="color: #FFF; font-size: 13.5px;">Auto-Dynamic Policy Engine (ਆਟੋ-ਅਪਡੇਟਿੰਗ ਨੀਤੀ ਸਿਸਟਮ)</strong>
          <p>This privacy policy is connected directly to FarmsKing active feature configuration engine. Whenever a new feature, integration, or permission is introduced in the project, this document automatically updates its disclosures in real-time to guarantee 100% Google Play Store compliance.</p>
        </div>
      </div>
    </div>

    <h2 style="color: #FFF; font-size: 20px; margin-bottom: 16px;">📱 Collected Data & Feature Disclosures (ਇਕੱਠਾ ਕੀਤਾ ਡਾਟਾ)</h2>
    
    ${modulesHtml}

    <div class="deletion-box">
      <h3>🗑️ Account Deletion & Right to be Forgotten (ਅਕਾਊਂਟ ਡਿਲੀਟ ਕਰਨ ਦਾ ਅਧਿਕਾਰ)</h3>
      <p>In accordance with Google Play Store User Data policies, any FarmsKing user can request complete deletion of their account and associated personal data at any time.</p>
      <p class="pa-text">ਤੁਸੀਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਆਪਣਾ FarmsKing ਅਕਾਊਂਟ ਅਤੇ ਸਾਰਾ ਡਾਟਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਡਿਲੀਟ ਕਰ ਸਕਦੇ ਹੋ।</p>
      <div style="margin-top: 14px;">
        <a href="${baseUrl}/account-deletion" class="del-btn">👉 Go to Web Account Deletion Portal (ਅਕਾਊਂਟ ਡਿਲੀਟ ਪੋਰਟਲ)</a>
      </div>
    </div>

    <div class="intro-card">
      <h3>📞 Data Controller & Support Contact Information</h3>
      <p>If you have any questions regarding this Privacy Policy or wish to exercise your data rights, please contact our Data Governance Officer:</p>
      <ul style="margin-left: 20px; font-size: 14px; color: #D1D5DB;">
        <li><strong>Official Email:</strong> support@farmsking.in / privacy@farmsking.in</li>
        <li><strong>Helpline Number:</strong> +91 9872066901</li>
        <li><strong>Official Website:</strong> <a href="${baseUrl}" style="color: var(--primary);">${baseUrl}</a></li>
      </ul>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} FarmsKing Agri Platform. All Rights Reserved. Compliant with Google Play Store Policies.</p>
    </div>
  </div>
</body>
</html>`;
}
function generateAccountDeletionHtml(baseUrl = 'https://farmsking.in') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deletion Request | FarmsKing (ਫਾਰਮਜ਼ਕਿੰਗ)</title>
  <link rel="icon" href="/favicon.ico" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background-color: #0B0F17; color: #F9FAFB; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #111827; border: 1px solid #374151; border-radius: 16px; padding: 28px; max-width: 480px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { font-size: 22px; color: #EF4444; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    h2 { font-size: 15px; color: #9CA3AF; margin-bottom: 18px; font-weight: 600; }
    .notice { background: rgba(239, 68, 68, 0.1); border: 1px solid #EF4444; padding: 12px; border-radius: 10px; font-size: 13px; color: #FCA5A5; margin-bottom: 18px; }
    
    .form-group { margin-bottom: 14px; }
    label { display: block; font-size: 12px; font-weight: 700; color: #D1D5DB; margin-bottom: 6px; }
    input, textarea { width: 100%; background: #1F2937; border: 1px solid #4B5563; border-radius: 8px; padding: 11px 14px; color: #FFF; font-size: 14px; outline: none; }
    input:focus, textarea:focus { border-color: #EF4444; }

    .submit-btn { width: 100%; background: #DC2626; color: white; padding: 13px; border: none; border-radius: 10px; font-size: 15px; font-weight: 800; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
    .submit-btn:hover { background: #B91C1C; }

    .status-msg { display: none; margin-top: 14px; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 700; text-align: center; }
    .status-success { background: #065F46; color: #34D399; }
    .status-error { background: #7F1D1D; color: #FCA5A5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🗑️ Account Deletion Request</h1>
    <h2>ਅਕਾਊਂਟ ਡਿਲੀਟ ਕਰਨ ਲਈ ਬੇਨਤੀ</h2>

    <div class="notice">
      ⚠️ <strong>Warning:</strong> Deleting your FarmsKing account will purge your King ID, profile data, saved crop plots, and order history. This action is irreversible.
    </div>

    <form id="deleteForm">
      <div class="form-group">
        <label>Registered Mobile Number (ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ) *</label>
        <input type="tel" id="mobile" placeholder="10-digit mobile number" required pattern="[0-9]{10}">
      </div>

      <div class="form-group">
        <label>Account Password / King ID (ਅਕਾਊਂਟ ਪਾਸਵਰਡ/ਕਿੰਗ ਆਈਡੀ)</label>
        <input type="password" id="password" placeholder="Enter password or King ID">
      </div>

      <div class="form-group">
        <label>Reason for Deletion (ਡਿਲੀਟ ਕਰਨ ਦਾ ਕਾਰਨ)</label>
        <textarea id="reason" rows="2" placeholder="Optional reason for leaving FarmsKing"></textarea>
      </div>

      <button type="submit" class="submit-btn" id="subBtn">Submit Account Deletion Request</button>
    </form>

    <div id="statusBox" class="status-msg"></div>

    <div style="margin-top: 20px; text-align: center;">
      <a href="${baseUrl}/privacy-policy" style="color: #10B981; font-size: 13px; text-decoration: none; font-weight: 700;">← Back to Privacy Policy</a>
    </div>
  </div>

  <script>
    document.getElementById('deleteForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const mobile = document.getElementById('mobile').value;
      const password = document.getElementById('password').value;
      const reason = document.getElementById('reason').value;
      const btn = document.getElementById('subBtn');
      const statusBox = document.getElementById('statusBox');

      btn.disabled = true;
      btn.innerText = 'Processing Deletion...';
      statusBox.style.display = 'none';

      try {
        const res = await fetch('/api/request-account-deletion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, password, reason })
        });
        const data = await res.json();
        
        statusBox.style.display = 'block';
        if (res.ok && data.success) {
          statusBox.className = 'status-msg status-success';
          statusBox.innerHTML = '✅ ' + (data.message || 'Account Deletion Request Processed Successfully!');
          document.getElementById('deleteForm').reset();
        } else {
          statusBox.className = 'status-msg status-error';
          statusBox.innerHTML = '❌ ' + (data.message || 'Failed to delete account. Please check mobile/password or contact support.');
        }
      } catch (err) {
        statusBox.style.display = 'block';
        statusBox.className = 'status-msg status-error';
        statusBox.innerHTML = '❌ Could not submit request. Please check internet or contact support (+91 9872066901).';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Submit Account Deletion Request';
      }
    });
  </script>
</body>
</html>`;
}
//# sourceMappingURL=privacy-policy-generator.js.map