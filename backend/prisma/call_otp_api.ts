import http from 'http';

const data = JSON.stringify({
  mobile: '9872066901',
  otp: 'hello 9872066901',
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/whatsapp/send-test-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', body);
    });
  }
);

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();
