import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function testMetaCloudApi() {
  const token = process.env.META_WA_TOKEN;
  const phoneId = process.env.META_WA_PHONE_ID;

  console.log('Testing Meta Cloud API with:');
  console.log('Phone ID:', phoneId);
  console.log('Token Prefix:', token ? token.substring(0, 15) + '...' : 'NONE');

  const recipient = '919872066901';
  const otpCode = '54321';

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: {
          body: `🌾 *FarmsKing Verification Code*\n\nYour 5-digit FarmsKing verification code is: *${otpCode}*\n\nThis code is valid for 10 minutes.`,
        },
      }),
    });

    const json = await res.json();
    console.log('Meta API HTTP Status:', res.status);
    console.log('Meta API Result:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testMetaCloudApi();
