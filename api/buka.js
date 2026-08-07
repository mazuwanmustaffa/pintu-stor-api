const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = '5apwu48xt5pexrxh5sf';
  const secret = 'eeb83dbad3624ec19b74a72b989d6f8f';
  const deviceId = 'a349e338f1fd700cc8u0xo';
  
  // Senarai 6 Base URL Rasmi Tuya di Seluruh Dunia
  const officialEndpoints = [
    'https://openapi.tuyaus.com',
    'https://openapi.tuyadb.com',
    'https://openapi.tuyacn.com',
    'https://openapi.tuyaeu.com',
    'https://openapi.tuyaeu.org',
    'https://openapi.tuyain.com'
  ];

  let attemptLogs = [];

  for (const baseUrl of officialEndpoints) {
    try {
      const t = Date.now().toString();
      const tokenUrl = '/v1.0/token?grant_type=1';
      
      const contentHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const stringToSign = `GET\n${contentHash}\n\n${tokenUrl}`;
      const signStr = clientId + t + stringToSign;
      const sign = crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();

      const tokenRes = await fetch(baseUrl + tokenUrl, {
        method: 'GET',
        headers: {
          'client_id': clientId,
          'sign': sign,
          't': t,
          'sign_method': 'HMAC-SHA256'
        }
      });

      const tokenData = await tokenRes.json();

      // Jika Token BERJAYA didapatkan
      if (tokenData.success) {
        const accessToken = tokenData.result.access_token;

        // Hantar Perintah Buka Pintu
        const cmdUrl = `/v1.0/devices/${deviceId}/commands`;
        const bodyObj = { commands: [{ code: 'switch_1', value: true }] };
        const bodyStr = JSON.stringify(bodyObj);
        
        const t2 = Date.now().toString();
        const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
        const stringToSign2 = `POST\n${bodyHash}\n\n${cmdUrl}`;
        const signStr2 = clientId + accessToken + t2 + stringToSign2;
        const sign2 = crypto.createHmac('sha256', secret).update(signStr2).digest('hex').toUpperCase();

        const cmdRes = await fetch(baseUrl + cmdUrl, {
          method: 'POST',
          headers: {
            'client_id': clientId,
            'access_token': accessToken,
            'sign': sign2,
            't': t2,
            'sign_method': 'HMAC-SHA256',
            'Content-Type': 'application/json'
          },
          body: bodyStr
        });

        const cmdData = await cmdRes.json();
        return res.status(200).json({ status: "BERJAYA", serverBetul: baseUrl, result: cmdData });
      } else {
        attemptLogs.push({ server: baseUrl, code: tokenData.code, msg: tokenData.msg });
      }
    } catch (err) {
      attemptLogs.push({ server: baseUrl, error: err.message });
    }
  }

  // Jika tiada server yang padan dengan Client ID ini
  return res.status(400).json({ 
    status: "Gagal Semua Server", 
    punca: "Client ID tidak wujud di mana-mana Data Center rasmi Tuya.",
    logCubaan: attemptLogs 
  });
};
