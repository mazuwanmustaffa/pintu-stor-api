// api/buka.js
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

// 🔑 KONFIGURASI SDK RASMI TUYA
const tuya = new TuyaContext({
  baseUrl: 'https://openapi.tuyaus.com', // Singapore Data Center
  accessKey: '5apwu48xt55pexrxh5sf',
  secretKey: 'eeb83dbad3624ec19b74a72b989d6f8f',
});

module.exports = async (req, res) => {
  // 1. Set Header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const DEVICE_ID = 'a349e338f1fd700cc8u0xo';

    // 2. Hantar Arahan Buka Pintu (SDK urus token & sign secara automatik)
    const unlockRes = await tuya.request({
      method: 'POST',
      path: `/v1.0/devices/${DEVICE_ID}/commands`,
      body: {
        commands: [{ code: 'remote_unlock', value: true }]
      }
    });

    // 3. Autolock Backup: Mengunci semula secara automatik selepas 5 Saat
    setTimeout(async () => {
      try {
        await tuya.request({
          method: 'POST',
          path: `/v1.0/devices/${DEVICE_ID}/commands`,
          body: {
            commands: [{ code: 'remote_unlock', value: false }]
          }
        });
        console.log('[AUTOLOCK]: Pintu telah dikunci semula secara automatik.');
      } catch (err) {
        console.error('[AUTOLOCK ERROR]:', err);
      }
    }, 5000); // 5000ms = 5 Saat

    return res.status(200).json({ status: 'Berjaya', success: true, tuya: unlockRes });

  } catch (error) {
    console.error('Tuya API Error:', error);
    return res.status(500).json({ status: 'Gagal', success: false, error: error.message || error });
  }
};
