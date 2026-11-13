/**
 * PDF 1: User Roles, Operational Responsibilities, Portal Features & Profile KYC Data
 * FarmsKing Technologies Private Limited
 */

const { renderA4Pdf } = require('./pdf_common');

const page1Html = `
  <h2 class="sec-title">
    <span>1. ਕਾਰਪੋਰੇਟ ਰੋਲ ਆਰਕੀਟੈਕਚਰ ਅਤੇ ਸ਼੍ਰੇਣੀਬੱਧ ਢਾਂਚਾ (Role Architecture)</span>
    <span class="badge badge-dark">Category 1: Clients</span>
  </h2>
  
  <p>
    ਫਾਰਮਸਕਿੰਗ ਪਲੇਟਫਾਰਮ 'ਤੇ ਸਾਰੇ ਉਪਭੋਗਤਾਵਾਂ ਨੂੰ 3 ਪ੍ਰਮੁੱਖ ਕਾਨੂੰਨੀ ਕੈਟੇਗਰੀਆਂ (Clients, Partners, Admin Staff) ਵਿੱਚ ਵੰਡਿਆ ਗਿਆ ਹੈ। ਇਹ ਢਾਂਚਾ ਆਈਐਸਓ 9001 (ਗੁਣਵੱਤਾ) ਅਤੇ ਆਈਐਸਓ 27001 (ਡੇਟਾ ਸੁਰੱਖਿਆ) ਦੇ ਉੱਚ ਮਿਆਰਾਂ ਅਨੁਸਾਰ ਤਿਆਰ ਕੀਤਾ ਗਿਆ ਹੈ ਤਾਂ ਜੋ ਕਿਸੇ ਵੀ ਰੋਲ ਦਾ ਗਲਤ ਰਲੇਵਾਂ ਨਾ ਹੋਵੇ ਅਤੇ ਹਰੇਕ ਉਪਭੋਗਤਾ ਨੂੰ ਉਸਦੇ ਅਧਿਕਾਰ ਖੇਤਰ ਮੁਤਾਬਕ ਸਪਸ਼ਟ ਸਹੂਲਤਾਂ ਮਿਲਣ।
  </p>

  <h3 class="sub-title" style="color: #065f46;">ਸ਼੍ਰੇਣੀ 1: ਕਲਾਇੰਟਸ (Clients Category - ਕਿਸਾਨ, ਮਾਲੀ ਅਤੇ ਖਰੀਦਦਾਰ)</h3>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਰੋਲ (Role)</th>
        <th style="width: 32%;">ਮੁੱਖ ਕੰਮ ਅਤੇ ਜ਼ਿੰਮੇਵਾਰੀਆਂ (Operations)</th>
        <th style="width: 25%;">ਪਲੇਟਫਾਰਮ ਫੀਚਰ (Portal Features)</th>
        <th style="width: 25%;">ਪ੍ਰੋਫਾਈਲ/KYC ਲਈ ਲੋੜੀਂਦਾ ਡਾਟਾ (Required Data)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ਕਿਸਾਨ (Farmer)</strong><br><span class="badge badge-green">Core Producer</span></td>
        <td>ਖੇਤਾਂ ਦੀ ਜੀਓ-ਟੈਗਿੰਗ, ਫ਼ਸਲਾਂ ਦੀ ਬਿਜਾਈ ਤੇ ਕਟਾਈ ਲੌਗ, ਏਆਈ ਫ਼ਸਲ ਡਾਕਟਰ ਰਾਹੀਂ ਬਿਮਾਰੀਆਂ ਦੀ ਜਾਂਚ, ਮਾਹਰ ਸਲਾਹਕਾਰਾਂ ਤੋਂ ਪਰਚੀ ਲੈਣਾ, ਮੰਡੀ ਵਿੱਚ ਫ਼ਸਲ ਵੇਚਣਾ ਅਤੇ ਖੇਤੀ ਲਾਗਤਾਂ ਦਾ ਹਿਸਾਬ ਰੱਖਣਾ।</td>
        <td>ਪਲਾਟ ਮੈਪਿੰਗ, AI Crop Doctor, ਲਾਈਵ ਮੰਡੀ ਭਾਅ, ਮੌਸਮ ਅਲਰਟ, ਖੇਤੀ ਸਟੋਰ ਤੋਂ ਆਰਡਰ, ਖੇਤੀਬਾੜੀ ਸਪਰੇਅ ਡਾਇਰੀ, ਡਿਜੀਟਲ ਕਿਸਾਨ ਪਾਸਬੁੱਕ।</td>
        <td>ਪੂਰਾ ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ (OTP ਵੈਰੀਫਾਈਡ), ਆਧਾਰ ਕਾਰਡ, ਪਿੰਡ/ਤਹਿਸੀਲ/ਜ਼ਿਲ੍ਹਾ, ਖੇਤ ਦਾ ਕੁੱਲ ਰਕਬਾ (ਏਕੜ), ਪਲਾਟ ਜੀਓ-ਕੋਆਰਡੀਨੇਟਸ, ਬੈਂਕ ਖਾਤਾ ਤੇ IFSC ਕੋਡ।</td>
      </tr>
      <tr>
        <td><strong>ਗਾਰਡਨਰ (Gardener)</strong><br><span class="badge badge-green">Urban & Home</span></td>
        <td>ਘਰੇਲੂ ਬਗੀਚੀ, ਛੱਤ (Terrace/Balcony) ਬਾਗਬਾਨੀ, ਕਿਚਨ ਗਾਰਡਨ, ਗਮਲਿਆਂ ਵਿੱਚ ਸਬਜ਼ੀਆਂ/ਫੁੱਲਾਂ ਦੀ ਦੇਖਭਾਲ, ਘਰੇਲੂ ਜੈਵਿਕ ਖਾਦਾਂ ਦਾ ਪ੍ਰਬੰਧ ਅਤੇ ਪੌਦਿਆਂ ਦੇ ਰੋਗਾਂ ਦੀ ਜਾਂਚ।</td>
        <td>ਪਲਾਂਟ ਹੈਲਥ ਸਕੈਨਰ, ਗਾਰਡਨ ਕੇਅਰ ਕੈਲੰਡਰ, ਪਾਣੀ/ਗੋਡੀ ਰੀਮਾਈਂਡਰ, ਆਰਗੈਨਿਕ ਗਾਰਡਨਿੰਗ ਸਟੋਰ, ਮਾਹਰ ਮਾਲੀ/ਗਾਰਡਨ ਅਡਵਾਈਜ਼ਰ ਕੰਸਲਟੇਸ਼ਨ।</td>
        <td>ਨਾਮ, ਸੰਪਰਕ ਨੰਬਰ, ਘਰ ਦਾ ਪੂਰਾ ਪਤਾ, ਗਾਰਡਨ ਕਿਸਮ (Terrace/Balcony/Ground), ਗਮਲਿਆਂ ਦੀ ਗਿਣਤੀ, ਮੁੱਖ ਪੌਦਿਆਂ ਦੀ ਸੂਚੀ, ਸ਼ਹਿਰ ਤੇ ਪਿੰਨ ਕੋਡ।</td>
      </tr>
      <tr>
        <td><strong>ਗਾਹਕ / ਖਰੀਦਦਾਰ (Customer)</strong><br><span class="badge badge-blue">Universal Buyer</span></td>
        <td>ਐਗਰੀਕਲਚਰ ਈ-ਕਾਮਰਸ ਮਾਰਕੀਟਪਲੇਸ ਤੋਂ ਬੀਜ, ਜੈਵਿਕ ਖਾਦਾਂ, ਬਾਗਬਾਨੀ ਸੰਦ, ਅਤੇ ਕਿਸਾਨਾਂ ਤੋਂ ਸਿੱਧੀ ਤਾਜ਼ਾ ਉਪਜ ਖਰੀਦਣਾ, ਆਰਡਰ ਟਰੈਕ ਕਰਨਾ ਅਤੇ ਸਮੀਖਿਆ ਦੇਣਾ।</td>
        <td>ਯੂਨੀਵਰਸਲ ਕਾਰਟ, ਆਨਲਾਈਨ ਭੁਗਤਾਨ (UPI/Card/COD), ਲਾਈਵ ਆਰਡਰ ਟਰੈਕਿੰਗ, ਟੈਕਸ ਇਨਵੌਇਸ ਡਾਊਨਲੋਡ, ਰਿਫੰਡ/ਰਿਟਰਨ ਵਿਕਲਪ।</td>
        <td>ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ, ਡਿਲੀਵਰੀ ਦਾ ਪਤਾ, ਲੈਂਡਮਾਰਕ, ਪਿੰਨ ਕੋਡ, ਈਮੇਲ (ਵਿਕਲਪਿਕ), ਪਸੰਦੀਦਾ ਭੁਗਤਾਨ ਤਰੀਕਾ।</td>
      </tr>
    </tbody>
  </table>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਯੂਨੀਵਰਸਲ ਕਸਟਮਰ ਰੋਲ (Universal Customer Rule)</h4>
      <p>ਫਾਰਮਸਕਿੰਗ ਪਲੇਟਫਾਰਮ 'ਤੇ ਹਰੇਕ ਰਜਿਸਟਰਡ ਉਪਭੋਗਤਾ (ਕਿਸਾਨ, ਗਾਰਡਨਰ, ਸੁਪਰਵਾਈਜ਼ਰ, ਪਾਰਟਨਰ ਜਾਂ ਸਟਾਫ਼) ਆਪਣੇ ਮੁੱਖ ਰੋਲ ਦੇ ਨਾਲ-ਨਾਲ ਇੱਕ ਗਾਹਕ (Customer) ਵਜੋਂ ਆਟੋਮੈਟਿਕ ਅਧਿਕਾਰ ਰੱਖਦਾ ਹੈ ਤਾਂ ਜੋ ਉਹ ਸਟੋਰ ਤੋਂ ਲੋੜੀਂਦਾ ਸਾਮਾਨ ਬਿਨਾਂ ਕਿਸੇ ਰੁਕਾਵਟ ਦੇ ਖਰੀਦ ਸਕੇ।</p>
    </div>
    <div class="info-box amber">
      <h4>ਕਿਸਾਨ ਬਨਾਮ ਗਾਰਡਨਰ ਨਿਯਮ (Strict Mutual Exclusivity)</h4>
      <p>ਇੱਕੋ ਮੋਬਾਈਲ ਨੰਬਰ 'ਤੇ ਜਾਂ ਤਾਂ ਕਿਸਾਨ (Farmer) ਦਾ ਖਾਤਾ ਬਣੇਗਾ ਜਾਂ ਗਾਰਡਨਰ (Gardener) ਦਾ। ਇਹ ਦੋਵੇਂ ਆਪਸ ਵਿੱਚ ਰਲ ਨਹੀਂ ਸਕਦੇ ਕਿਉਂਕਿ ਵੱਡੇ ਖੇਤੀਬਾੜੀ ਪ੍ਰਬੰਧ ਅਤੇ ਘਰੇਲੂ ਬਾਗਬਾਨੀ ਦੀ ਐਗਰੋਨੌਮੀ ਅਤੇ ਡੇਟਾਬੇਸ ਇਕਾਈਆਂ ਬਿਲਕੁਲ ਵੱਖਰੀਆਂ ਹਨ।</p>
    </div>
  </div>
`;

