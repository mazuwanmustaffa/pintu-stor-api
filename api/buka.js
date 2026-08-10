const axios = require('axios');
const crypto = require('crypto');

const CLIENT_ID = "5apwu48xt5spexrxh5sf";
const SECRET_KEY = "eeb83dbad3624ec19b74a72b989d6f8f";
const DEVICE_ID = "a349e338f1fd700cc8u0xo";
const BASE_URL = "https://openapi.tuyasg.com";

function calcSign(clientId, secret, t, stringToSign) {
    const str = clientId + t + stringToSign;
    return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();
}

function calcSignWithToken(clientId, token, t, stringToSign, secret) {
    const str = clientId + token + t + stringToSign;
    return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();
}

module.exports = async (req, res) => {
    // 🌐 BENARKAN CORS UNTUK WEBSITES ANDA
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 1. Dapatkan Access Token dari Tuya
        const t = Date.now().toString();
        const signUrl = "/v1.0/token?grant_type=1";
        const contentHash = crypto.createHash('sha256').update('').digest('hex');
        const stringToSign = ["GET", contentHash, "", signUrl].join("\n");
        const sign = calcSign(CLIENT_ID, SECRET_KEY, t, stringToSign);

        const tokenRes = await axios.get(`${BASE_URL}${signUrl}`, {
            headers: {
                'client_id': CLIENT_ID,
                'sign': sign,
                't': t,
                'sign_method': 'HMAC-SHA256'
            }
        });

        if (!tokenRes.data.success) {
            return res.status(400).json({ status: "Gagal", msg: tokenRes.data.msg });
        }

        const accessToken = tokenRes.data.result.access_token;

        // 2. Hantar Arahan Buka Pintu
        const tCmd = Date.now().toString();
        const cmdUrl = `/v1.0/devices/${DEVICE_ID}/commands`;
        const bodyObj = { 
            "commands": [
                { "code": "lock_motor_state", "value": true }
            ] 
        };
        const bodyStr = JSON.stringify(bodyObj);
        const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
        const strToSignCmd = ["POST", bodyHash, "", cmdUrl].join("\n");
        const signCmd = calcSignWithToken(CLIENT_ID, accessToken, tCmd, strToSignCmd, SECRET_KEY);

        const cmdRes = await axios.post(`${BASE_URL}${cmdUrl}`, bodyObj, {
            headers: {
                'client_id': CLIENT_ID,
                'access_token': accessToken,
                'sign': signCmd,
                't': tCmd,
                'sign_method': 'HMAC-SHA256',
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json({ status: "Berjaya", result: cmdRes.data });

    } catch (err) {
        return res.status(500).json({ status: "Gagal", error: err.message });
    }
};
