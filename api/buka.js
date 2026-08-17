module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await fetch('https://oven-bearing-sas-wiring.trycloudflare.com/api/webhook/buka_pintu_stor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return res.status(200).json({ 
      status: 'Berjaya', 
      success: true, 
      msg: 'Arahan Buka Pintu Berjaya Dihantar!' 
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'Gagal', 
      success: false, 
      error: error.message 
    });
  }
};