const page2Html = `
  <h2 class="sec-title">
    <span>2. ਫਾਰਮ ਸਟਾਫ਼ ਅਤੇ ਪਾਰਟਨਰਜ਼ ਸ਼੍ਰੇਣੀ (Farm Staff & Partners)</span>
    <span class="badge badge-dark">Category 1 & 2</span>
  </h2>

  <h3 class="sub-title" style="color: #065f46;">ਸ਼੍ਰੇਣੀ 1 (ਜਾਰੀ): ਫਾਰਮ ਸਟਾਫ਼ ਰੋਲਜ਼ (Supervisor & Labour)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਰੋਲ (Role)</th>
        <th style="width: 32%;">ਮੁੱਖ ਕੰਮ ਅਤੇ ਜ਼ਿੰਮੇਵਾਰੀਆਂ (Operations)</th>
        <th style="width: 25%;">ਪਲੇਟਫਾਰਮ ਫੀਚਰ (Portal Features)</th>
        <th style="width: 25%;">ਪ੍ਰੋਫਾਈਲ/KYC ਲਈ ਲੋੜੀਂਦਾ ਡਾਟਾ (Required Data)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ਸੁਪਰਵਾਈਜ਼ਰ (Supervisor)</strong><br><span class="badge badge-amber">Farm Manager</span></td>
        <td>ਮਾਲਕ ਕਿਸਾਨ ਦੀ ਗੈਰ-ਹਾਜ਼ਰੀ ਵਿੱਚ ਖੇਤ ਦੇ ਕੰਮਾਂ ਦੀ ਨਿਗਰਾਨੀ, ਮਜ਼ਦੂਰਾਂ ਦੀ ਹਾਜ਼ਰੀ, ਰੋਜ਼ਾਨਾ ਸਪਰੇਅ ਅਤੇ ਖਾਦ ਪਾਉਣ ਦੇ ਕੰਮਾਂ ਨੂੰ ਦਰਜ ਕਰਨਾ, ਖੇਤ ਦੀ ਸੁਰੱਖਿਆ ਅਤੇ ਖਰਚਿਆਂ ਦਾ ਵੇਰਵਾ ਭਰਨਾ।</td>
        <td>ਮਜ਼ਦੂਰ ਹਾਜ਼ਰੀ ਕੰਸੋਲ, ਡੇਲੀ ਟਾਸਕ ਸ਼ਡਿਊਲਰ, ਸਪਰੇਅ ਲੌਗਿੰਗ, ਇਨਪੁੱਟ ਖਪਤ ਰਜਿਸਟਰ, ਮਾਲਕ ਕਿਸਾਨ ਦਾ ਰੀਅਲ-ਟਾਈਮ ਡੈਸ਼ਬੋਰਡ ਐਕਸੈਸ।</td>
        <td>ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ (OTP ਵੈਰੀਫਾਈਡ), ਆਧਾਰ ਕਾਰਡ, ਤਜਰਬਾ (ਸਾਲ), ਮਾਲਕ ਕਿਸਾਨ ਦਾ ਕਿੰਗ ਆਈਡੀ (Employer King ID) ਲਿੰਕ, ਫੋਟੋ।</td>
      </tr>
      <tr>
        <td><strong>ਖੇਤ ਮਜ਼ਦੂਰ (Labour)</strong><br><span class="badge badge-amber">Field Worker</span></td>
        <td>ਖੇਤ ਵਿੱਚ ਮੈਨੂਅਲ ਕੰਮ (ਬਿਜਾਈ, ਗੋਡੀ, ਛਿੜਕਾਅ, ਵਾਢੀ, ਢੋਆ-ਢੁਆਈ), ਰੋਜ਼ਾਨਾ ਹਾਜ਼ਰੀ ਦਰਜ ਕਰਵਾਉਣਾ ਅਤੇ ਆਪਣੀ ਦਿਹਾੜੀ/ਮਜ਼ਦੂਰੀ ਦਾ ਹਿਸਾਬ ਦੇਖਣਾ।</td>
        <td>ਡਿਜੀਟਲ ਅਟੈਂਡੈਂਸ ਲੌਗ, ਦਿਹਾੜੀ/ਮਜ਼ਦੂਰੀ ਹਿਸਾਬ ਕਿਤਾਬ, ਕੰਮ ਦੀ ਅਸਾਈਨਮੈਂਟ ਨੋਟੀਫਿਕੇਸ਼ਨ, ਸਧਾਰਨ ਇੱਕ-ਕਲਿੱਕ ਕੰਸੋਲ।</td>
        <td>ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ, ਆਧਾਰ ਨੰਬਰ, ਮਾਲਕ ਕਿਸਾਨ ਨਾਲ ਲਿੰਕ, ਹੁਨਰ (ਕਟਾਈ, ਟਰੈਕਟਰ ਡਰਾਈਵਰ, ਸਪਰੇਅ ਮਾਹਰ), ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ।</td>
      </tr>
    </tbody>
  </table>

  <div class="info-box highlight" style="margin-bottom: 9px;">
    <h4>ਸੁਪਰਵਾਈਜ਼ਰ ਅਤੇ ਲੇਬਰ ਕੰਬੀਨੇਸ਼ਨ ਨਿਯਮ (Supervisor + Labour Permitted Combination)</h4>
    <p>ਪੰਜਾਬ ਅਤੇ ਭਾਰਤੀ ਖੇਤੀ ਪ੍ਰਣਾਲੀ ਦੇ ਅਸਲ ਹਾਲਾਤਾਂ ਨੂੰ ਮੁੱਖ ਰੱਖਦੇ ਹੋਏ, ਫਾਰਮਸਕਿੰਗ ਸਿਸਟਮ ਵਿੱਚ ਇੱਕ ਸੁਪਰਵਾਈਜ਼ਰ ਨੂੰ ਉਸੇ ਮਾਲਕ ਕਿਸਾਨ ਅਧੀਨ ਲੇਬਰ (Labour) ਦਾ ਰੋਲ ਵੀ ਇਕੱਠਾ ਮਿਲ ਸਕਦਾ ਹੈ। ਅਜਿਹੀ ਸੂਰਤ ਵਿੱਚ ਸੁਪਰਵਾਈਜ਼ਰ ਦੀ ਕਮਾਂਡ ਅਥਾਰਟੀ ਪ੍ਰਮੁੱਖ ਰਹਿੰਦੀ ਹੈ, ਜਦਕਿ ਉਸਦਾ ਆਪਣਾ ਮਜ਼ਦੂਰੀ ਲੌਗ ਵੀ ਪਾਰਦਰਸ਼ੀ ਤਰੀਕੇ ਨਾਲ ਚੱਲਦਾ ਹੈ। ਫਾਰਮ ਸਟਾਫ਼ ਖਾਤਾ ਕਦੇ ਵੀ ਬਾਹਰੀ ਵਪਾਰੀ ਜਾਂ ਐਡਮਿਨ ਸਟਾਫ਼ ਨਾਲ ਨਹੀਂ ਰਲ ਸਕਦਾ।</p>
  </div>

  <h3 class="sub-title" style="color: #1e40af;">ਸ਼੍ਰੇਣੀ 2: ਪਾਰਟਨਰਜ਼ (Partners Category - ਕਮਿਸ਼ਨ ਅਤੇ ਸੇਵਾ ਪ੍ਰਦਾਤਾ)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਰੋਲ (Role)</th>
        <th style="width: 32%;">ਮੁੱਖ ਕੰਮ ਅਤੇ ਜ਼ਿੰਮੇਵਾਰੀਆਂ (Operations)</th>
        <th style="width: 25%;">ਪਲੇਟਫਾਰਮ ਫੀਚਰ (Portal Features)</th>
        <th style="width: 25%;">ਪ੍ਰੋਫਾਈਲ/KYC ਲਈ ਲੋੜੀਂਦਾ ਡਾਟਾ (Required Data)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ਖੇਤੀ ਸਲਾਹਕਾਰ (Farm Advisor)</strong><br><span class="badge badge-purple">Doctor/Agronomist</span></td>
        <td>ਕਿਸਾਨਾਂ ਵੱਲੋਂ ਭੇਜੇ ਗਏ ਫ਼ਸਲੀ ਰੋਗਾਂ ਦੇ ਕੇਸਾਂ ਦੀ ਸਮੀਖਿਆ, ਏਆਈ ਰਿਪੋਰਟ ਦੀ ਡਾਕਟਰੀ ਪੁਸ਼ਟੀ, ਸਰਕਾਰੀ/ICAR ਮਿਆਰਾਂ ਅਨੁਸਾਰ ਡਿਜੀਟਲ ਪਰਚੀ ਜਾਰੀ ਕਰਨਾ, ਫੋਨ/ਵੀਡੀਓ ਸਲਾਹ ਦੇਣਾ।</td>
        <td>ਡਾਕਟਰ ਓਪੀਡੀ ਕੰਸੋਲ, ਡਿਜੀਟਲ ਪ੍ਰਿਸਕ੍ਰਿਪਸ਼ਨ ਪੈਡ, ਕਿਸਾਨ ਹਿਸਟਰੀ ਰਿਕਾਰਡ, ਸਲਾਹ ਫੀਸ ਵਾਲਿਟ, ਰੇਟਿੰਗ ਅਤੇ ਫੀਡਬੈਕ ਸਿਸਟਮ।</td>
        <td>ਨਾਮ, ਯੋਗਤਾ (B.Sc/M.Sc/Ph.D Agriculture), ਡਿਗਰੀ ਸਰਟੀਫਿਕੇਟ ਕਾਪੀ, ਸਪੈਸ਼ਲਾਈਜ਼ੇਸ਼ਨ (ਕੀਟ ਵਿਗਿਆਨ/ਮਿੱਟੀ ਵਿਗਿਆਨ), ਆਧਾਰ, ਪੈਨ ਕਾਰਡ, ਬੈਂਕ ਖਾਤਾ।</td>
      </tr>
      <tr>
        <td><strong>ਗਾਰਡਨ ਸਲਾਹਕਾਰ (Garden Advisor)</strong><br><span class="badge badge-purple">Horticulturist</span></td>
        <td>ਸ਼ਹਿਰੀ ਗਾਰਡਨਰਾਂ ਨੂੰ ਲੈਂਡਸਕੇਪਿੰਗ, ਬੋਨਸਾਈ, ਛੱਤ ਬਾਗਬਾਨੀ, ਘਰੇਲੂ ਪੌਦਿਆਂ ਦੇ ਕੀੜੇ-ਮਕੌੜੇ ਰੋਕਣ ਅਤੇ ਜੈਵਿਕ ਪੋਸ਼ਣ ਬਾਰੇ ਮਾਹਰ ਰਾਇ ਦੇਣਾ ਅਤੇ ਗਾਰਡਨ ਵਿਜ਼ਿਟ ਕਰਨਾ।</td>
        <td>ਅਰਬਨ ਪਲਾਂਟ ਓਪੀਡੀ, ਗਾਰਡਨ ਡਿਜ਼ਾਈਨ ਸ਼ਡਿਊਲਰ, ਘਰੇਲੂ ਵਿਜ਼ਿਟ ਬੁਕਿੰਗ ਮੈਨੇਜਰ, ਸਰਵਿਸ ਚਾਰਜ ਬਿਲਿੰਗ।</td>
        <td>ਨਾਮ, ਬਾਗਬਾਨੀ/ਹਾਰਟੀਕਲਚਰ ਡਿਪਲੋਮਾ ਜਾਂ ਤਜਰਬਾ ਸਰਟੀਫਿਕੇਟ, ਸ਼ਹਿਰੀ ਸੇਵਾ ਖੇਤਰ (ਸ਼ਹਿਰ/ਜ਼ੋਨ), ਆਧਾਰ ਕਾਰਡ, ਪੈਨ ਕਾਰਡ, ਬੈਂਕ ਵੇਰਵੇ।</td>
      </tr>
    </tbody>
  </table>
`;

