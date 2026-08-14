// api/buka.js
module.exports = async (req, res) => {
  // Tetapan CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, bypass-tunnel-reminder');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Memanggil Webhook Home Assistant melalui Localtunnel URL
    const response = await fetch('https://little-parts-itch.loca.lt/api/webhook/buka_pintu_stor', {
      method: 'POST',
      headers: {
        'bypass-tunnel-reminder': 'true' // Elak daripada disekat skrin peringatan localtunnel
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
