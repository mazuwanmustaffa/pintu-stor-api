module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pipedreamUrl = 'https://eopyp6rs67b3y9e.m.pipedream.net';

  try {
    const response = await fetch(pipedreamUrl);
    return res.status(200).json({ 
      status: "Berjaya", 
      message: "Arahan buka pintu berjaya dihantar ke Pipedream!" 
    });
  } catch (err) {
    return res.status(500).json({ status: "Ralat", message: err.message });
  }
};
