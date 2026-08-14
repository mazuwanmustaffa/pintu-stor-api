// api/buka.js
module.exports = async (req, res) => {
  // Tetapan CORS (Supaya web frontend boleh panggil API ini)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Memanggil Webhook Home Assistant di IP PC anda
    const response = await fetch('http://10.10.20.38:8123/api/webhook/buka_pintu_stor', {
      method: 'POST'
    });

    if (response.ok) {
      return res.status(200).json({ 
        status: 'Berjaya', 
        success: true, 
        msg: 'Arahan buka pintu berjaya dihantar ke Home Assistant!' 
      });
    } else {
      throw new Error(`Home Assistant HTTP Status: ${response.status}`);
    }

  } catch (error) {
    return res.status(500).json({ 
      status: 'Gagal', 
      success: false, 
      error: error.message 
    });
  }
};
