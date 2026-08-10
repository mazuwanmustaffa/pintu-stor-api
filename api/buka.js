const crypto = require('crypto');
const https = require('https');

const CLIENT_ID = '5apwu48xt5spexaxh5sf';
const CLIENT_SECRET = 'eeb83dbad3624ec19b74a72b989d6f8f';
const DEVICE_ID = 'a349e338f1fd700cc8u0xo';
const TUYA_HOST = 'openapi.tuyain.com'; // ✅ Endpoint Singapore / India Data Center Rasmi

function calcSign(clientId, secret, t, accessToken = '', stringToSign = '') {
  const str = clientId + accessToken + t + stringToSign;
  return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const t = Date.now().toString();

    // 1. Dapatkan Token
    const tokenPath = '/v1.0/token?grant_type=1';
    const stringToSignToken = `GET\n${crypto.createHash('sha256').update('').digest('hex')}\n\n${tokenPath}`;
    const tokenSign = calcSign(CLIENT_ID, CLIENT_SECRET, t, '', stringToSignToken);

    const tokenOptions = {
      hostname: TUYA_HOST,
      path: tokenPath,
      method: 'GET',
      headers: {
        'client_id': CLIENT_ID,
        'sign': tokenSign,
        't': t,
        'sign_method': 'HMAC-SHA256'
      }
    };

    const tokenData = await makeRequest(tokenOptions);

    if (!tokenData || !tokenData.success) {
      return res.status(500).json({ status: 'Ralat Token Tuya', details: tokenData });
    }

    const accessToken = tokenData.result.access_token;

    // 2. Hantar Arahan Buka Pintu (ON)
    const cmdPath = `/v1.0/devices/${DEVICE_ID}/commands`;
    const payload = JSON.stringify({
      commands: [{ code: 'switch_1', value: true }]
    });

    const bodyHash = crypto.createHash('sha256').update(payload).digest('hex');
    const stringToSignCmd = `POST\n${bodyHash}\n\n${cmdPath}`;
    const tCmd = Date.now().toString();
    const cmdSign = calcSign(CLIENT_ID, CLIENT_SECRET, tCmd, accessToken, stringToSignCmd);

    const cmdOptions = {
      hostname: TUYA_HOST,
      path: cmdPath,
      method: 'POST',
      headers: {
        'client_id': CLIENT_ID,
        'access_token': accessToken,
        'sign': cmdSign,
        't': tCmd,
        'sign_method': 'HMAC-SHA256',
        'Content-Type': 'application/json'
      }
    };

    const cmdData = await makeRequest(cmdOptions, payload);

    if (cmdData && cmdData.success) {
      return res.status(200).json({
        status: 'Berjaya',
        message: 'EM Lock Tuya fizikal berjaya dipicu secara direct!'
      });
    } else {
      return res.status(500).json({ status: 'Ralat Arahan Tuya', details: cmdData });
    }

  } catch (err) {
    return res.status(500).json({ status: 'Ralat Pelayan', error: err.message });
  }
};
