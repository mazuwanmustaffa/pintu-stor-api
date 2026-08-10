// Fail di Vercel: /api/buka.js
const TuyaOpenAPI = require('@tuya/tuya-connector-nodejs');

const api = new TuyaOpenAPI({
  baseUrl: 'https://openapi.tuyaus.com', // Singapore Data Center
  accessKey: '5apwu48xt55pexrxh5sf',
  secretKey: 'eeb83dbad3624ec19b74a72b989d6f8f',
});

export default async function handler(req, res) {
  // Benarkan akses CORS dari domain web anda
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  try {
    // 1. Hantar arahan Buka Pintu
    await api.request({
      path: '/v1.0/devices/a349e338f1fd700cc8u0xo/commands',
      method: 'POST',
      body: {
        commands: [{ code: 'remote_unlock', value: true }]
      }
    });

    // 2. Autolock Backup: Mengunci semula secara automatik selepas 5 saat
    setTimeout(async () => {
      await api.request({
        path: '/v1.0/devices/a349e338f1fd700cc8u0xo/commands',
        method: 'POST',
        body: {
          commands: [{ code: 'remote_unlock', value: false }]
        }
      });
    }, 5000);

    return res.status(200).json({ status: "Berjaya", message: "Pintu dibuka dan autolock diaktifkan." });
  } catch (error) {
    return res.status(500).json({ status: "Gagal", error: error.message });
  }
}
