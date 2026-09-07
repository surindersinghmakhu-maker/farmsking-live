import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="pa">
<head>
  <meta charset="UTF-8">
  <title>FarmsKing Farmer Guide - ਖੇਤੀਬਾੜੀ ਅਤੇ ਕਿਸਾਨ ਗਾਈਡ</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Noto Sans Gurmukhi', 'Nirmala UI', 'Raavi', 'Inter', sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.5;
      font-size: 13px;
    }

    .header-banner {
      background: linear-gradient(135deg, #15803d 0%, #166534 50%, #064e3b 100%);
      color: #ffffff;
      padding: 22px 26px;
      border-radius: 14px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(21, 128, 61, 0.25);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-text h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.3px;
      margin-bottom: 4px;
      color: #ffffff;
    }

    .header-text p {
      font-size: 13px;
      font-weight: 500;
      color: #dcfce7;
    }

    .header-badge {
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.35);
      padding: 8px 14px;
      border-radius: 30px;
      text-align: right;
    }

    .header-badge span {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #fef08a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-badge strong {
      font-size: 13px;
      color: #ffffff;
    }

    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: #166534;
      border-bottom: 2.5px solid #22c55e;
      padding-bottom: 6px;
      margin-top: 22px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    .service-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      border-left: 4px solid #16a34a;
    }

    .service-card.highlight {
      background: #f0fdf4;
      border-color: #bbf7d0;
      border-left-color: #15803d;
    }

    .service-card h3 {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .service-card p {
      font-size: 12px;
      color: #475569;
      line-height: 1.45;
    }

    .steps-container {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }

    .step-item {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: flex-start;
    }

    .step-item:last-child {
      margin-bottom: 0;
    }

    .step-num {
      background: #166534;
      color: #ffffff;
      font-size: 12px;
      font-weight: 800;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-content h4 {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }

    .step-content p {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }

    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 16px;
      border-radius: 10px;
      overflow: hidden;
      border: 1.5px solid #cbd5e1;
    }

    .table-container th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      padding: 10px 10px;
      text-align: center;
    }

    .table-container th.left-align {
      text-align: left;
      padding-left: 14px;
    }

    .table-container td {
      padding: 9px 10px;
      font-size: 11.5px;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
      color: #334155;
    }

    .table-container tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .table-container td.plan-name {
      font-weight: 700;
      text-align: left;
      padding-left: 14px;
      color: #0f172a;
    }

    .badge-check {
      color: #16a34a;
      font-weight: 800;
    }

    .badge-dash {
      color: #94a3b8;
    }

    .footer-box {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 12px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-box h4 {
      font-size: 14px;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 4px;
    }

    .footer-box p {
      font-size: 12px;
      color: #cbd5e1;
    }

    .upi-badge {
      background: #16a34a;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- HEADER BANNER -->
  <div class="header-banner">
    <div style="display: flex; align-items: center; gap: 16px;">
      <img src="file:///d:/FarmsKing/frontend/assets/images/farmsking_logo_hd.png" style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #fef08a; background: #ffffff;" />
      <div class="header-text">
        <h1>👑 FarmsKing ਕਿਸਾਨ ਗਾਈਡ (Farmer Guide)</h1>
        <p>ਡਿਜੀਟਲ ਸਮਾਰਟ ਖੇਤੀਬਾੜੀ ਪਲੇਟਫਾਰਮ — ਸਰਵਿਸਾਂ, ਸੁਵਿਧਾਵਾਂ ਅਤੇ ਪਲਾਨਾਂ ਦੀ ਪੂਰੀ ਮੁਕੰਮਲ ਜਾਣਕਾਰੀ</p>
      </div>
    </div>
    <div class="header-badge">
      <span>Official Manual</span>
      <strong>2026 Edition</strong>
    </div>
  </div>

  <!-- SECTION 1: SERVICES -->
  <div class="section-title">
    <span>1. FarmsKing ਦੁਆਰਾ ਕਿਸਾਨਾਂ ਲਈ ਉਪਲਬਧ ਮੁੱਖ ਸਰਵਿਸਾਂ (Provided Services)</span>
  </div>

  <div class="grid-2">
    <div class="service-card highlight">
      <h3>🌾 1. ਮੇਰੀਆਂ ਐਕਟਿਵ ਫਸਲਾਂ (My Active Crops)</h3>
      <p>ਤੁਹਾਡੀ ਹਰੇਕ ਫਸਲ ਦਾ ਪੂਰਾ ਲਾਈਵ ਚੱਕਰ (ਬੀਜਣ ਤੋਂ ਕਟਾਈ ਤੱਕ), ਛਿੜਕਾਅ ਲਿਸਟ (Spray Schedules), ਕੀਟਨਾਸ਼ਕਾਂ/ਖਾਦਾਂ ਦਾ ਰਿਕਾਰਡ ਅਤੇ ਕੰਮਾਂ ਦੀਆਂ ਤਰੀਕਾਂ ਯਾਦ ਦਿਵਾਉਣ ਵਾਲੇ ਅਲਰਟ।</p>
    </div>

    <div class="service-card highlight">
      <h3>📊 2. ਹਿਸਾਬ-ਕਿਤਾਬ ਅਤੇ ਖਰਚੇ (Bookkeeping Logs)</h3>
      <p>ਵੇਚੀਆਂ ਫਸਲਾਂ ਦੇ ਬਿੱਲ (Sale Bills), ਪ੍ਰਾਪਤ ਰਸੀਦਾਂ (Payment Receipts), ਖਾਦ/ਡੀਜ਼ਲ ਦੇ ਖਰਚੇ ਅਤੇ ਖੇਤ ਦੇ ਕੁੱਲ ਮੁਨਾਫੇ ਦਾ 100% ਸਹੀ ਡਿਜੀਟਲ ਹਿਸਾਬ-ਕਿਤਾਬ।</p>
    </div>

    <div class="service-card highlight">
      <h3>👷 3. ਮਜ਼ਦੂਰੀ ਅਤੇ ਦਿਹਾੜੀ ਰਿਕਾਰਡ (Labour Record)</h3>
      <p>ਖੇਤ ਵਿੱਚ ਕੰਮ ਕਰਦੇ ਮਜ਼ਦੂਰਾਂ ਦੀ ਹਾਜ਼ਰੀ, ਦਿਹਾੜੀ, ਐਡਵਾਂਸ ਪੈਸਿਆਂ ਦਾ ਹਿਸਾਬ ਅਤੇ ਵਰਕਰ ਲੋਗਇਨ (Worker Login) ਸੁਵਿਧਾ।</p>
    </div>

    <div class="service-card highlight">
      <h3>📈 4. ਲਾਈਵ ਮੰਡੀ ਭਾਅ ਅਤੇ ਮੰਡੀ AI (Mandi Rates & AI)</h3>
      <p>ਪੰਜਾਬ ਅਤੇ ਗੁਆਂਢੀ ਮੰਡੀਆਂ ਦੇ ਲਾਈਵ ਫਸਲ ਭਾਅ, ਮੰਡੀ ਏ.ਆਈ. (Mandi AI Price Prediction) ਅਤੇ ਪ੍ਰਾਈਸ ਲਾਕ (Price Lock) ਫੀਚਰ।</p>
    </div>

    <div class="service-card highlight">
      <h3>🌤️ 5. ਲਾਈਵ ਮੌਸਮ ਜਾਣਕਾਰੀ (Weather Forecasts & Alerts)</h3>
      <p>ਤਾਜ਼ਾ ਮੌਸਮ, ਬਾਰਿਸ਼ ਦੇ ਅਨੁਮਾਨ, ਤਾਪਮਾਨ, ਹਵਾ ਦੀ ਰਫਤਾਰ ਅਤੇ ਖੇਤੀ ਮਾਹਿਰਾਂ ਵੱਲੋਂ ਮੌਸਮੀ ਚੇਤਾਵਨੀਆਂ।</p>
    </div>

    <div class="service-card highlight">
      <h3>👨‍🌾 6. ਨਿੱਜੀ ਖੇਤੀ ਮਾਹਿਰ (Dedicated Farm Advisor)</h3>
      <p>ਤੁਹਾਡੀ ਫਸਲ ਲਈ ਵਿਸ਼ੇਸ਼ ਤਜਰਬੇਕਾਰ ਖੇਤੀ ਐਡਵਾਈਜ਼ਰ। ਫਸਲ ਦੀਆਂ ਬੀਮਾਰੀਆਂ ਦਾ ਨਿਰੀਖਣ ਅਤੇ ਸਹੀ ਕੀਟਨਾਸ਼ਕਾਂ ਦੀ ਸਿਫਾਰਸ਼।</p>
    </div>

    <div class="service-card highlight">
      <h3>💬 7. ਐਡਵਾਈਜ਼ਰ ਚੈਟ (Advisor Chat)</h3>
      <p>ਆਪਣੇ ਖੇਤੀ ਐਡਵਾਈਜ਼ਰ ਨਾਲ ਲਾਈਵ ਚੈਟ ਕਰੋ, ਖਰਾਬ ਪੌਦਿਆਂ/ਫਸਲ ਦੀਆਂ ਫੋਟੋਆਂ ਭੇਜੋ ਅਤੇ ਤੁਰੰਤ ਹੱਲ ਪ੍ਰਾਪਤ ਕਰੋ।</p>
    </div>

    <div class="service-card highlight">
      <h3>📞 8. ਐਡਵਾਈਜ਼ਰ ਕਾਲ ਰਿਕਵੈਸਟ (Advisor Call Request)</h3>
      <p>ਐਪ ਵਿੱਚ "Request Call" ਬਟਨ ਦਬਾ ਕੇ ਆਪਣੇ ਐਡਵਾਈਜ਼ਰ ਨਾਲ ਫੋਨ 'ਤੇ ਸਿੱਧੀ ਗੱਲਬਾਤ ਦੀ ਰਿਕਵੈਸਟ ਭੇਜੋ।</p>
    </div>
  </div>

  <!-- PAGE BREAK FOR CLEAN 2-PAGE LAYOUT -->
  <div class="page-break"></div>

  <!-- SECTION 2: HOW TO USE -->
  <div class="section-title">
    <span>2. FarmsKing ਐਪ ਨੂੰ ਵਰਤਣ ਦਾ ਤਰੀਕਾ (Step-by-Step Guide)</span>
  </div>

  <div class="steps-container">
    <div class="step-item">
      <div class="step-num">1</div>
      <div class="step-content">
        <h4>ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਅਤੇ ਪ੍ਰੋਫਾਈਲ (Registration & King ID)</h4>
        <p>ਐਪ ਖੋਲ੍ਹ ਕੇ ਆਪਣਾ 10-ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ ਅਤੇ OTP ਨਾਲ ਵੈਰੀਫਾਈ ਕਰੋ। ਆਪਣਾ ਨਾਮ, ਪਿੰਡ ਅਤੇ 6-ਅੰਕਾਂ ਦਾ PIN Code ਸੈੱਟ ਕਰੋ। ਤੁਹਾਨੂੰ ਇੱਕ ਯੂਨੀਕ **King ID** (ਜਿਵੇਂ FK-100234) ਮਿਲੇਗੀ।</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">2</div>
      <div class="step-content">
        <h4>ਆਪਣੀ ਫਸਲ ਜੋੜੋ (Add Active Crop Cycle)</h4>
        <p>ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ **'My Active Crops'** 'ਚ ਜਾ ਕੇ ਆਪਣੀ ਫਸਲ (ਜਿਵੇਂ ਕਣਕ, ਝੋਨਾ, ਨਰਮਾ, ਆਲੂ ਆਦਿ) ਚੁਣੋ, ਬੀਜਣ ਦੀ ਤਰੀਕ ਅਤੇ ਖੇਤ ਦਾ ਏਕੜ ਦਰਜ ਕਰੋ। ਫਸਲ ਦਾ ਪੂਰਾ ਸ਼ਡਿਊਲ ਤਿਆਰ ਹੋ ਜਾਵੇਗਾ।</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">3</div>
      <div class="step-content">
        <h4>ਖੇਤੀ ਮਾਹਿਰ (Advisor) ਚੁਣੋ ਅਤੇ ਰਿਕਵੈਸਟ ਭੇਜੋ</h4>
        <p>Advisor Plan ਨਾਲ ਤੁਸੀਂ ਉਪਲਬਧ ਖੇਤੀ ਮਾਹਿਰਾਂ ਦੀ ਸੂਚੀ ਵਿੱਚੋਂ ਆਪਣਾ ਮਨਪਸੰਦ ਐਡਵਾਈਜ਼ਰ ਸਿਲੈਕਟ ਕਰ ਸਕਦੇ ਹੋ। ਐਡਵਾਈਜ਼ਰ ਤੁਹਾਡੀ ਫਸਲ ਨੂੰ ਐਕਸੈਪਟ ਕਰੇਗਾ ਅਤੇ ਮਾਰਗਦਰਸ਼ਨ ਸ਼ੁਰੂ ਕਰੇਗਾ।</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">4</div>
      <div class="step-content">
        <h4>ਐਡਵਾਈਜ਼ਰ ਨਾਲ ਚੈਟ ਅਤੇ ਕਾਲ ਕਰੋ (Chat & Call Request)</h4>
        <p>ਜੇਕਰ ਫਸਲ ਵਿੱਚ ਕੋਈ ਬੀਮਾਰੀ ਜਾਂ ਸੁਲਝਣ ਆਵੇ, ਤਾਂ **'Advisor Chat'** ਖੋਲ੍ਹ ਕੇ ਫੋਟੋ ਭੇਜੋ। ਜੇਕਰ ਫੋਨ 'ਤੇ ਗੱਲ ਕਰਨੀ ਹੋਵੇ ਤਾਂ **'Request Call'** ਬਟਨ ਦਬਾਓ।</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">5</div>
      <div class="step-content">
        <h4>ਹਿਸਾਬ-ਕਿਤਾਬ ਅਤੇ ਮਜ਼ਦੂਰੀ ਦਰਜ ਕਰੋ (Sales & Labour)</h4>
        <p>**'Sales & Expenses'** ਵਿੱਚ ਜਾ ਕੇ ਵੇਚੀ ਫਸਲ ਦੇ ਪੈਸੇ, ਖਾਦ/ਬੀਜ ਦੇ ਬਿੱਲ ਅਤੇ ਮਜ਼ਦੂਰਾਂ ਦੀਆਂ ਦਿਹਾੜੀਆਂ ਦਰਜ ਕਰੋ ਤਾਂ ਜੋ ਸਾਲ ਦੇ ਅੰਤ 'ਚ ਖੇਤ ਦਾ ਸ਼ੁੱਧ ਮੁਨਾਫਾ ਪਤਾ ਲੱਗ ਸਕੇ।</p>
      </div>
    </div>

    <div class="step-item">
      <div class="step-num">6</div>
      <div class="step-content">
        <h4>ਪਲਾਨ ਅੱਪਗ੍ਰੇਡ / ਰੀਨਿਊ ਕਰਨਾ (Get Plan Coupon & UPI)</h4>
        <p>ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ **'Get Plan Coupon'** ਬਟਨ 'ਤੇ ਕਲਿੱਕ ਕਰੋ। UPI QR Code ਸਕੈਨ ਕਰਕੇ ਭੁਗਤਾਨ ਕਰੋ (UPI) ਅਤੇ ਸਕ੍ਰੀਨਸ਼ਾਟ ਐਡਮਿਨ ਨੂੰ ਭੇਜ ਕੇ ਪਲਾਨ ਐਕਟਿਵ ਕਰਵਾਓ।</p>
      </div>
    </div>
  </div>

  <!-- SECTION 3: SUBSCRIPTION PLANS & FACILITIES MATRIX -->
  <div class="section-title">
    <span>3. FarmsKing ਪਲਾਨ ਅਤੇ ਸੁਵਿਧਾਵਾਂ ਦੀ ਤੁਲਨਾ (Subscription Plans Comparison)</span>
  </div>

  <table class="table-container">
    <thead>
      <tr>
        <th class="left-align">ਸੁਵਿਧਾਵਾਂ (Facilities / Features)</th>
        <th>🌱 Free Plan<br>(₹0)</th>
        <th>🌾 Lite Plan (PRO)<br>(₹299/ਸਾਲ)</th>
        <th>👑 Pro Plan (SMART)<br>(₹499/ਸਾਲ)</th>
        <th>🎓 Smart Plan (SUPER)<br>(₹999/30 ਦਿਨ)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="plan-name">ਹਿਸਾਬ-ਕਿਤਾਬ ਰਿਕਾਰਡ (Bookkeeping Logs)</td>
        <td>ਮੂਲ (Max 3)</td>
        <td class="badge-check">✓ ਅਨਲਿਮਟਿਡ</td>
        <td class="badge-check">✓ ਅਨਲਿਮਟਿਡ</td>
        <td class="badge-check">✓ ਅਨਲਿਮਟਿਡ</td>
      </tr>
      <tr>
        <td class="plan-name">ਐਕਟਿਵ ਫਸਲਾਂ (Active Crops Limit)</td>
        <td>ਮੈਕਸ 3 ਫਸਲਾਂ</td>
        <td class="badge-check">✓ ਅਨਲਿਮਟਿਡ</td>
        <td>ਮੈਕਸ 5 ਫਸਲਾਂ</td>
        <td class="badge-check">✓ ਅਨਲਿਮਟਿਡ</td>
      </tr>
      <tr>
        <td class="plan-name">ਫਸਲ ਹਿਸਟਰੀ (Crop History & Sales)</td>
        <td>ਸੰਖੇਪ (Summary)</td>
        <td class="badge-check">✓ ਪੂਰੀ (Full)</td>
        <td class="badge-check">✓ ਪੂਰੀ (Full)</td>
        <td class="badge-check">✓ ਪੂਰੀ (Full)</td>
      </tr>
      <tr>
        <td class="plan-name">ਮਜ਼ਦੂਰ ਰਿਕਾਰਡ (Labour Record)</td>
        <td class="badge-dash">—</td>
        <td class="badge-dash">—</td>
        <td class="badge-check">✓ ਸ਼ਾਮਲ ਹੈ</td>
        <td class="badge-check">✓ ਸ਼ਾਮਲ ਹੈ</td>
      </tr>
      <tr>
        <td class="plan-name">ਵਰਕਰ ਲੋਗਇਨ (Worker Login)</td>
        <td class="badge-dash">—</td>
        <td class="badge-dash">—</td>
        <td class="badge-check">✓ ਐਕਟਿਵ</td>
        <td class="badge-check">✓ ਐਕਟਿਵ</td>
      </tr>
      <tr>
        <td class="plan-name">ਨਿੱਜੀ ਖੇਤੀ ਮਾਹਿਰ (Dedicated Farm Advisor)</td>
        <td class="badge-dash">—</td>
        <td class="badge-dash">—</td>
        <td class="badge-dash">—</td>
        <td class="badge-check">🌟 100% ਸ਼ਾਮਲ ਹੈ</td>
      </tr>
      <tr>
        <td class="plan-name">ਲਾਈਵ ਮੌਸਮ ਰਿਪੋਰਟ (Weather Report)</td>
        <td class="badge-check">✓</td>
        <td class="badge-check">✓</td>
        <td class="badge-check">✓</td>
        <td class="badge-check">✓</td>
      </tr>
      <tr>
        <td class="plan-name">ਐਡਵਾਈਜ਼ਰ ਲਾਈਵ ਚੈਟ (Advisor Chat)</td>
        <td class="badge-dash">—</td>
        <td class="badge-dash">—</td>
        <td class="badge-dash">—</td>
        <td class="badge-check">✓ ਚੈਟ ਸੁਵਿਧਾ</td>
      </tr>
      <tr>
        <td class="plan-name">ਐਡਵਾਈਜ਼ਰ ਕਾਲ ਰਿਕਵੈਸਟ (Advisor Call Request)</td>
        <td class="badge-dash">—</td>
        <td class="badge-dash">—</td>
        <td class="badge-dash">—</td>
        <td class="badge-check">📞 ਕਾਲ ਰਿਕਵੈਸਟ enabled</td>
      </tr>
    </tbody>
  </table>

  <!-- FOOTER BOX -->
  <div class="footer-box">
    <div>
      <h4>🎧 24x7 ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ ਅਤੇ ਸਪੋਰਟ</h4>
      <p>ਕਿਸੇ ਵੀ ਜਾਣਕਾਰੀ ਜਾਂ ਸਮੱਸਿਆ ਲਈ ਐਪ ਵਿੱਚ **Admin Support Chat** ਦੀ ਵਰਤੋਂ ਕਰੋ।</p>
    </div>
    <div class="upi-badge">
      UPI
    </div>
  </div>

</body>
</html>
"""

html_path = os.path.abspath("d:/FarmsKing/FarmsKing_Farmer_Guide_Punjabi.html")
pdf_path = os.path.abspath("d:/FarmsKing/FarmsKing_Farmer_Guide_Punjabi.pdf")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML guide generated at: {html_path}")

# Run Microsoft Edge headless to print to PDF
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_path):
    edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Converting HTML to PDF via Edge...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0:
    print(f"SUCCESS: PDF generated cleanly at: {pdf_path}")
else:
    print(f"Error printing PDF: {res.stderr}")
