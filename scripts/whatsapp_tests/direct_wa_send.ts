import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import * as path from 'path';

async function run() {
  const authFolder = path.join(process.cwd(), 'whatsapp_auth_session');
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;
    console.log('Connection status update:', connection, 'QR present:', !!qr);

    if (connection === 'open') {
      console.log('🟢 WhatsApp socket open! Sending message...');
      const targetJid = '919872066901@s.whatsapp.net';
      const res = await sock.sendMessage(targetJid, { text: '🌾 Hello 9872066901! Welcome to FarmsKing.' });
      console.log('Message sent result:', res);
      setTimeout(() => {
        sock.end(undefined);
        process.exit(0);
      }, 3000);
    } else if (connection === 'close') {
      console.log('Connection closed.');
      process.exit(1);
    }
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
