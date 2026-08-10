const TuyaOpenAPI = require('@tuya/tuya-connector-nodejs');

const api = new TuyaOpenAPI({
  baseUrl: 'https://openapi.tuyaus.com', // Singapore Region
  accessKey: '5apwu48xt55pexrxh5sf',
  secretKey: 'eeb83dbad3624ec19b74a72b989d6f8f',
});

module.exports = async (req, res) => {
  // Set Header CORS untuk benarkan capaian dari web inventori
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Hantar Arahan Buka Pintu (Unlock)
    const unlockResult = await api.request({
      path: '/v1.0/devices/a349e338f1fd700cc8u0xo/commands',
      method: 'POST',
      body: {
        commands: [{ code: 'remote_unlock', value: true }]
      }
    });

    // 2. Autolock Backup: Mengunci semula secara automatik selepas 5 Saat
    setTimeout(async () => {
      try {
        await api.request({
          path: '/v1.0/devices/a349e338f1fd700cc8u0xo/commands',
          method: 'POST',
          body: {
            commands: [{ code: 'remote_unlock', value: false }]
          }
        });
        console.log('[AUTOLOCK]: Pintu dikunci semula secara automatik.');
      } catch (err) {
        console.error('[AUTOLOCK ERROR]:', err);
      }
    }, 5000); // 5000ms = 5 Saat

    return res.status(200).json({ status: "Berjaya", success: true, result: unlockResult });

  } catch (error) {
    return res.status(500).json({ status: "Gagal", success: false, error: error.message });
  }
};
