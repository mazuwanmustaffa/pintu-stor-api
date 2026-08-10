// api/buka.js
const crypto = require('crypto');
const https = require('https');

const CLIENT_ID = '5apwu48xt55pexrxh5sf';
const CLIENT_SECRET = 'eeb83dbad3624ec19b74a72b989d6f8f';
const DEVICE_ID = 'a349e338f1fd700cc8u0xo';

// Senarai Host Endpoint Tuya bagi Singapore Data Center
const HOSTS = ['openapi.tuyaus.com', 'openapi.tuyacn.com'];

function tuyaRequest(host, path, method, headers, bodyData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      path: path,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

function calcSign(clientId, secret, t, accessToken = '', url = '', bodyStr = '', method = 'GET') {
  const contentHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
  const stringToSign = [method, contentHash, '', url].join('\n');
  const signStr = clientId + accessToken + t + stringToSign;
  return crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();
}

module.exports = async (req, res) => {
  // Set Header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let activeHost = null;
  let accessToken = null;
  let tokenError = null;

  // 1. Dapatkan Token dengan mencuba Host yang aktif
  for (const host of HOSTS) {
    try {
      const t = Date.now().toString();
      const tokenUrl = '/v1.0/token?grant_type=1';
      const tokenSign = calcSign(CLIENT_ID, CLIENT_SECRET, t, '', tokenUrl, '', 'GET');

      const tokenHeaders = {
        'client_id': CLIENT_ID,
        'sign': tokenSign,
        't': t,
        'sign_method': 'HMAC-SHA256',
        'User-Agent': 'Mozilla/5.0'
      };

      const tokenData = await tuyaRequest(host, tokenUrl, 'GET', tokenHeaders);

      if (tokenData && tokenData.success) {
        activeHost = host;
        accessToken = tokenData.result.access_token;
        break; // Berjaya jumpa Host yang sah
      } else {
        tokenError = tokenData;
      }
    } catch (err) {
      tokenError = err;
    }
  }

  if (!accessToken) {
    return res.status(500).json({ status: 'Gagal', msg: 'Semua Host Tuya Menolak Akses Token', detail: tokenError });
  }

  try {
    const t = Date.now().toString();
    // 2. Hantar Arahan Buka Pintu (Unlock)
    const cmdUrl = `/v1.0/devices/${DEVICE_ID}/commands`;
    const bodyObj = { commands: [{ code: 'remote_unlock', value: true }] };
    const bodyStr = JSON.stringify(bodyObj);
    const cmdSign = calcSign(CLIENT_ID, CLIENT_SECRET, t, accessToken, cmdUrl, bodyStr, 'POST');

    const cmdHeaders = {
      'client_id': CLIENT_ID,
      'access_token': accessToken,
      'sign': cmdSign,
      't': t,
      'sign_method': 'HMAC-SHA256',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
      'User-Agent': 'Mozilla/5.0'
    };

    const cmdData = await tuyaRequest(activeHost, cmdUrl, 'POST', cmdHeaders, bodyStr);

    // 3. Autolock Backup (Kunci semula secara automatik selepas 5 Saat)
    setTimeout(async () => {
      try {
        const lockT = Date.now().toString();
        const lockBodyObj = { commands: [{ code: 'remote_unlock', value: false }] };
        const lockBodyStr = JSON.stringify(lockBodyObj);
        const lockSign = calcSign(CLIENT_ID, CLIENT_SECRET, lockT, accessToken, cmdUrl, lockBodyStr, 'POST');

        const lockHeaders = {
          'client_id': CLIENT_ID,
          'access_token': accessToken,
          'sign': lockSign,
          't': lockT,
          'sign_method': 'HMAC-SHA256',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(lockBodyStr),
          'User-Agent': 'Mozilla/5.0'
        };

        await tuyaRequest(activeHost, cmdUrl, 'POST', lockHeaders, lockBodyStr);
        console.log('[AUTOLOCK]: Pintu dikunci semula secara automatik.');
      } catch (e) {
        console.error('[AUTOLOCK ERROR]:', e);
      }
    }, 5000);

    return res.status(200).json({ status: 'Berjaya', success: true, hostUsed: activeHost, tuya: cmdData });

  } catch (error) {
    return res.status(500).json({ status: 'Gagal', success: false, error: error.message || error });
  }
};
