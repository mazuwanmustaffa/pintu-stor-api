// api/buka.js
const crypto = require('crypto');

// 🔑 MAKLUAMAT TUYA API ANDA
const CLIENT_ID = '5apwu48xt55pexrxh5sf';
const CLIENT_SECRET = 'eeb83dbad3624ec19b74a72b989d6f8f';
const DEVICE_ID = 'a349e338f1fd700cc8u0xo';
const TUYA_BASE_URL = 'https://openapi.tuyaus.com'; // Singapore Data Center

// Fungsi Jana Signature HMAC-SHA256 Keselamatan Tuya
function calcSign(clientId, secret, timestamp, accessToken = '', url = '', body = '') {
  const contentHash = crypto.createHash('sha256').update(body).digest('hex');
  const stringToSign = ['POST', contentHash, '', url].join('\n');
  const signStr = clientId + accessToken + timestamp + stringToSign;
  return crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();
}

module.exports = async (req, res) => {
  // 1. Wajib Set Header CORS (Membenarkan Panggilan dari App Anda)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const t = Date.now().toString();

    // 2. Dapatkan Access Token dari Tuya Cloud
    const tokenUrl = '/v1.0/token?grant_type=1';
    const tokenSign = calcSign(CLIENT_ID, CLIENT_SECRET, t, '', tokenUrl, '');
    
    const tokenRes = await fetch(TUYA_BASE_URL + tokenUrl, {
      method: 'GET',
      headers: {
        'client_id': CLIENT_ID,
        'sign': tokenSign,
        't': t,
        'sign_method': 'HMAC-SHA256'
      }
    });
    
    const tokenData = await tokenRes.json();
    if (!tokenData.success) {
      return res.status(500).json({ success: false, msg: 'Gagal Dapatkan Token Tuya', detail: tokenData });
    }

    const accessToken = tokenData.result.access_token;

    // 3. Hantar Arahan UNLOCK (Buka Pintu)
    const cmdUrl = `/v1.0/devices/${DEVICE_ID}/commands`;
    const bodyStr = JSON.stringify({ commands: [{ code: 'remote_unlock', value: true }] });
    const cmdSign = calcSign(CLIENT_ID, CLIENT_SECRET, t, accessToken, cmdUrl, bodyStr);

    const cmdRes = await fetch(TUYA_BASE_URL + cmdUrl, {
      method: 'POST',
      headers: {
        'client_id': CLIENT_ID,
        'access_token': accessToken,
        'sign': cmdSign,
        't': t,
        'sign_method': 'HMAC-SHA256',
        'Content-Type': 'application/json'
      },
      body: bodyStr
    });

    const cmdData = await cmdRes.json();

    // 4. AUTOLOCK BACKUP (Mengunci semula pintu secara automatik selepas 5 Saat)
    setTimeout(async () => {
      const lockBody = JSON.stringify({ commands: [{ code: 'remote_unlock', value: false }] });
      const lockSign = calcSign(CLIENT_ID, CLIENT_SECRET, Date.now().toString(), accessToken, cmdUrl, lockBody);
      await fetch(TUYA_BASE_URL + cmdUrl, {
        method: 'POST',
        headers: {
          'client_id': CLIENT_ID,
          'access_token': accessToken,
          'sign': lockSign,
          't': Date.now().toString(),
          'sign_method': 'HMAC-SHA256',
          'Content-Type': 'application/json'
        },
        body: lockBody
      });
      console.log("[AUTOLOCK]: Pintu dikunci semula secara automatik.");
    }, 5000); // 5000ms = 5 Saat

    return res.status(200).json({ status: "Berjaya", success: true, tuya: cmdData });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