const page3Html = `
  <h2 class="sec-title">
    <span>3. ਵਪਾਰਕ ਪਾਰਟਨਰਜ਼ ਅਤੇ ਐਡਮਿਨ ਸਟਾਫ਼ (Commercial Partners & Admin Staff)</span>
    <span class="badge badge-dark">Category 2 & 3</span>
  </h2>

  <h3 class="sub-title" style="color: #1e40af;">ਸ਼੍ਰੇਣੀ 2 (ਜਾਰੀ): ਵਪਾਰਕ ਅਤੇ ਫੀਲਡ ਪਾਰਟਨਰਜ਼ (Commercial Partners)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਰੋਲ (Role)</th>
        <th style="width: 32%;">ਮੁੱਖ ਕੰਮ ਅਤੇ ਜ਼ਿੰਮੇਵਾਰੀਆਂ (Operations)</th>
        <th style="width: 25%;">ਪਲੇਟਫਾਰਮ ਫੀਚਰ (Portal Features)</th>
        <th style="width: 25%;">ਪ੍ਰੋਫਾਈਲ/KYC ਲਈ ਲੋੜੀਂਦਾ ਡਾਟਾ (Required Data)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ਫੀਲਡ ਏਜੰਟ (Field Agent)</strong><br><span class="badge badge-purple">Sales & Support</span></td>
        <td>ਪਿੰਡ ਪੱਧਰ 'ਤੇ ਕਿਸਾਨਾਂ ਨੂੰ ਫਾਰਮਸਕਿੰਗ ਨਾਲ ਜੋੜਨਾ, ਮਿੱਟੀ ਸੈਂਪਲ ਇਕੱਠੇ ਕਰਨਾ, ਐਪ ਵਰਤਣ ਵਿੱਚ ਮਦਦ ਕਰਨਾ, ਸਥਾਨਕ ਡਿਲਿਵਰੀ ਸਹਾਇਤਾ ਅਤੇ ਕਮਿਸ਼ਨ ਕਮਾਉਣਾ।</td>
        <td>ਏਜੰਟ ਰੈਫਰਲ ਡੈਸ਼ਬੋਰਡ, ਲੀਡ ਮੈਨੇਜਮੈਂਟ, ਕਿਸਾਨ ਔਨਬੋਰਡਿੰਗ ਟੂਲ, ਕਮਿਸ਼ਨ ਪਾਸਬੁੱਕ, ਰੀਅਲ-ਟਾਈਮ ਇਨਸੈਂਟਿਵ ਟ੍ਰੈਕਰ।</td>
        <td>ਨਾਮ, ਮੋਬਾਈਲ, ਆਧਾਰ ਕਾਰਡ, ਪੈਨ ਕਾਰਡ, ਪਿੰਡ/ਬਲਾਕ ਦਾ ਨਾਮ, ਕਾਰਜ ਖੇਤਰ (Jurisdiction), ਬੈਂਕ ਖਾਤਾ ਤੇ ਕੈਂਸਲ ਚੈੱਕ।</td>
      </tr>
      <tr>
        <td><strong>ਦੁਕਾਨਦਾਰ / ਵਿਕਰੇਤਾ (Store Seller)</strong><br><span class="badge badge-purple">Agri Merchant</span></td>
        <td>ਖੇਤੀਬਾੜੀ ਇਨਪੁੱਟ (ਅਸਲੀ ਬੀਜ, ਖਾਦਾਂ, ਕੀਟਨਾਸ਼ਕ, ਤੁਪਕਾ ਸਿੰਚਾਈ ਸੰਦ) ਸਟੋਰ 'ਤੇ ਲਿਸਟ ਕਰਨਾ, ਆਰਡਰ ਪੈਕ ਕਰਨਾ, ਪੱਕਾ ਜੀਐਸਟੀ ਬਿੱਲ ਜਾਰੀ ਕਰਨਾ ਅਤੇ ਡਿਸਪੈਚ ਕਰਨਾ।</td>
        <td>ਸਟੋਰ ਮੈਨੇਜਮੈਂਟ ਕੰਸੋਲ, ਇਨਵੈਂਟਰੀ ਤੇ ਬੈਚ ਕੰਟਰੋਲ, ਜੀਐਸਟੀ ਟੈਕਸ ਇਨਵੌਇਸਿੰਗ, ਆਰਡਰ ਡਿਸਪੈਚ ਪੈਨਲ, ਪੇਮੈਂਟ ਸੈਟਲਮੈਂਟ ਵਾਲਿਟ।</td>
        <td>ਦੁਕਾਨ ਦਾ ਨਾਮ, ਮਾਲਕ ਦਾ ਨਾਮ, ਖਾਦ/ਬੀਜ/ਕੀਟਨਾਸ਼ਕ ਲਾਇਸੈਂਸ ਨੰਬਰ, ਜੀਐਸਟੀ ਨੰਬਰ (GSTIN), ਪੈਨ ਕਾਰਡ, ਬੈਂਕ ਕਰੰਟ ਖਾਤਾ, ਦੁਕਾਨ ਦਾ ਪਤਾ।</td>
      </tr>
      <tr>
        <td><strong>ਮੰਡੀ ਵਪਾਰੀ (Mandi Trader)</strong><br><span class="badge badge-purple">Commission Agent</span></td>
        <td>ਅਨਾਜ ਮੰਡੀਆਂ ਵਿੱਚ ਕਿਸਾਨਾਂ ਦੀਆਂ ਫ਼ਸਲਾਂ ਦੀ ਬੋਲੀ ਲਗਾਉਣਾ, ਲਾਈਵ ਰੇਟ ਅਪਡੇਟ ਕਰਨਾ, ਵੱਡੇ ਖਰੀਦਦਾਰਾਂ ਨਾਲ ਸੌਦੇ ਤੈਅ ਕਰਨਾ ਅਤੇ ਕਿਸਾਨਾਂ ਨੂੰ ਤੁਰੰਤ ਪੇਮੈਂਟ ਕਰਨਾ।</td>
        <td>ਲਾਈਵ ਮੰਡੀ ਬਿਡਿੰਗ ਕੰਸੋਲ, ਟਰੇਡਿੰਗ ਵਾਲਿਟ, ਡਿਜੀਟਲ ਜੇ-ਫਾਰਮ (J-Form) ਐਂਟਰੀ, ਫ਼ਸਲ ਆਮਦ ਰਜਿਸਟਰ, ਬਲਕ ਆਰਡਰ ਪੈਨਲ।</td>
        <td>ਮੰਡੀ ਲਾਇਸੈਂਸ ਨੰਬਰ (Market Committee License), ਫਰਮ ਦਾ ਨਾਮ, ਜੀਐਸਟੀ ਨੰਬਰ, ਪੈਨ ਕਾਰਡ, ਬੈਂਕ ਖਾਤਾ, ਮੰਡੀ ਦਾ ਨਾਮ ਤੇ ਜ਼ਿਲ੍ਹਾ।</td>
      </tr>
    </tbody>
  </table>

  <h3 class="sub-title" style="color: #991b1b;">ਸ਼੍ਰੇਣੀ 3: ਐਡਮਿਨ ਸਟਾਫ਼ (Admin Staff - ਪ੍ਰਸ਼ਾਸਕੀ ਨਿਯੰਤਰਣ)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">ਰੋਲ (Role)</th>
        <th style="width: 32%;">ਮੁੱਖ ਕੰਮ ਅਤੇ ਜ਼ਿੰਮੇਵਾਰੀਆਂ (Operations)</th>
        <th style="width: 25%;">ਪਲੇਟਫਾਰਮ ਫੀਚਰ (Portal Features)</th>
        <th style="width: 25%;">ਪ੍ਰੋਫਾਈਲ/ਸੁਰੱਖਿਆ ਡਾਟਾ (Security Credentials)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ਸੁਪਰ ਐਡਮਿਨ ਤੇ ਐਡਮਿਨ</strong><br><span class="badge badge-dark">Full System Control</span></td>
        <td>ਸਿਸਟਮ ਸੰਚਾਲਨ, ਨਵੇਂ ਪਾਰਟਨਰਾਂ ਦੀ ਜਾਂਚ ਤੇ ਪ੍ਰਵਾਨਗੀ, ਸੁਰੱਖਿਆ ਨੀਤੀਆਂ, 2-ਫੈਕਟਰ ਪ੍ਰਮਾਣੀਕਰਨ, ਡਾਟਾਬੇਸ ਤੇ ਸਰਵਰ ਨਿਗਰਾਨੀ, ਕੰਪਨੀ ਵਿੱਤੀ ਆਡਿਟ।</td>
        <td>ਮਾਸਟਰ ਐਡਮਿਨ ਕੰਸੋਲ, ਰੋਲ ਮੈਨੇਜਮੈਂਟ, ਸਿਸਟਮ ਕੌਂਫਿਗ, 2FA ਸੁਰੱਖਿਆ ਕੰਟਰੋਲ, ਆਡਿਟ ਲੌਗਜ਼, ਰੀਅਲ-ਟਾਈਮ ਐਸਈਓ ਟ੍ਰਿਗਰ।</td>
        <td>ਅਧਿਕਾਰਤ ਕਾਰਪੋਰੇਟ ਈਮੇਲ, ਗੁਪਤ ਮਾਸਟਰ ਪਾਸਵਰਡ, ਹਾਰਡਵੇਅਰ 2FA OTP ਪ੍ਰਮਾਣੀਕਰਨ, ਬੋਰਡ ਆਫ ਡਾਇਰੈਕਟਰਜ਼ ਰੈਜ਼ੋਲਿਊਸ਼ਨ।</td>
      </tr>
      <tr>
        <td><strong>ਮੈਨੇਜਰ ਤੇ ਓਪਰੇਟਰ</strong><br><span class="badge badge-dark">Operations & Support</span></td>
        <td>ਰੋਜ਼ਾਨਾ ਯੂਜ਼ਰ ਸਹਾਇਤਾ, ਪਾਰਟਨਰ ਦਸਤਾਵੇਜ਼ਾਂ ਦੀ ਮੈਨੂਅਲ ਪੜਤਾਲ, ਆਰਡਰ ਡਿਸਪੈਚ ਨਿਗਰਾਨੀ, ਝਗੜਿਆਂ ਦਾ ਨਿਪਟਾਰਾ ਅਤੇ ਮੰਡੀ ਰੇਟਾਂ ਦੀ ਤਸਦੀਕ।</td>
        <td>ਯੂਜ਼ਰ ਵੈਰੀਫਿਕੇਸ਼ਨ ਪੈਨਲ, ਆਰਡਰ ਟ੍ਰੈਕਰ, ਸਪੋਰਟ ਟਿਕਟ ਡੈਸ਼ਬੋਰਡ, ਮੰਡੀ ਪ੍ਰਾਈਸ ਅਪਡੇਟਰ, ਕਾਲ ਲੌਗ ਕੰਸੋਲ।</td>
        <td>ਸਟਾਫ਼ ਆਈਡੀ, ਦਫ਼ਤਰੀ ਮੋਬਾਈਲ, ਆਧਾਰ ਕਾਰਡ, ਪੁਲਿਸ ਵੈਰੀਫਿਕੇਸ਼ਨ, ਗੈਰ-ਖੁਲਾਸਾ ਇਕਰਾਰਨਾਮਾ (NDA), 2FA ਪ੍ਰੋਫਾਈਲ।</td>
      </tr>
      <tr>
        <td><strong>ਟ੍ਰੇਨਰ ਤੇ ਅਕਾਊਂਟੈਂਟ</strong><br><span class="badge badge-dark">Finance & Training</span></td>
        <td>ਕਿਸਾਨਾਂ ਤੇ ਏਜੰਟਾਂ ਨੂੰ ਤਕਨੀਕੀ ਸਿਖਲਾਈ ਦੇਣਾ, ਵੈਬੀਨਾਰ ਚਲਾਉਣਾ, ਜੀਐਸਟੀ ਰਿਟਰਨਾਂ, ਟੀਡੀਐਸ ਕਟੌਤੀ, ਪਾਰਟਨਰ ਕਮਿਸ਼ਨ ਪੇਆਉਟ ਅਤੇ ਬੈਂਕ ਰੀਕਨਸੀਲੀਏਸ਼ਨ।</td>
        <td>ਲਰਨਿੰਗ ਮੈਨੇਜਮੈਂਟ ਪੋਰਟਲ, ਬਿਲਿੰਗ ਤੇ ਟੈਕਸ ਲੌਗ, ਪੇਆਉਟ ਗੇਟਵੇ, ਟੀਡੀਐਸ ਰਿਪੋਰਟਿੰਗ, ਵਿੱਤੀ ਲੇਜ਼ਰ।</td>
        <td>ਪੇਸ਼ੇਵਰ ਯੋਗਤਾ (CA/Inter CA/M.Com/MBA), ਪੈਨ ਕਾਰਡ, ਬੈਂਕ ਵੇਰਵੇ, ਆਡਿਟ ਲਾਇਸੈਂਸ।</td>
      </tr>
    </tbody>
  </table>
`;

