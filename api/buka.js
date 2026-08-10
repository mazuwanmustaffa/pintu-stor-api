module.exports = async (req, res) => {
  // Tetapan CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 🔗 URL Pipedream dari skrin anda
  const PIPEDREAM_URL = "https://eopyp6rs67b3y9e.m.pipedream.net";

  try {
    const response = await fetch(PIPEDREAM_URL, { method: 'GET' });

    if (response.ok) {
      return res.status(200).json({
        status: 'Berjaya',
        message: 'Arahan pemicu pintu fizikal berjaya dihantar ke Pipedream!'
      });
    } else {
      return res.status(500).json({
        status: 'Ralat',
        message: 'Gagal menghubungi Pipedream.'
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 'Ralat Pelayan',
      error: err.message
    });
  }
};
