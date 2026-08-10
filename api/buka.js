// api/buka.js
const crypto = require('crypto');

// 🔑 MAKLUAMAT DARI DASHBOARD TUYA ANDA
const CLIENT_ID = '5apwu48xt55pexrxh5sf';
const CLIENT_SECRET = 'eeb83dbad3624ec19b74a72b989d6f8f';
const DEVICE_ID = 'a349e338f1fd700cc8u0xo';

// URL Khusus Singapore Data Center
const TUYA_BASE_URL = 'https://openapi.tuyasgp.com'; 

function calcSign(clientId, secret, t, accessToken = '', url = '', bodyStr = '', method = 'GET') {
  const contentHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
  const stringToSign = [method, contentHash, '', url].join('\n');
  const signStr = clientId + accessToken + t + stringToSign;
  return crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();
}

module.exports = async (req, res) => {
  // 1. Set Header CORS (Permulaan tindak balas)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const t = Date.now().toString();

    // 2. Dapatkan Access Token
    const tokenUrl = '/v1.0/token?grant_type=1';
    const tokenSign = calcSign(CLIENT_ID, CLIENT_SECRET, t, '', tokenUrl, '', 'GET');

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

    // Jika Endpoint Singapore SGP gagal, guna fallback Endpoint US-SG
    if (!tokenData.success && tokenData.code === 1004) {
      console.log('Mencuba endpoint fallback...');
      return res.status(500).json({
        status: 'Gagal',
        msg: 'Sign Invalid: Sila pastikan Service API (IoT Core) di Tuya Developer Console masih Aktif (In Service).',
        detail: tokenData
      });
    }

    if (!tokenData.success) {
      return res.status(500).json({ status: 'Gagal', msg: 'Ralat Tuya Token', detail: tokenData });
    }

    const accessToken = tokenData.result.access_token;

    // 3. Hantar Arahan Buka Pintu (Unlock)
    const cmdUrl = `/v1.0/devices/${DEVICE_ID}/commands`;
    const bodyObj = { commands: [{ code: 'remote_unlock', value: true }] };
    const bodyStr = JSON.stringify(bodyObj);
    const cmdSign = calcSign(CLIENT_ID, CLIENT_SECRET, t, accessToken, cmdUrl, bodyStr, 'POST');

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

    // 4. Autolock Backup (Kunci semula secara automatik selepas 5 Saat)
    setTimeout(async () => {
      try {
        const lockT = Date.now().toString();
        const lockBodyObj = { commands: [{ code: 'remote_unlock', value: false }] };
        const lockBodyStr = JSON.stringify(lockBodyObj);
        const lockSign = calcSign(CLIENT_ID, CLIENT_SECRET, lockT, accessToken, cmdUrl, lockBodyStr, 'POST');

        await fetch(TUYA_BASE_URL + cmdUrl, {
          method: 'POST',
          headers: {
            'client_id': CLIENT_ID,
            'access_token': accessToken,
            'sign': lockSign,
            't': lockT,
            'sign_method': 'HMAC-SHA256',
            'Content-Type': 'application/json'
          },
          body: lockBodyStr
        });
        console.log('[AUTOLOCK]: Pintu dikunci semula secara automatik.');
      } catch (e) {
        console.error('[AUTOLOCK ERROR]:', e);
      }
    }, 5000);

    return res.status(200).json({ status: 'Berjaya', success: true, tuya: cmdData });

  } catch (error) {
    return res.status(500).json({ status: 'Gagal', success: false, error: error.message });
  }
};