const page4Html = `
  <h2 class="sec-title">
    <span>4. ਸਿਸਟਮ ਵੈਰੀਫਿਕੇਸ਼ਨ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ ਰਿਪੋਰਟ (System Audit & Future Roadmap)</span>
    <span class="badge badge-dark">Executive Sign-Off</span>
  </h2>

  <div class="grid-2">
    <div class="info-box highlight">
      <h4>ਮਲਟੀ-ਪੋਰਟਲ ਅਲਗਾਵ ਨਿਯਮ (Portal Segregation Rules)</h4>
      <p>ਕਲਾਇੰਟ ਪੋਰਟਲ (ਕਿਸਾਨ/ਗਾਹਕ) ਅਤੇ ਪਾਰਟਨਰ ਪੋਰਟਲ (ਡਾਕਟਰ/ਏਜੰਟ/ਵਿਕਰੇਤਾ) ਦੇ ਲੌਗਇਨ ਬਿਲਕੁਲ ਵੱਖਰੇ ਹਨ। ਜੇਕਰ ਇੱਕ ਕਿਸਾਨ ਏਜੰਟ ਵੀ ਹੈ, ਤਾਂ ਉਸਦਾ ਇੱਕੋ ਕਿੰਗ ਆਈਡੀ ਰਹੇਗਾ ਪਰ ਉਹ ਪਾਰਟਨਰ ਟੈਬ ਵਿੱਚ ਸਿਰਫ ਪਾਰਟਨਰ ਫੀਚਰ ਅਤੇ ਯੂਜ਼ਰ ਟੈਬ ਵਿੱਚ ਕਿਸਾਨ ਫੀਚਰ ਵੇਖ ਸਕੇਗਾ। ਐਡਮਿਨ ਸਟਾਫ਼ ਪੂਰੀ ਤਰ੍ਹਾਂ ਅਲੱਗ ਰਹੇਗਾ।</p>
    </div>
    <div class="info-box blue">
      <h4>ਸਖ਼ਤ ਸਰਵਰ OTP ਵੈਰੀਫਿਕੇਸ਼ਨ (Server-Side OTP Security)</h4>
      <p>ਕਿਸੇ ਵੀ ਰੋਲ ਦੀ ਸਿਰਜਣਾ ਜਾਂ ਪ੍ਰੋਫਾਈਲ ਬਦਲਾਅ ਲਈ ਕਲਾਇੰਟ-ਸਾਈਡ ਛੋਟ ਨਹੀਂ ਹੈ। ਸਰਵਰ-ਸਾਈਡ ਰੈਡਿਸ/ਕੈਸ਼ੇ ਓਟੀਪੀ ਪ੍ਰਮਾਣੀਕਰਨ ਲਾਜ਼ਮੀ ਹੈ। ਇਸ ਨਾਲ ਫਰਜ਼ੀ ਖਾਤੇ ਬਣਨ ਦੀ ਸੰਭਾਵਨਾ ਜ਼ੀਰੋ ਹੋ ਜਾਂਦੀ ਹੈ ਅਤੇ ਡਾਟਾਬੇਸ ਦੀ ਇਮਾਨਦਾਰੀ 100% ਬਰਕਰਾਰ ਰਹਿੰਦੀ ਹੈ।</p>
    </div>
  </div>

  <div class="eval-container">
    <div class="eval-box-top">
      <h4>ਇਸ ਪ੍ਰਣਾਲੀ ਦੇ ਮੌਜੂਦਾ ਸਰਵੋਤਮ ਫੀਚਰ (Outstanding Current Features):</h4>
      <ul class="eval-list">
        <li><strong>ਯੂਨੀਫਾਈਡ ਕਿੰਗ ਆਈਡੀ (Unified King ID Architecture):</strong> ਇੱਕੋ ਉਪਭੋਗਤਾ ਇੱਕੋ ਮੋਬਾਈਲ 'ਤੇ ਕਿਸਾਨ ਅਤੇ ਏਜੰਟ ਦੋਵੇਂ ਰੋਲ ਬਿਨਾਂ ਕਿਸੇ ਡਾਟਾ ਟਕਰਾਅ ਦੇ ਪਾਰਦਰਸ਼ੀ ਤਰੀਕੇ ਨਾਲ ਚਲਾ ਸਕਦਾ ਹੈ।</li>
        <li><strong>ਸੁਪਰਵਾਈਜ਼ਰ + ਲੇਬਰ ਅਨੁਕੂਲਤਾ (Supervisor + Labour Combo):</strong> ਜ਼ਮੀਨੀ ਹਕੀਕਤਾਂ ਅਨੁਸਾਰ ਸੁਪਰਵਾਈਜ਼ਰ ਅਤੇ ਲੇਬਰ ਦਾ ਇਕੱਠਾ ਕੰਮ ਕਰਨ ਦਾ ਵਿਲੱਖਣ ਪ੍ਰਬੰਧ, ਜੋ ਭਾਰਤ ਦੇ ਕਿਸੇ ਹੋਰ ਐਪ ਵਿੱਚ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।</li>
        <li><strong>ਸਖ਼ਤ ਐਡਮਿਨ ਸਿੰਗਲ-ਰੋਲ ਸੁਰੱਖਿਆ:</strong> ਕੰਪਨੀ ਸਟਾਫ਼ ਨੂੰ ਸਿਰਫ ਇੱਕ ਹੀ ਪ੍ਰਬੰਧਕੀ ਰੋਲ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ ਤਾਂ ਜੋ ਹਿੱਤਾਂ ਦਾ ਟਕਰਾਅ (Conflict of Interest) ਪੈਦਾ ਨਾ ਹੋ ਸਕੇ।</li>
        <li><strong>ਮੈਨਡੇਟਰੀ ਸਟੈੱਪ-ਅੱਪ 2FA:</strong> ਐਡਮਿਨ ਵੱਲੋਂ ਕਿਸੇ ਵੀ ਗੰਭੀਰ ਸੈਟਿੰਗ ਜਾਂ ਯੂਜ਼ਰ ਬਲਾਕ/ਡੀਲੀਟ ਲਈ 2-ਫੈਕਟਰ ਓਟੀਪੀ ਦੀ ਲਾਜ਼ਮੀ ਸ਼ਰਤ।</li>
      </ul>
    </div>

    <div class="eval-box-future">
      <h4>ਭਵਿੱਖ ਵਿੱਚ ਹੋਰ ਸ਼ਾਮਲ ਕੀਤੇ ਜਾਣ ਵਾਲੇ ਸੁਪਰ-ਐਡਵਾਂਸਡ ਫੀਚਰ (High-Value Features to Add in Future):</h4>
      <ul class="eval-list">
        <li><strong>ਬਾਇਓਮੀਟ੍ਰਿਕ / ਆਧਾਰ ਫੇਸ ਆਰਡੀ ਲਿੰਕ (Aadhaar Face RD Auth):</strong> ਪਿੰਡਾਂ ਵਿੱਚ ਮਜ਼ਦੂਰਾਂ ਦੀ ਹਾਜ਼ਰੀ ਲਈ ਆਧਾਰ ਫੇਸ ਰਿਕੋਗਨੀਸ਼ਨ ਸਿਸਟਮ ਜੋੜਨਾ ਤਾਂ ਜੋ ਫਰਜ਼ੀ ਹਾਜ਼ਰੀ ਦੀ ਗੁੰਜਾਇਸ਼ ਨਾ ਰਹੇ।</li>
        <li><strong>ਆਟੋਮੇਟਿਡ ਡਿਜੀਟਲ ਐਗਰੀਮੈਂਟ (E-Sign Contracts):</strong> ਮਾਲਕ ਕਿਸਾਨ ਅਤੇ ਸੁਪਰਵਾਈਜ਼ਰ/ਲੇਬਰ ਵਿਚਕਾਰ ਮੌਸਮੀ ਠੇਕੇ ਦਾ ਡਿਜੀਟਲ ਸਟੈਂਪ ਪੇਪਰ ਇਕਰਾਰਨਾਮਾ।</li>
        <li><strong>ਪਾਰਟਨਰ ਕ੍ਰੈਡਿਟ ਸਕੋਰਿੰਗ (Partner Trust Index):</strong> ਡਾਕਟਰਾਂ ਦੀ ਸਹੀ ਸਲਾਹ ਅਤੇ ਦੁਕਾਨਦਾਰਾਂ ਦੇ ਓਰੀਜਨਲ ਉਤਪਾਦਾਂ ਦੇ ਆਧਾਰ 'ਤੇ ਆਟੋਮੈਟਿਕ ਏਆਈ ਟਰੱਸਟ ਬੈਜ ਪ੍ਰਦਾਨ ਕਰਨਾ।</li>
        <li><strong>ਮਲਟੀ-ਲੈਂਗੁਏਜ ਆਡੀਓ KYC:</strong> ਅਨਪੜ੍ਹ ਜਾਂ ਬਜ਼ੁਰਗ ਕਿਸਾਨਾਂ ਲਈ ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲ ਕੇ ਪ੍ਰੋਫਾਈਲ ਪੂਰੀ ਕਰਨ ਦੀ ਸਹੂਲਤ।</li>
      </ul>
    </div>

    <div class="statutory-signoff">
      <div>
        <div class="title">ਫਾਰਮਸਕਿੰਗ ਤਕਨਾਲੋਜੀ ਪ੍ਰਾਈਵੇਟ ਲਿਮਟਿਡ &bull; FARMSKING TECHNOLOGIES PVT LTD</div>
        <div class="details">CIN: U01100PB2026PTC063294 &bull; ਰਜਿਸਟਰਡ ਦਫ਼ਤਰ: ਗੋਇੰਦਵਾਲ ਸਾਹਿਬ, ਖਡੂਰ ਸਾਹਿਬ, ਤਰਨ ਤਾਰਨ (ਪੰਜਾਬ) - 143422</div>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-green">ਬੋਰਡ ਆਫ ਡਾਇਰੈਕਟਰਜ਼ ਦੁਆਰਾ ਪ੍ਰਵਾਨਿਤ</span>
      </div>
    </div>
  </div>
`;

