const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('--- Verifying Role-Wise QA Accounts ---');

  // 1. Staff Test Accounts (Portal: ADMIN, Password: Test@1234)
  const staff = [
    { name: 'Super Admin', phone: '9000000001' },
    { name: 'Admin Executive', phone: '9000000002' },
    { name: 'Operations Manager', phone: '9000000003' },
    { name: 'Support Operator', phone: '9000000011' },
    { name: 'Technical Trainer', phone: '9000000012' },
    { name: 'Platform Accountant', phone: '9000000013' },
  ];

  console.log('\n[Group 1: Staff Accounts -> Portal: ADMIN]');
  for (const acc of staff) {
    await sleep(250);
    const res = await postJson('/auth/login', {
      mobile: acc.phone,
      password: 'Test@1234',
      portal: 'ADMIN',
    });
    if (res.status === 200 || res.status === 201) {
      console.log(`✅ [PASS] ${acc.name} (${acc.phone}): Logged in as ${res.data.user.role} (${res.data.user.name})`);
    } else {
      console.log(`❌ [FAIL] ${acc.name} (${acc.phone}) -> ${res.status}:`, res.data.message || res.data);
    }
  }

  // 2. Partner Test Accounts (Portal: PARTNER, Password: Test@1234)
  const partners = [
    { name: 'Sales Agent', phone: '9000000007' },
    { name: 'Crop Doctor', phone: '9000000008' },
    { name: 'Garden Advisor', phone: '9000000009' },
    { name: 'Nursery Grower', phone: '9000000010' },
    { name: 'Agri Dealer/Seller', phone: '9000000014' },
  ];

  console.log('\n[Group 2: Partner Accounts -> Portal: PARTNER]');
  for (const acc of partners) {
    await sleep(600);
    const res = await postJson('/auth/login', {
      mobile: acc.phone,
      password: 'Test@1234',
      portal: 'PARTNER',
    });
    if (res.status === 200 || res.status === 201) {
      console.log(`✅ [PASS] ${acc.name} (${acc.phone}): Logged in as ${res.data.user.role} (${res.data.user.name})`);
    } else {
      console.log(`❌ [FAIL] ${acc.name} (${acc.phone}) -> ${res.status}:`, res.data.message || res.data);
    }
  }

  // 3. Client Test Accounts (Portal: CLIENT, OTP: 123456)
  const clients = [
    { name: 'Free Cultivator', phone: '9000000004' },
    { name: 'Paid Cultivator (VIP)', phone: '9000000005' },
    { name: 'Retail Customer', phone: '9000000006' },
    { name: 'Mandi Trader', phone: '9000000015' },
    { name: 'Terrace Gardener', phone: '9000000016' },
    { name: 'Field Supervisor', phone: '9000000017' },
    { name: 'Field Labour', phone: '9000000018' },
  ];

  console.log('\n[Group 3: Client Accounts -> Portal: CLIENT via OTP 123456]');
  for (const acc of clients) {
    await sleep(600);
    await postJson('/auth/send-login-otp', { mobile: acc.phone, portal: 'CLIENT' });
    await sleep(300);
    const res = await postJson('/auth/verify-login-otp', {
      mobile: acc.phone,
      otp: '123456',
      portal: 'CLIENT',
    });
    if (res.status === 200 || res.status === 201) {
      console.log(`✅ [PASS] ${acc.name} (${acc.phone}): Verified OTP as ${res.data.user.role} (${res.data.user.name})`);
    } else {
      console.log(`❌ [FAIL] ${acc.name} (${acc.phone}) -> ${res.status}:`, res.data.message || res.data);
    }
  }

  console.log('\n--- All Role-Wise QA Checks Complete ---');
}

main().catch(console.error);
