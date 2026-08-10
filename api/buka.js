const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

const context = new TuyaContext({
  baseUrl: 'https://openapi.tuyasg.com',
  accessKey: '5apwu48xt5spexrxh5sf',
  secretKey: 'eeb83dbad3624ec19b74a72b989d6f8f',
});

module.exports = async (req, res) => {
  try {
    const deviceId = 'a349e338f1fd700cc8u0xo';

    // Arahan khas untuk lepaskan EM Lock pada Smart WIFI Controller
    const response = await context.request({
      path: `/v1.0/devices/${deviceId}/commands`,
      method: 'POST',
      body: {
        commands: [
          {
            code: 'remote_no_pd_setkey',
            value: "1" // Menghantar Isyarat Buka Remote
          }
        ]
      }
    });

    return res.status(200).json({ status: 'Berjaya', result: response.result });
  } catch (error) {
    return res.status(500).json({ status: 'Gagal', error: error.message });
  }
};
