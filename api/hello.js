// Simple test endpoint
export default function handler(req, res) {
  // Set CORS headers for GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', 'https://knowndisc2.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    message: 'Hello from PurFood API!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}
