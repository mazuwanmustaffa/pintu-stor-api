// Contoh Kod Backend Vercel: api/buka.js
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

const context = new TuyaContext({
  baseUrl: 'https://openapi.tuyasg.com',
  accessKey: '5apwu48xt5spexrxh5sf',
  secretKey: 'eeb83dbad3624ec19b74a72b989d6f8f',
});

module.exports = async (req, res) => {
  try {
    const deviceId = 'a349e338f1fd700cc8u0xo';

    // 1. Hantar arahan BUKA kunci (switch_1 = true)
    const response = await context.request({
      path: `/v1.0/devices/${deviceId}/commands`,
      method: 'POST',
      body: {
        commands: [
          {
            code: 'switch_1', // Jika peranti anda jenis 1-channel, cuba 'switch' jika 'switch_1' gagal
            value: true
          }
        ]
      }
    });

    // 2. Automatik MATIKAN semula relay selepas 5 saat (EM Lock kunci semula)
    setTimeout(async () => {
      await context.request({
        path: `/v1.0/devices/${deviceId}/commands`,
        method: 'POST',
        body: {
            commands: [{ code: 'switch_1', value: false }]
        }
      });
    }, 5000);

    return res.status(200).json({ status: 'Berjaya', data: response.result });
  } catch (error) {
        return res.status(500).json({ status: 'Gagal', error: error.message });
  }
};
