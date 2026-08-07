const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

const tuya = new TuyaContext({
  baseUrl: 'https://openapi.tuyacn.com', // Asia-Pacific Data Center
  accessKey: '5apwu48xt55pexrxh5sf',
  secretKey: 'eeb83dbad3624ec19b74a72b989d6f8f',
});

module.exports = async (req, res) => {
  // Benarkan akses CORS dari web anda
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const response = await tuya.request({
      path: '/v1.0/devices/a349e338f1fd700cc8u0xo/commands',
      method: 'POST',
      body: {
        commands: [
          { code: 'switch_1', value: true },
          { code: 'switch', value: true }
        ]
      }
    });

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
