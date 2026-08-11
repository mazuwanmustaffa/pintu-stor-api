// api/buka.js
const crypto = require('crypto');
const https = require('https');

// 🔑 MAKLUAMAT TUYA API ANDA
const CLIENT_ID = '5apwu48xt55pexrxh5sf';
const CLIENT_SECRET = 'eeb83dbad3624ec19b74a72b989d6f8f';
const DEVICE_ID = 'a349e338f1fd700cc8u0xo';

// HOST KHAS SINGAPORE DATA CENTER
const TUYA_HOST = 'openapi.tuyaus.com';

function tuyaFetch(path, method, headers, bodyData = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TUYA_HOST,
      port: 443,
      path: path,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });

    req.on('error', (e) => reject(e));
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

function buildSign(clientId, secret, t, accessToken = '', path = '', bodyStr = '', method = 'GET') {
  const contentHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
  const stringToSign = [method, contentHash, '', path].join('\n');
  const signStr = clientId + accessToken + t + stringToSign;
  return crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const t = Date.now().toString();

    // 1. Dapatkan Access Token dari Tuya
    const tokenPath = '/v1.0/token?grant_type=1';
    const tokenSign = buildSign(CLIENT_ID, CLIENT_SECRET, t, '', tokenPath, '', 'GET');

    const tokenHeaders = {
      'client_id': CLIENT_ID,
      'sign': tokenSign,
      't': t,
      'sign_method': 'HMAC-SHA256'
    };

    const tokenRes = await tuyaFetch(tokenPath, 'GET', tokenHeaders);

    if (!tokenRes || !tokenRes.success) {
      return res.status(500).json({ status: 'Gagal', msg: 'Gagal Dapatkan Token', detail: tokenRes });
    }

    const accessToken = tokenRes.result.access_token;

    // 2. Hantar Arahan Unlock (Buka Pintu)
    const cmdPath = `/v1.0/devices/${DEVICE_ID}/commands`;
    const bodyObj = { commands: [{ code: 'remote_unlock', value: true }] };
    const bodyStr = JSON.stringify(bodyObj);
    const cmdSign = buildSign(CLIENT_ID, CLIENT_SECRET, t, accessToken, cmdPath, bodyStr, 'POST');

    const cmdHeaders = {
      'client_id': CLIENT_ID,
      'access_token': accessToken,
      'sign': cmdSign,
      't': t,
      'sign_method': 'HMAC-SHA256',
      'Content-Type': 'application/json'
    };

    const cmdRes = await tuyaFetch(cmdPath, 'POST', cmdHeaders, bodyStr);

    // 3. Autolock (Kunci semula secara automatik selepas 5 Saat)
    setTimeout(async () => {
      try {
        const lockT = Date.now().toString();
        const lockBodyObj = { commands: [{ code: 'remote_unlock', value: false }] };
        const lockBodyStr = JSON.stringify(lockBodyObj);
        const lockSign = buildSign(CLIENT_ID, CLIENT_SECRET, lockT, accessToken, cmdPath, lockBodyStr, 'POST');

        const lockHeaders = {
          'client_id': CLIENT_ID,
          'access_token': accessToken,
          'sign': lockSign,
          't': lockT,
          'sign_method': 'HMAC-SHA256',
          'Content-Type': 'application/json'
        };

        await tuyaFetch(cmdPath, 'POST', lockHeaders, lockBodyStr);
      } catch (e) {
        console.error('Autolock error:', e);
      }
    }, 5000);

    return res.status(200).json({ status: 'Berjaya', success: true, tuya: cmdRes });

  } catch (err) {
    return res.status(500).json({ status: 'Gagal', error: err.message || err });
  }
};
