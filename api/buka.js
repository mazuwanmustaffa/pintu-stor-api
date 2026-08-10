const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

// 🔑 Konfigurasi SDK Rasmi Tuya
const tuya = new TuyaContext({
  baseUrl: 'https://openapi.tuyasg.com',
  accessKey: '5apwu48xt5spexaxh5sf',
  secretKey: 'eeb83dbad3624ec19b74a72b989d6f8f',
});

module.exports = async (req, res) => {
  // Kawalan Kebenaran CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Hantar Arahan Buka Pintu Menggunakan SDK
    const response = await tuya.request({
      method: 'POST',
      path: `/v1.0/devices/a349e338f1fd700cc8u0xo/commands`,
      body: {
        commands: [
          {
            code: 'switch_1',
            value: true,
          },
        ],
      },
    });

    if (response.success) {
      return res.status(200).json({
        status: 'Berjaya',
        message: 'EM Lock Tuya fizikal berjaya dipicu secara direct!',
        result: response.result
      });
    } else {
      return res.status(500).json({
        status: 'Ralat Tuya API',
        details: response
      });
    }

  } catch (error) {
    return res.status(500).json({
      status: 'Ralat Pelayan',
      message: error.message || 'Gagal memanggil SDK Tuya'
    });
  }
};
