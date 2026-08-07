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
  const baseUrl = 'https://openapi-sg.iotbing.com';

  try {
    // 1. Dapatkan Token (Format V2.0)
    const t = Date.now().toString();
    const tokenPath = '/v1.0/token?grant_type=1';
    
    const contentHash = crypto.createHash('sha256').update('').digest('hex');
    const stringToSign = `GET\n${contentHash}\n\n${tokenPath}`;
    const signStr = clientId + t + stringToSign;
    const sign = crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();

    const tokenRes = await fetch(baseUrl + tokenPath, {
      method: 'GET',
      headers: {
        'client_id': clientId,
        'sign': sign,
        't': t,
        'sign_method': 'HMAC-SHA256'
      }
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.success) {
      return res.status(400).json({ status: "Gagal Token", responseTuya: tokenData });
    }

    const accessToken = tokenData.result.access_token;

    // 2. Hantar Perintah Buka Pintu Menggunakan Endpoint V2.0 (Dari API Explorer Anda)
    const cmdPath = `/v2.0/cloud/thing/${deviceId}/shadow/actions`;
    const bodyObj = {
      action: "switch_1",
      value: true
    };
    const bodyStr = JSON.stringify(bodyObj);
    
    const t2 = Date.now().toString();
    const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
    const stringToSign2 = `POST\n${bodyHash}\n\n${cmdPath}`;
    const signStr2 = clientId + accessToken + t2 + stringToSign2;
    const sign2 = crypto.createHmac('sha256', secret).update(signStr2).digest('hex').toUpperCase();

    const cmdRes = await fetch(baseUrl + cmdPath, {
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
    return res.status(200).json({ status: "Berjaya Buka Pintu", responseTuya: cmdData });

  } catch (err) {
    return res.status(500).json({ status: "Ralat Server", message: err.message });
  }
};