renderA4Pdf(
  '01_FarmsKing_User_Roles_Features_KYC_Punjabi_A4.pdf',
  'ਰੋਲ ਆਰਕੀਟੈਕਚਰ ਤੇ ਪ੍ਰੋਫਾਈਲ ਗਾਈਡ',
  [
    { sub: 'ਸ਼੍ਰੇਣੀ 1: ਕਲਾਇੰਟਸ (Clients: Farmer, Gardener, Customer)', html: page1Html },
    { sub: 'ਸ਼੍ਰੇਣੀ 1 & 2: ਫਾਰਮ ਸਟਾਫ਼ ਅਤੇ ਐਡਵਾਈਜ਼ਰ (Staff & Advisors)', html: page2Html },
    { sub: 'ਸ਼੍ਰੇਣੀ 2 & 3: ਕਮਰਸ਼ੀਅਲ ਪਾਰਟਨਰਜ਼ ਅਤੇ ਐਡਮਿਨ (Partners & Admin)', html: page3Html },
    { sub: 'ਸਿਸਟਮ ਆਡਿਟ, ਸਰਵੋਤਮ ਫੀਚਰ ਅਤੇ ਭਵਿੱਖੀ ਵਿਸਥਾਰ (Audit & Roadmap)', html: page4Html },
  ]
);

