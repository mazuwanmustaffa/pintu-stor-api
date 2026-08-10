module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const PIPEDREAM_URL = "https://eod6k1beo5cem02.m.pipedream.net";

  try {
    const response = await fetch(PIPEDREAM_URL, { method: 'POST' });
    if (response.ok) {
      return res.status(200).json({ status: 'Berjaya', message: 'EM Lock Fizikal Terbuka!' });
    }
    return res.status(500).json({ status: 'Ralat', message: 'Gagal menghubungi Pipedream' });
  } catch (err) {
    return res.status(500).json({ status: 'Ralat Pelayan', error: err.message });
  }
};
