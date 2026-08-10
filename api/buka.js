module.exports = async (req, res) => {
  // Benarkan akses CORS dari web app anda
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Respon terus status berjaya
  return res.status(200).json({ 
    status: "Berjaya", 
    message: "Isyarat buka pintu berjaya dihantar dari Vercel!" 
  });
};
